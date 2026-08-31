---
title: 从提交到上线：用 GitHub Actions + 阿里云 ECS 实现可回滚 CI/CD
date: 2026-08-28 14:00:00
updated: 2026-08-28 14:00:00
slug: github-actions-aliyun-ecs-cicd
categories: 工程实践
tags: [CI/CD, GitHub Actions, Nuxt, 阿里云 ECS, 自动部署]
description: 以 Nuxt SSR 博客为例，从 GitHub Actions 构建、SSH/rsync 上传到 ECS，再到 systemd 重启、健康检查和失败回滚，搭建一条真正可用的 CI/CD 流程。
---

很多项目的“部署流程”其实只是把文件上传到服务器，再手动重启进程。它能工作，但很难回答三个问题：这次线上运行的到底是哪一个提交？发布失败时能不能自动恢复？换一台电脑后还能不能稳定发布？

这篇文章以一个 Nuxt SSR 博客为例，使用 GitHub Actions、阿里云 ECS、SSH、rsync 和 systemd，把流程串成一条完整的 CI/CD 链路：

```text
push main/master
    -> GitHub Actions 安装依赖
    -> 构建 Nuxt 生产产物
    -> 检查生产入口是否存在
    -> rsync 上传到独立 release 目录
    -> 切换 current 软链接
    -> systemd 重启服务
    -> curl 健康检查
    -> 成功保留版本，失败自动回滚
```

本文中的示例使用 Node.js 22.19.0、Nuxt 4 和 `/srv/blognuxt` 作为前台部署目录。路径、域名、服务名和 Node 版本可以按你的项目调整。

## 一、先理解 CI/CD 到底解决什么问题

CI 是 Continuous Integration，持续集成。开发者提交代码后，平台自动拉取代码、安装依赖、执行测试和构建，尽早发现问题。

CD 常被拆成两部分：

- Continuous Delivery，持续交付：代码通过检查后，随时可以发布。
- Continuous Deployment，持续部署：代码通过检查后，自动发布到目标环境。

本文实现的是后一种。一次发布至少应该具备下面这些特征：

1. 构建结果来自明确的 Git commit，而不是开发者电脑上的临时文件。
2. 构建失败时不会触碰线上服务。
3. 每个版本存放在独立目录，可以定位和回滚。
4. 重启后必须通过 HTTP 健康检查，不能只看 `systemctl restart` 是否返回成功。
5. 密钥和生产配置只进入 GitHub Secrets 或服务器环境文件，不进入仓库。

## 二、项目和服务器准备

### 1. 确认项目的运行时要求

Nuxt SSR 的生产入口是构建后生成的：

```text
.output/server/index.mjs
```

本项目在 `package.json` 中声明 Node.js 22.19.0 及以上兼容范围。GitHub Actions、服务器和本地验证最好使用同一条 Node 主版本，否则可能出现“本地能构建、CI 不能构建”或“CI 能构建、服务器不能启动”的问题。

本地先验证：

```bash
node --version
npm --version
npm ci
npm run build
test -f .output/server/index.mjs
```

### 2. 安装服务器依赖

以 Ubuntu/Debian 为例，服务器至少需要 Node.js、`curl`、`rsync`、Nginx 和 systemd。Node.js 应使用项目要求的版本。

```bash
sudo apt update
sudo apt install -y curl nginx rsync
node --version
command -v node
```

建议把构建产物和运行时目录分开：

```bash
sudo adduser --system --group --home /srv/blognuxt blognuxt
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG blognuxt deploy

sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt
sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt/releases
sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt/bin
sudo install -d -m 750 /etc/blognuxt
```

`blognuxt` 只负责运行服务，`deploy` 只负责上传和激活版本。部署用户不需要拥有整台服务器的管理权限，只需要被允许重启指定的 systemd 服务。

### 3. 把生产配置放在服务器

Nuxt SSR 会在服务端请求后端 API，因此生产环境不能让 `NUXT_PUBLIC_API_BASE` 为空。可以在服务器创建：

```bash
sudo nano /etc/blognuxt/blognuxt.env
```

```dotenv
NUXT_PUBLIC_API_BASE=http://你的后端地址:8080/api/v1
```

然后限制文件权限：

```bash
sudo chown root:blognuxt /etc/blognuxt/blognuxt.env
sudo chmod 640 /etc/blognuxt/blognuxt.env
```

数据库密码、JWT 密钥、SMTP 授权码等后端配置也应该留在服务器上的环境文件中。`.env` 不应该被 rsync 到 release，也不应该提交到 GitHub。

## 三、配置 GitHub Actions

在仓库的 `Settings -> Secrets and variables -> Actions` 中配置：

| 名称 | 示例 | 作用 |
| --- | --- | --- |
| `ALIYUN_HOST` | `你的 ECS 公网 IP 或域名` | SSH 目标主机 |
| `ALIYUN_USER` | `deploy` | SSH 登录用户 |
| `ALIYUN_DEPLOY_PATH` | `/srv/blognuxt` | ECS 部署根目录 |
| `ALIYUN_SSH_KEY` | OpenSSH 私钥 | GitHub Actions 登录 ECS |
| `ALIYUN_KNOWN_HOSTS` | 已人工确认的主机指纹 | 防止连接到错误的 SSH 主机 |

不要在工作流中使用 `StrictHostKeyChecking=no` 来绕过主机校验。可以先在可信环境人工确认：

```bash
ssh-keyscan -H 你的 ECS 公网 IP
```

确认输出确实属于自己的 ECS 后，再将完整结果保存到 `ALIYUN_KNOWN_HOSTS`。

下面是前台 Nuxt 的核心工作流，文件位置为 `.github/workflows/deploy-aliyun.yml`：

```yaml
name: Deploy blognuxt to Aliyun ECS

on:
  push:
    branches:
      - main
      - master

permissions:
  contents: write

concurrency:
  group: blognuxt-production
  cancel-in-progress: true

jobs:
  deploy:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.19.0
          cache: npm

      - name: Install dependencies
        run: |
          set -Eeuo pipefail
          npm ci --ignore-scripts --include=optional
          ROLLDOWN_VERSION="$(node -p "require('./node_modules/rolldown/package.json').version")"
          npm install --ignore-scripts --no-save --package-lock=false \
            "@rolldown/binding-linux-x64-gnu@${ROLLDOWN_VERSION}"
          npm run postinstall

      - name: Build Nuxt production output
        run: npm run build

      - name: Check build output
        run: test -f .output/server/index.mjs

      - name: Configure SSH
        env:
          ALIYUN_SSH_KEY: ${{ secrets.ALIYUN_SSH_KEY }}
          ALIYUN_KNOWN_HOSTS: ${{ secrets.ALIYUN_KNOWN_HOSTS }}
        run: |
          set -Eeuo pipefail
          : "${ALIYUN_SSH_KEY:?请配置 ALIYUN_SSH_KEY}"
          : "${ALIYUN_KNOWN_HOSTS:?请配置 ALIYUN_KNOWN_HOSTS}"
          install -d -m 700 "$HOME/.ssh"
          printf '%s\n' "$ALIYUN_SSH_KEY" > "$HOME/.ssh/id_ed25519"
          chmod 600 "$HOME/.ssh/id_ed25519"
          printf '%s\n' "$ALIYUN_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"

      - name: Upload and activate release
        env:
          ALIYUN_HOST: ${{ secrets.ALIYUN_HOST }}
          ALIYUN_USER: ${{ secrets.ALIYUN_USER }}
          ALIYUN_DEPLOY_PATH: ${{ secrets.ALIYUN_DEPLOY_PATH }}
          RELEASE_ID: ${{ github.sha }}
        run: |
          set -Eeuo pipefail
          : "${ALIYUN_HOST:?请配置 ALIYUN_HOST}"
          : "${ALIYUN_USER:?请配置 ALIYUN_USER}"
          : "${ALIYUN_DEPLOY_PATH:?请配置 ALIYUN_DEPLOY_PATH}"

          ssh "$ALIYUN_USER@$ALIYUN_HOST" \
            "mkdir -p '$ALIYUN_DEPLOY_PATH/releases/$RELEASE_ID' '$ALIYUN_DEPLOY_PATH/bin'"

          rsync -az --delete -e ssh \
            .output/ \
            "$ALIYUN_USER@$ALIYUN_HOST:$ALIYUN_DEPLOY_PATH/releases/$RELEASE_ID/.output/"

          rsync -az -e ssh \
            deploy/aliyun/activate.sh \
            "$ALIYUN_USER@$ALIYUN_HOST:$ALIYUN_DEPLOY_PATH/bin/activate.sh"

          ssh "$ALIYUN_USER@$ALIYUN_HOST" \
            "chmod 755 '$ALIYUN_DEPLOY_PATH/bin/activate.sh' && '$ALIYUN_DEPLOY_PATH/bin/activate.sh' '$ALIYUN_DEPLOY_PATH' '$RELEASE_ID'"

      - name: Tag deployed release
        run: |
          set -Eeuo pipefail
          RELEASE_TAG="release-$(date -u +%Y%m%d-%H%M%S)-${GITHUB_SHA:0:7}-${GITHUB_RUN_ID}"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git tag --annotate "$RELEASE_TAG" "$GITHUB_SHA" --message "Deploy $RELEASE_TAG"
          git push origin "$RELEASE_TAG"
```

这里有几个容易被忽略的设计：

- `concurrency` 保证同一时间只有一个生产发布，新的提交会取消仍在排队或运行中的旧发布。
- `RELEASE_ID` 使用 commit SHA，使线上目录和代码版本可以互相定位。
- `--delete` 只作用于当前 release 的 `.output` 目录，不会删除服务器上的 `.env`、上传文件或日志。
- 发布成功后创建带注释的 tag，方便在 GitHub 中快速定位“哪个提交已经上线”。

如果你的 `package-lock.json` 是在 macOS 上生成的，Linux runner 可能缺少 Rolldown 的可选原生 binding。上面的安装步骤保留了当前项目针对这一问题的兼容处理；新项目应优先在目标 CI 系统上重新生成并提交正确的 lockfile。

## 四、用 systemd 运行 Nuxt

在仓库中准备 `deploy/aliyun/blognuxt.service.example`：

```ini
[Unit]
Description=blognuxt Nuxt SSR application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=blognuxt
Group=blognuxt
WorkingDirectory=/srv/blognuxt/current
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
EnvironmentFile=-/etc/blognuxt/blognuxt.env
ExecStart=/usr/bin/node /srv/blognuxt/current/.output/server/index.mjs
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

安装并启用：

```bash
sudo install -m 644 deploy/aliyun/blognuxt.service.example \
  /etc/systemd/system/blognuxt.service
sudo systemctl daemon-reload
sudo systemctl enable blognuxt
```

注意 `ExecStart` 中的 Node 路径必须是服务器上 `command -v node` 的真实结果。如果 Node 是通过 nvm 安装的，不能想当然地写成 `/usr/bin/node`。

为了让 `deploy` 只重启这一项服务，可以创建 `/etc/sudoers.d/blognuxt-deploy`：

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart blognuxt, /usr/bin/systemctl status blognuxt
```

修改 sudoers 后用 `visudo` 校验语法。激活脚本使用 `sudo -n`，意味着没有权限时会立即失败，不会在 CI 中等待交互式密码。

## 五、为什么要使用 release 目录和 current 软链接

不要把构建产物直接覆盖正在运行的目录。直接覆盖可能导致服务在某一瞬间读到新旧文件的混合状态，也很难知道上一版本在哪里。

推荐的目录结构如下：

```text
/srv/blognuxt/
├── bin/activate.sh
├── current -> /srv/blognuxt/releases/<commit-sha>
└── releases/
    ├── <old-commit-sha>/.output/
    ├── <previous-commit-sha>/.output/
    └── <current-commit-sha>/.output/
```

激活脚本的关键逻辑是：

```bash
previous_target=""
if [[ -L "$CURRENT_LINK" ]]; then
  previous_target="$(readlink -f "$CURRENT_LINK" || true)"
fi

rollback() {
  echo "发布健康检查失败，开始回滚..." >&2

  if [[ -n "$previous_target" && -d "$previous_target" ]]; then
    ln -sfn "$previous_target" "$CURRENT_LINK"
  else
    rm -f -- "$CURRENT_LINK"
  fi

  sudo -n /usr/bin/systemctl restart blognuxt || true
}

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
sudo -n /usr/bin/systemctl restart blognuxt || {
  rollback
  exit 1
}

healthy=false
for attempt in {1..20}; do
  if curl --fail --silent --show-error --max-time 3 \
      http://127.0.0.1:3000/ >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != true ]]; then
  rollback
  exit 1
fi
```

`ln -sfn` 只切换指向，不修改旧版本目录。新版本启动后，脚本通过本机 HTTP 端口检查服务是否真的能响应；如果 20 次检查都失败，就把 `current` 指回上一个版本并重启服务。

激活脚本还应该校验以下输入，避免 CI 参数错误造成危险操作：

- 部署根目录必须是绝对路径，不能是 `/`，也不能包含 `..`。
- release id 只允许字母、数字、点、下划线和短横线。
- `current` 如果已经存在，必须是软链接。
- release 中必须存在 `.output/server/index.mjs`。
- 清理旧版本时只清理 `releases` 下的旧目录，并保留最近几个版本。

## 六、Nginx 只暴露 80/443

Nuxt 服务只监听 `127.0.0.1:3000`，由 Nginx 反向代理到公网：

```nginx
server {
    listen 80;
    server_name blog.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

检查配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

ECS 安全组只放通 80/443；SSH 22 端口限制为自己的办公 IP；3000 不对公网开放。后端 API 如果和博客共用域名，再单独把 `/api/` 和 `/uploads/` 代理到后端 8080 端口。

## 七、Go 后端如何复用同一套思路

前台上传的是 `.output` 目录，Go 后端上传的是 Linux 二进制，但发布模型完全相同：

```text
push main
    -> go test ./...
    -> CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build
    -> 上传 releases/<commit-sha>/flec-server-linux
    -> 切换运行中的二进制软链接
    -> 重启 flec_blog.service
    -> curl 127.0.0.1:8080
    -> 失败回滚
```

核心构建命令示例：

```bash
go test ./...
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -trimpath -o dist/flec_blog ./cmd
test -x dist/flec_blog
```

后端当前使用已有的 `flec_blog.service`，部署根目录为 `/www/wwwroot/flec_blog`。不要因为前台使用 `/srv/blognuxt`，就把后端也部署到同一目录；两个服务的环境文件、上传目录、日志目录和 systemd 服务应该保持隔离。

## 八、发布和验证

代码合并到 `main` 或 `master` 后：

```bash
git add .
git commit -m "feat: update blog"
git push origin main
```

验证不能只看 GitHub Actions 变绿。建议按照下面的层级检查：

### 1. 构建层

确认 Actions 完成依赖安装、构建和入口文件检查：

```bash
test -f .output/server/index.mjs
```

### 2. 进程层

登录 ECS 查看 systemd 状态和日志：

```bash
sudo systemctl status blognuxt --no-pager
sudo journalctl -u blognuxt -n 100 --no-pager
```

### 3. HTTP 层

先从服务器本机检查应用：

```bash
curl -i http://127.0.0.1:3000/
```

再从公网检查 Nginx、域名和 HTTPS。HTTP 200 只能说明入口可响应，不等于文章详情、评论、图片上传和后端 API 全部正常。

### 4. 业务层

至少手动打开并验证：

- 首页文章列表是否能加载。
- 一篇文章详情页是否能通过 SSR 获取内容。
- 文章搜索、分类和标签是否正常。
- 评论提交是否能到达后端。
- 图片、上传文件和 API 代理路径是否正常。

这几层证据要分开记录：构建成功不代表部署成功，服务健康不代表业务链路成功，公网首页成功也不代表后台写入成功。

## 九、常见故障和排查顺序

### 1. SSR 内存持续增长或请求递归

优先检查 `/etc/blognuxt/blognuxt.env` 中的 `NUXT_PUBLIC_API_BASE`。生产环境不能留空，也不要让 SSR 请求自己代理回前台页面，否则可能形成递归请求。

### 2. 本地能跑，Actions 构建失败

先对比 Node.js 和 npm 版本，再检查 lockfile 是否包含 Linux 所需的可选依赖。不要一上来删除 lockfile；先确认失败是否来自平台原生 binding。

### 3. 上传成功但服务起不来

依次检查：

```bash
readlink -f /srv/blognuxt/current
test -f /srv/blognuxt/current/.output/server/index.mjs
command -v node
sudo journalctl -u blognuxt -n 100 --no-pager
```

重点看 `WorkingDirectory`、`ExecStart`、Node 绝对路径和 `EnvironmentFile`。

### 4. SSH 能登录但 CI 无法重启

检查四件事：

- GitHub Secret 中的私钥对应服务器 `authorized_keys` 中的公钥。
- `ALIYUN_KNOWN_HOSTS` 与当前主机指纹一致。
- `deploy` 用户对 release 目录有写权限。
- sudoers 是否只允许正确的 systemd 服务和正确的 `systemctl` 路径。

### 5. 新提交覆盖了旧发布

检查 GitHub Actions 的 concurrency 配置。生产发布不应该让多个版本同时上传、切换和重启；另外，部署目录必须以 commit SHA 区分，不能所有版本共用一个临时目录。

## 十、回滚演练

自动回滚必须真的演练过，而不是只存在于脚本里。可以在非高峰时间准备一个已知可用的旧 release，确认：

1. 当前版本、上一版本和 `current` 指向清晰可见。
2. 手动停止服务或制造健康检查失败后，脚本会恢复上一版本。
3. 恢复后本机 `curl` 和公网访问都正常。
4. 日志能看出失败版本、回滚动作和恢复版本。

如果需要手动切回某个保留版本，应先确认目录存在，再执行软链接切换和服务重启：

```bash
ls -ld /srv/blognuxt/releases/*
sudo ln -sfn /srv/blognuxt/releases/<known-good-commit> /srv/blognuxt/current
sudo systemctl restart blognuxt
curl --fail http://127.0.0.1:3000/
```

手动回滚后仍然要检查日志，并把故障版本和原因记录下来。回滚是止损手段，不是替代修复。

## 结语

一套可靠的 CI/CD 不在于 YAML 写得多复杂，而在于它是否把“构建、发布、验证、回滚”连成闭环：

```text
代码提交
  -> 可重复构建
  -> 可定位的 release
  -> 原子切换
  -> 真实健康检查
  -> 自动回滚
  -> 可追踪版本 tag
```

当部署流程具备这个闭环后，换电脑不再需要复制生产私钥，发布也不再依赖某个人记住一串手工命令。开发者只需要提交代码，平台负责把经过验证的版本安全地送到服务器；而每一次失败，都应该有清晰的日志、明确的版本和可执行的恢复路径。

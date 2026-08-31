# 阿里云 ECS 自动发布

这套配置适用于当前项目的 Nuxt 4 SSR 部署：

```text
push main
    -> GitHub Actions: npm ci + npm run build
    -> SSH/rsync 上传 .output 到 ECS
    -> 切换 current 软链接
    -> systemd 重启 Nuxt
    -> curl 健康检查失败则自动回滚
```

## 1. 初始化 ECS

下面以 Ubuntu/Debian 系统为例。服务器需要 Node.js 22.19.x、24.11.x 或 26+、`curl`、`rsync` 和 Nginx；Node 版本必须满足项目 `package.json` 中的 engines。

```bash
sudo apt update
sudo apt install -y curl nginx rsync
node --version
command -v node
```

创建只用于部署和运行的用户及目录：

```bash
sudo adduser --system --group --home /srv/blognuxt blognuxt
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG blognuxt deploy
sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt
sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt/releases
sudo install -d -o blognuxt -g blognuxt -m 2775 /srv/blognuxt/bin
sudo install -d -m 750 /etc/blognuxt
```

上面的 `deploy` 是示例名；如果服务器已有部署用户，替换为实际用户名。执行 `usermod` 后需要让该用户重新登录，使新的 `blognuxt` 用户组生效。

把专用部署公钥写入该用户的 `authorized_keys`，对应的私钥只保存到 GitHub Secret `ALIYUN_SSH_KEY`：

```bash
sudo install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

创建生产环境变量文件。`NUXT_PUBLIC_API_BASE` 必须指向实际可访问的后端 API，不能留空；当前项目的 SSR 页面会依赖它请求后端。

```bash
sudo nano /etc/blognuxt/blognuxt.env
```

内容示例：

```dotenv
NUXT_PUBLIC_API_BASE=http://你的后端地址:8080/api/v1
```

```bash
sudo chown root:blognuxt /etc/blognuxt/blognuxt.env
sudo chmod 640 /etc/blognuxt/blognuxt.env
```

## 2. 配置 systemd

把仓库中的 `deploy/aliyun/blognuxt.service.example` 复制到服务器：

```bash
# 在本机项目目录执行
scp deploy/aliyun/blognuxt.service.example deploy@你的 ECS 公网 IP:/tmp/blognuxt.service

# 在 ECS 管理员 shell 执行
sudo install -m 644 /tmp/blognuxt.service /etc/systemd/system/blognuxt.service
```

确认 `ExecStart` 使用的是服务器上 `command -v node` 返回的绝对路径。如果 `systemctl` 不在 `/usr/bin/systemctl`，还需要在 `deploy/aliyun/activate.sh` 中调整 `SYSTEMCTL_BIN` 默认值，然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable blognuxt
```

允许 GitHub Actions 使用的 SSH 用户免密码重启这个服务。先确认 `systemctl` 路径：

```bash
command -v systemctl
```

然后创建 sudoers 文件，把下面的 `deploy` 改成 GitHub Actions 使用的登录用户：

```bash
sudo visudo -f /etc/sudoers.d/blognuxt-deploy
```

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart blognuxt, /usr/bin/systemctl status blognuxt
```

## 3. 配置 Nginx

将域名解析到 ECS 公网 IP，并创建站点配置：

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

检查并重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

ECS 安全组放通 80/443，SSH 22 端口只允许你的办公 IP；3000 只监听 127.0.0.1，不要对公网开放。

## 4. 配置 GitHub Actions Secrets

在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 添加：

| Secret | 示例 | 说明 |
| --- | --- | --- |
| `ALIYUN_HOST` | `39.106.193.56` | ECS 公网 IP 或域名 |
| `ALIYUN_USER` | `deploy` | ECS SSH 用户 |
| `ALIYUN_DEPLOY_PATH` | `/srv/blognuxt` | 部署根目录 |
| `ALIYUN_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----` | 部署用户私钥 |
| `ALIYUN_KNOWN_HOSTS` | `ssh-ed25519 255 ...` | ECS 的 SSH 主机指纹 |

在本机获取主机指纹并人工确认一次：

```bash
ssh-keyscan -H 你的 ECS 公网 IP
```

将确认后的完整输出保存到 `ALIYUN_KNOWN_HOSTS`。不要把私钥或环境变量文件提交到仓库。

## 5. 发布

工作流监听 `main` 和 `master` 主分支。提交并推送到主分支后会自动执行；其他分支需要先合并到其中一个主分支：

```bash
git add .
git commit -m "deploy: update blognuxt"
git push origin main
# 或：git push origin master
```

部署成功后，工作流会在已发布的提交上自动创建递增的带注释 Git tag，格式为 `v1.0.0`、`v1.0.1`、`v1.0.2`……可用它定位线上对应版本。

发布失败时，查看 GitHub Actions 中的 `Deploy blognuxt to Aliyun ECS` 运行记录：

```bash
sudo systemctl status blognuxt --no-pager
sudo journalctl -u blognuxt -n 100 --no-pager
curl -i http://127.0.0.1:3000/
```

部署脚本默认保留最近 5 个版本。可在服务器执行时通过 `KEEP_RELEASES` 调整数量；健康检查地址可通过 `HEALTH_URL` 调整。

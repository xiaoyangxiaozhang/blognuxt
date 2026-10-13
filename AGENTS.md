# AI 协作约定

## Git 提交标题

提交标题必须使用 Conventional Commits 格式：`<类型>(可选范围): <简短说明>`。类型和说明使用英文，范围简短描述受影响的模块；说明使用祈使语气，不加句号。

```text
feat(home): add featured articles
fix(auth): handle expired refresh token
docs: explain local setup
refactor(api): simplify article requests
```

常用类型：

- `feat`：新增兼容功能；部署时升次版本，例如 `v1.0.64` → `v1.1.0`。
- `fix`：修复缺陷；部署时升补丁版本。
- `docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`：对应文档、格式、重构、性能、测试、构建、CI 和杂项；部署时升补丁版本。

不要在提交标题中添加 `!`。不兼容改动需要人工规划主版本号，自动发布工作流会拒绝带 `!` 的标题。部署工作流校验触发发布的提交标题；格式不正确时发布失败。

## 版本递增规范

发布 tag 采用 `v主版本.次版本.补丁版本`，遵循 [SemVer](https://semver.org/lang/zh-CN/)；提交标题使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)。三个仓库独立计版，已发布 tag 不得改写。

| 变更 | 提交类型 | 示例 |
| --- | --- | --- |
| 新增兼容功能 | `feat` | `v1.0.45` → `v1.1.0` |
| 兼容修复、性能优化、重构、样式、文档、测试、构建或发布维护 | `fix`、`perf`、`refactor`、`style`、`docs`、`test`、`build`、`ci`、`chore` | `v1.0.45` → `v1.0.46` |
| 不兼容变更 | 人工规划主版本发布 | `v1.8.7` → `v2.0.0` |

- 次版本递增时补丁归零，主版本递增时次版本和补丁都归零。
- 自动发布按触发提交的标题计算；合并或一次推送多个提交时，触发提交必须表达整个发布的最高变更级别。推荐 squash 合并。
- 以当前仓库最大的正式语义版本为基准，忽略预发布和不规范 tag；不再固定扫描 `v1.0.*`。
- 构建与部署前先校验提交格式。`!`、`BREAKING CHANGE:`、`BREAKING-CHANGE:` 会阻止自动发布，不兼容变更需制定迁移和回滚计划。
- 只有部署及健康检查成功后创建 tag；同一提交重跑复用已有 tag，不重复递增。
- 本地预览下一版本：`bash scripts/release-version.sh HEAD`。

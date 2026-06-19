# AGENTS.md

## 项目概述

腰果文档库 (Cashew Docs) — 基于 Jekyll + Just the Docs 主题的静态文档网站，托管在 `https://docs.cashewteam.top`。主要文档 Cashew Nodes 腰果节点组（Blender 节点组资产库），以及 After Effects / Blender 资源导航页。

## 技术栈

- **静态生成器**: Jekyll 4.3.4 (Ruby)
- **主题**: Just the Docs 0.10.1
- **CSS**: Sass/SCSS
- **模板**: Liquid
- **搜索**: Lunr.js (客户端)
- **部署**: GitHub Actions → GitHub Pages

本项目没有 npm/Node.js 工具链，无需运行 `npm run lint` / `npm run typecheck` 等命令。

## 本地运行

```bash
bundle exec jekyll serve
# 或使用 tools/run.bat
```

构建生产版本：

```bash
bundle exec jekyll build
```

## 内容编写

所有文档内容为简体中文，位于 `docs/` 目录下，使用 Markdown + YAML front matter。

### Front Matter 约定

```yaml
---
title: 页面标题
date: 2025-07-15 19:00:00 +800
parent: 父页面标题    # 建立导航层级
nav_order: 1          # 同级页面排序
---
```

### 导航系统

- **`nav_order`** — 控制侧边栏中页面顺序（数字越小越靠前）
- **`parent`** — 父页面的 `title` 值，用于嵌套层级
- 顶层页面（无 `parent`）按 `nav_order` 排序
- 外部链接在 `_config.yml` 的 `nav_external_links` 中配置

### 目录结构约定

```
docs/
├── 独立页面.md              # 无 parent，用 nav_order 排序
├── 分类目录/
│   ├── index.md             # 分类首页，nav_order + 可选的 parent
│   └── 子页面.md            # parent: "分类标题"
```

### 配置文件

`_config.yml` — 站点标题、颜色方案 (`dark`)、URL、语言 (`zh-CN`)、外部导航链接等。

### 页面目录 (TOC)

大屏幕右侧自动显示当前页面标题目录，由 JavaScript 动态生成。

**全局配置**（`_config.yml`）：

```yaml
toc: true            # 全局启用/禁用
toc_min_level: 2     # 最低标题层级（默认 2，即 h2）
toc_max_level: 4     # 最高标题层级（默认 4，即 h4）
```

**单页覆盖**（在页面 front matter 中设置）：

```yaml
---
title: 示例页面
toc: false           # 在此页面禁用 TOC
toc_min_level: 2     # 仅此页面的最低层级
toc_max_level: 3     # 仅此页面的最高层级
---
```

优先级：页面 front matter > `_config.yml` 全局配置 > 默认值（2/4）。

## 部署

Push 到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages，无需手动操作。

## 注意事项

- 不要添加 npm 包或 Node.js 配置文件
- 自定义样式放在 `_sass/custom/custom.scss`
- 自定义 HTML 片段放在 `_includes/head_custom.html` 或 `_includes/header_custom.html`
- 使用中文文件名和路径时确保 URL 编码正确

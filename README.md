# 缪思 · Muse

一个受经典三栏写作工具启发的本地优先写作应用。界面与素材均为原创实现。

## 运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

## 已实现

- 三栏资料库、文稿列表与沉浸编辑器
- 新建、删除、收藏、归档、分组与全文搜索
- Markdown 快捷格式与 `.md` 导出
- 自动本地保存、字数统计、阅读时间与写作目标
- 专注模式（`⌘/Ctrl + E`）
- 新建文稿（`⌘/Ctrl + N`）、搜索（`⌘/Ctrl + F`）
- 桌面端与手机端响应式布局
- 小说工程分类：前言、序幕、章节、尾声与后记
- 写作素材分类：笔记、角色、地点与情节

当前数据保存在浏览器 `localStorage`。如需作为 macOS 原生应用发布，下一步可以接入 Tauri 与本地 SQLite / iCloud 同步。

## macOS 本地应用

- 双击 `缪思.app` 可直接运行。
- `缪思_0.2.0_AppleSilicon.dmg` 可用于拖入“应用程序”目录安装。
- 当前安装包面向 Apple Silicon（M1/M2/M3/M4）Mac。

桌面端使用 Tauri 封装，应用数据保存在 macOS WebView 的本地应用存储中，不需要登录或联网。

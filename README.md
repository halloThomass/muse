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
- 可安装 PWA，支持 iPhone、Android 与 Windows 浏览器
- Service Worker 离线缓存
- GitHub Actions 自动构建 Windows 安装程序

当前数据保存在每台设备各自的本地存储中，不会自动跨设备同步。重要文稿请另行导出备份。

## 手机与网页版

推送到 GitHub 的 `main` 分支后，`Deploy mobile and web app` 工作流会自动部署 GitHub Pages。

- iPhone：使用 Safari 打开网页，点击“分享”→“添加到主屏幕”。
- Android：使用 Chrome 打开网页，点击“安装应用”。
- Windows：使用 Edge 或 Chrome 打开网页，点击地址栏中的安装按钮。

安装后可独立窗口运行；首次完整打开后支持离线使用。

## Windows 本地应用

`Build Windows app` 工作流在推送 `v*` 标签时自动生成 NSIS `.exe` 安装程序，并附加到对应 GitHub Release。也可以在 GitHub Actions 页面手动触发，安装包会出现在工作流 Artifacts 中。

## macOS 本地应用

- 双击 `缪思.app` 可直接运行。
- `缪思_0.3.0_AppleSilicon.dmg` 可用于拖入“应用程序”目录安装。
- 当前安装包面向 Apple Silicon（M1/M2/M3/M4）Mac。

桌面端使用 Tauri 封装，应用数据保存在 macOS WebView 的本地应用存储中，不需要登录或联网。

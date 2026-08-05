# 数学气球射手 - Cloudflare Pages 部署指南

## 项目简介

儿童 100 以内加减乘除口算练习游戏。参考「气球射手」打字游戏架构开发，复用其用户系统和排行榜后端（通过 `game` 参数区分两个游戏的排行榜数据）。

## 本地运行

直接用浏览器打开 `index.html` 即可。由于游戏使用相对路径 API（`/api/auth`、`/api/leaderboard`），本地运行时会自动 fallback 到 localStorage，不影响单机测试。

## 部署步骤

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Init: 数学气球射手 - 100以内加减乘除口算练习"
git remote add origin git@github.com:你的用户名/math-game.git
git push -u origin master
```

### 2. 连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → **创建应用程序** → **Pages** → **连接到 Git**
3. 选择 math-game 仓库
4. 配置：
   - **项目名称**: `math-game`
   - **生产分支**: `master`
   - **构建命令**: 留空
   - **构建输出目录**: 留空
5. 点击 **保存并部署**

### 3. 绑定 KV 命名空间（关键！）

排行榜和用户数据存储在 Cloudflare KV 中：

1. **Workers & Pages** → **KV** → 创建命名空间（名称：`leaderboard`）
2. 进入 math-game 项目 → **设置** → **Functions**
3. **KV 命名空间绑定** → **添加绑定**：
   - **变量名称**: `LEADERBOARD_KV`
   - **KV 命名空间**: `leaderboard`
4. 保存后点击 **重新部署**

### 4. 验证

打开 `https://math-game.pages.dev`：
- 登录/注册功能正常
- 四则运算可全选/部分选择
- 三档难度切换
- 中文读题（女声读题、男声读答案）
- 排行榜独立于打字游戏

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 游戏主页面（题目生成器、数字输入、中文读题、运算勾选、三档难度） |
| `style.css` | 样式表（蓝色系主题） |
| `functions/api/auth.js` | 用户认证 API（与打字游戏共用用户表） |
| `functions/api/leaderboard.js` | 排行榜 API（`?game=math` 区分，与打字游戏排行榜隔离） |
| `_headers` | Cloudflare Pages HTTP 头配置 |

## 与打字游戏的差异

| 项目 | 打字游戏 | 数学游戏 |
|------|---------|---------|
| 输入 | 字母 `[a-zA-Z]` | 数字 `[0-9]` |
| 匹配 | 单词匹配 | 答案匹配（`answer === parseInt(typedBuffer)`） |
| 题目 | 词库 `word-bank.js` | 动态算式生成器 |
| 发音 | 英语男女声 | 中文女声读题 / 男声读答案 |
| 难度 | 1-6 年级 | 简单/中等/困难 三档 |
| 排行榜 | `?game=typing`（默认） | `?game=math` |

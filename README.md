# OptoReview — 光学论文投稿预审平台

> **投稿之前，先听审稿人怎么说。**
>
> 针对光学、光电子学与光学工程领域的 AI 顶刊编辑预审服务。
> 上传文稿，获取资深编辑视角的深度评价、尖锐质疑与完善建议。
>
> **作者**：西湖大学仇旻教授（使用 Kimi AI 工具创建）

---

## 目录

- [项目介绍](#项目介绍)
- [主要功能](#主要功能)
- [技术栈](#技术栈)
- [开发环境搭建](#开发环境搭建)
- [项目结构说明](#项目结构说明)
- [构建和部署](#构建和部署)
- [常见修改指南](#常见修改指南)
- [访问日志（管理员功能）](#访问日志管理员功能)
- [故障排除](#故障排除)

---

## 项目介绍

OptoReview 是一个面向光学、光电子学与光学工程领域的 AI 驱动论文预审分析平台。研究者可以上传论文 PDF 或 DOCX 文件，系统会自动提取标题和摘要，并调用 AI 大模型生成三份专业预审报告：

1. **评价报告** — 从标题、摘要、创新点、实验数据等维度全面评价
2. **质疑报告** — 模拟顶刊审稿人视角提出尖锐问题
3. **完善建议** — 针对质疑给出具体修改方案和时间表

平台支持 5 个主流 AI 提供商（Kimi、Gemini、Claude、DeepSeek、OpenAI），用户可自行选择模型并输入自己的 API Key。期刊推荐采用业界标准的 **8 级体系**，从顶级综合刊（Nature/Science）到本领域核心期刊，确保推荐的专业性。

### 核心特点

- **纯前端实现**：无需后端服务器，所有文件解析在前端完成
- **隐私安全**：论文内容仅在用户浏览器中解析，直接发送至用户选择的 AI 服务商
- **自动保存**：分析过程中可离开页面，自动保存/恢复分析状态
- **专业报告**：AI 思考过程可视化（`<think>` 标签），报告可导出 Markdown 和 PDF
- **多模型支持**：支持 5 个 AI 提供商，随时切换

---

## 主要功能

| 功能 | 说明 |
|------|------|
| 文件上传 | 支持 PDF、DOCX 格式，最多同时上传 10 个文件 |
| 智能解析 | 前端自动提取标题和摘要（支持多行标题合并） |
| AI 模型配置 | 选择提供商、模型、输入自定义 API Key 和 Base URL |
| 三份报告 | 顺序生成评价报告 → 质疑报告 → 完善建议 |
| AI 思考过程 | 流式输出，实时展示 AI 的 `<think>` 思考过程 |
| 期刊推荐 | 按 8 级体系（顶级综合刊 → 本领域核心）推荐目标期刊 |
| 状态持久化 | localStorage 自动保存，页面刷新可恢复 |
| 报告导出 | 支持 Markdown 导出和浏览器打印 PDF |
| 响应式设计 | 适配桌面端和移动端 |
| 访问日志 | 可选的 Cloudflare Worker 访问统计（管理员功能） |

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.2.0 | UI 框架 |
| TypeScript | ~5.9.3 | 类型安全 |
| Vite | ^7.2.4 | 构建工具 |
| Tailwind CSS | ^3.4.19 | 原子化 CSS |

### UI 组件与样式

| 技术 | 版本 | 用途 |
|------|------|------|
| shadcn/ui | — | 基础 UI 组件库（Dialog、Tabs、Accordion 等） |
| Radix UI | ^1.x | shadcn/ui 底层（30+ 组件） |
| Framer Motion | ^12.38.0 | React 组件动画 |
| GSAP | ^3.15.0 | 复杂时间线动画（Hero 区域） |
| lucide-react | ^0.562.0 | 图标库 |

### 文件解析与报告

| 技术 | 版本 | 用途 |
|------|------|------|
| pdfjs-dist | ^5.6.205 | PDF 文本提取（静态导入） |
| mammoth | ^1.12.0 | DOCX 文本提取 |
| react-markdown | ^10.1.0 | Markdown 渲染 |
| remark-gfm | ^4.0.1 | GitHub 风格 Markdown 扩展 |
| jspdf | ^4.2.1 | PDF 导出 |
| html2canvas | ^1.4.1 | HTML 转 Canvas（PDF 导出辅助） |

### 路由与状态

| 技术 | 版本 | 用途 |
|------|------|------|
| react-router | ^7.6.1 | 前端路由（HashRouter） |
| zod | ^4.3.5 | 表单验证 |
| react-hook-form | ^7.70.0 | 表单管理 |

### 动画增强

| 技术 | 版本 | 用途 |
|------|------|------|
| @gsap/react | ^2.1.2 | GSAP React 集成 |
| @studio-freight/lenis | ^1.0.42 | 平滑滚动 |

---

## 开发环境搭建

### 前提条件

- **Node.js**: 18.0 或更高版本（推荐 20.x LTS）
- **npm**: 9.0 或更高版本（随 Node.js 附带）

验证安装：

```bash
node -v   # 应输出 v18.x.x 或更高
npm -v    # 应输出 9.x.x 或更高
```

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd app
```

2. **安装依赖**

```bash
npm install
```

安装过程可能需要 2-5 分钟，取决于网络速度。

3. **启动开发服务器**

```bash
npm run dev
```

默认在 `http://localhost:3000` 启动，浏览器会自动打开。

> 开发服务器特性：
> - 修改文件后自动刷新（HMR）
> - TypeScript 类型错误实时提示
> - 源代码映射（Source Map）便于调试

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，包含：
- 静态 HTML、CSS、JS 文件
- 优化后的资源（代码压缩、Tree Shaking）
- 可直接部署到任何静态文件服务器

### 本地预览生产构建

```bash
npm run preview
```

在本地模拟生产环境，用于部署前的最终检查。

---

## 项目结构说明

```
/mnt/agents/output/app/
├── public/                          # 静态资源（favicon、图片等）
├── workers/                         # Cloudflare Worker（访问日志后端）
│   └── analytics-worker.js          # 访问日志收集 Worker（可选）
├── src/
│   ├── sections/                    # 页面区块组件
│   │   ├── Hero.tsx                 # 首页首屏（含 GSAP 动画）
│   │   ├── Workflow.tsx             # 工作流程展示（3步骤）
│   │   ├── ReportPreview.tsx        # 报告预览卡片
│   │   ├── Trust.tsx                # 信任指标/数据展示
│   │   ├── FAQ.tsx                  # 常见问题解答
│   │   ├── AppSection.tsx           # 核心应用（上传+分析+报告）
│   │   ├── AdminPanel.tsx           # 管理员面板（访问日志查看）
│   │   ├── Navbar.tsx               # 导航栏
│   │   └── Footer.tsx               # 页脚
│   ├── components/                  # 可复用组件
│   │   ├── ModelConfigPanel.tsx     # AI 模型配置面板
│   │   ├── Layout.tsx               # 布局组件
│   │   └── ui/                      # shadcn/ui 组件库
│   │       ├── button.tsx
│   │       ├── tabs.tsx
│   │       ├── dialog.tsx
│   │       └── ...                  # 30+ 个 Radix UI 封装组件
│   ├── utils/                       # 核心工具模块
│   │   ├── prompts.ts               # AI 提示词 + 期刊数据库（8级体系）
│   │   ├── llmAdapter.ts            # 多模型 API 适配（5个提供商）
│   │   ├── fileParser.ts            # PDF/DOCX 文件解析 + 标题摘要提取
│   │   ├── reportGenerator.ts       # 离线报告生成（无 AI 时备用）
│   │   ├── persistence.ts           # localStorage 状态持久化
│   │   ├── textProcessor.ts         # 文本处理工具
│   │   └── analytics.ts             # 访问日志上报（可选）
│   ├── pages/                       # 页面级组件
│   │   └── Home.tsx                 # 首页（组合所有 sections）
│   ├── hooks/                       # 自定义 React Hooks
│   ├── lib/                         # 工具函数库
│   ├── data/                        # 静态数据
│   ├── App.tsx                      # 路由配置（HashRouter）
│   ├── main.tsx                     # 入口文件
│   └── index.css                    # 全局样式 + CSS 变量 + Markdown 样式
├── index.html                       # HTML 模板
├── package.json                     # 依赖配置
├── vite.config.ts                   # Vite 构建配置
├── tailwind.config.js               # Tailwind CSS 配置
└── tsconfig.json                    # TypeScript 配置
```

### 关键文件说明

| 文件 | 作用 | 修改频率 |
|------|------|----------|
| `src/utils/prompts.ts` | AI 提示词、期刊数据库（8级体系） | 高 |
| `src/utils/llmAdapter.ts` | AI 模型配置（5个提供商的 URL、模型列表） | 中 |
| `src/utils/fileParser.ts` | PDF/DOCX 解析逻辑 | 低 |
| `src/utils/persistence.ts` | 自动保存/恢复逻辑 | 低 |
| `src/index.css` | 全局样式、Markdown 报告样式、CSS 变量 | 中 |
| `tailwind.config.js` | 主题配置（颜色、字体、动画、阴影） | 中 |
| `src/sections/AppSection.tsx` | 核心应用界面（上传、配置、报告展示） | 低 |
| `src/components/ModelConfigPanel.tsx` | AI 模型选择面板 | 中 |

---

## 构建和部署

### 生产构建

```bash
# 1. 确保依赖已安装
npm install

# 2. 执行构建
npm run build

# 3. 构建产物在 dist/ 目录
ls dist/
# 输出：index.html  assets/  ...
```

### 部署方式

本项目是纯前端静态网站，可部署到任何静态文件托管服务。

#### 方式一：Nginx/Caddy 服务器

将 `dist/` 目录内容上传到服务器的网站根目录：

```bash
# Nginx 配置示例
server {
    listen 80;
    server_name optoreview.example.com;
    root /var/www/optoreview;
    index index.html;

    # SPA 路由支持（HashRouter 不需要此配置，但推荐保留）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 方式二：Cloudflare Pages

```bash
# 1. 构建
npm run build

# 2. 通过 Cloudflare Dashboard 上传 dist/ 文件夹
# 或 Wrangler CLI:
npx wrangler pages deploy dist --project-name=optoreview
```

#### 方式三：GitHub Pages

项目已使用 `HashRouter`（而非 BrowserRouter），天然兼容 GitHub Pages 的子路径部署。

```bash
# vite.config.ts 中已配置 base: './'
# 构建后可直接部署到任意子路径
```

#### 方式四：Vercel / Netlify

连接 Git 仓库后自动部署，构建命令设为 `npm run build`，输出目录设为 `dist`。

### 环境变量

本项目**无需后端环境变量**。所有 AI 相关的配置（API Key、Base URL）均由用户在前端界面输入，存储在浏览器 localStorage 中。

| 配置项 | 存储位置 | 说明 |
|--------|----------|------|
| API Key | 浏览器内存（不持久化） | 用户每次输入，页面刷新后需重新输入 |
| Base URL | 浏览器内存 | 可选，默认使用各提供商官方地址 |
| 模型选择 | localStorage | 记住用户上次选择的模型 |
| 报告状态 | localStorage | 自动保存分析进度 |

> **安全提示**：API Key 仅保存在浏览器内存中，不会发送到除用户选择的 AI 服务商之外的任何服务器。论文内容直接从前端发送到对应的 AI API，不经过任何中间服务器。

---

## 常见修改指南

### 一、如何修改期刊数据库

**目标文件**：`src/utils/prompts.ts`

期刊数据库定义在第 13-68 行的 `JOURNAL_DATABASE` 常量中，采用 **8 级体系**：

```
顶级综合刊 → Nature大子刊 → 准大子刊 → 光学顶刊 → 准顶刊 → 光学强刊 → 光学好刊 → 本领域核心
```

**修改示例** — 添加新期刊到"光学强刊"层级：

```typescript
// src/utils/prompts.ts 第 44-52 行
### 光学强刊 / 学科强刊 / 综合强刊
光学类:
- Photonics Research (IF~7.2), Laser & Photonics Reviews (IF~10)
- Ultrafast Science, APL Photonics (IF~5.3)
- ACS Photonics (IF~6.7), Nanophotonics (IF~6.6)
- Advanced Optical Materials (IF~7.2), Light: Advanced Manufacturing
- 你的新期刊 (IF~x.x)    // ← 在这里添加
交叉类:
- Nano Energy (IF~17), Small Methods, EPJ Quantum Technology
```

**注意**：
- 修改后同步更新 `JOURNAL_TIER_DESCRIPTION`（第 73-84 行），确保描述性名称一致
- 不需要修改代码逻辑，AI 会自动读取更新后的数据库

### 二、如何修改 AI 模型配置

**目标文件**：`src/utils/llmAdapter.ts`

#### 2.1 添加新模型到现有提供商

```typescript
// src/utils/llmAdapter.ts 第 39-40 行（以 Kimi 为例）
kimi: {
  // ...
  models: ['kimi-k2.6', 'kimi-k2.5', 'kimi-k2.5-long'],  // ← 添加新模型
  // ...
},
```

#### 2.2 修改默认模型

```typescript
// 第 38 行
defaultModel: 'kimi-k2.6',  // ← 修改默认使用的模型
```

#### 2.3 修改 API 地址

```typescript
// 第 37 行
defaultBaseUrl: 'https://api.moonshot.cn/v1',  // ← 修改官方 API 地址
```

### 三、如何修改 AI 提示词

**目标文件**：`src/utils/prompts.ts`

三个报告分别对应三个函数：

| 函数 | 行号范围 | 用途 |
|------|----------|------|
| `buildEvaluationPrompt()` | 149-176 | 评价报告提示词 |
| `buildCritiquePrompt()` | 181-208 | 质疑报告提示词 |
| `buildImprovementPrompt()` | 213-246 | 完善建议提示词 |

**修改示例** — 在评价报告中增加新的评价维度：

```typescript
// src/utils/prompts.ts 第 158-171 行
export function buildEvaluationPrompt(paperExtract: string): PromptPair {
  // ...
  请从以下维度进行评价：

  1. **标题与摘要评估**：...
  2. **文献综述评估**：...
  3. **创新点分析**：...
  4. **实验/理论分析**：...
  5. **你的新维度**：在这里添加新的评价维度  // ← 添加
  6. **期刊层级推荐**：...
  7. **总体评价**：...
  // ...
}
```

#### 修改系统角色设定

系统角色提示词在第 89-99 行的 `SYSTEM_ROLE_PROMPT` 常量中：

```typescript
// 第 89-99 行
export const SYSTEM_ROLE_PROMPT = `你是一位资深的学术预审专家，专注于...`;
```

修改此处的专业领域描述，可以调整 AI 的评审风格和专业方向。

#### 修改思考过程指令

`THINKING_INSTRUCTION` 常量（第 109-130 行）控制 AI 的输出格式，要求 AI 在正式报告前先输出 `<think>...</think>` 包裹的思考过程。

### 四、如何修改 UI 样式

#### 4.1 修改主题颜色

**目标文件**：`src/index.css`

```css
/* src/index.css 第 6-22 行 */
:root {
  --color-primary: #0E6B5E;        /* 主色调（品牌绿） */
  --color-primary-hover: #0A5248;  /* 悬停色 */
  --color-primary-light: #E8F3F1;  /* 浅色背景 */
  --color-bg-base: #F7F4F0;        /* 页面背景 */
  --color-bg-panel: #FFFFFF;       /* 面板背景 */
  --color-text-primary: #1A1A1A;   /* 主要文字 */
  --color-text-secondary: #5C5C5C; /* 次要文字 */
  --color-amber: #C8963E;          /* 强调色（琥珀） */
  --color-brown: #8B5E34;          /* 强调色（棕） */
  --color-blue: #2E5A8C;           /* 强调色（蓝） */
}
```

#### 4.2 修改 Markdown 报告样式

同一文件中，`.markdown-report` 类（第 86-258 行）定义了报告的完整样式，包括标题、段落、引用块、表格、列表等。

```css
/* 修改报告正文字号 */
.markdown-report {
  font-size: 15px;   /* ← 修改此处 */
  line-height: 1.8;
}

/* 修改 H1 标题样式 */
.markdown-report h1 {
  font-size: 22px;   /* ← 修改此处 */
  color: var(--color-primary);
}
```

#### 4.3 修改 Tailwind 配置

**目标文件**：`tailwind.config.js`

```javascript
// tailwind.config.js 第 7-11 行
fontFamily: {
  sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
  display: ["'Playfair Display'", 'Georgia', 'serif'],  // 标题字体
},
```

### 五、如何添加新的 AI 提供商

**目标文件**：`src/utils/llmAdapter.ts`

#### 步骤 1：定义新提供商的类型

```typescript
// 第 5 行，添加新类型
export type ModelProvider = 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'openai' | 'qwen';  // ← 添加 'qwen'
```

#### 步骤 2：在 PROVIDER_CONFIGS 中添加配置

```typescript
// 第 31-87 行之间添加
const PROVIDER_CONFIGS: Record<ModelProvider, { ... }> = {
  // ... 现有 5 个提供商

  qwen: {                                           // ← 新增
    label: '通义千问',
    description: 'Qwen2.5 · 72B · 中文优化',
    icon: '🌟',
    brandColor: '#615ced',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen2.5-72b-instruct',
    models: ['qwen2.5-72b-instruct', 'qwen2.5-14b-instruct'],
    keyPrefix: 'sk-',
    keyHint: '阿里云 Dashscope API Key',
  },
};
```

#### 步骤 3：在 streamChat 函数中添加路由

```typescript
// 第 348-359 行
switch (provider) {
  case 'claude':
    generator = streamClaude(...);
    break;
  case 'gemini':
    generator = streamGemini(...);
    break;
  case 'qwen':                                    // ← 新增
    generator = streamOpenAICompatible(...);      // 如果兼容 OpenAI 格式
    break;
  default:
    generator = streamOpenAICompatible(...);
    break;
}
```

> **注意**：如果新提供商的 API 格式与 OpenAI 兼容（大部分国产模型都兼容），则可以直接使用 `streamOpenAICompatible` 函数，无需额外编写流处理逻辑。

#### 步骤 4：在 ModelConfigPanel.tsx 中添加 UI 展示

```typescript
// src/components/ModelConfigPanel.tsx 第 59-124 行的 PROVIDERS 数组中添加
const PROVIDERS = [
  // ... 现有提供商
  {
    key: 'qwen',            // 必须与 llmAdapter.ts 中的类型一致
    icon: '🌟',
    label: '通义千问',
    tag: 'Qwen2.5 · 72B · 中文优化',
    costTag: '按需付费',
    color: '#615ced',
    bgColor: '#F0EFFF',
    borderColor: '#615ced',
  },
];
```

---

## 访问日志（管理员功能）

> **可选功能**：用于收集网站访问统计，帮助了解使用情况。

### 功能说明

- 记录访问量、用户行为路径等匿名统计数据
- 基于 Cloudflare Worker 实现，完全免费
- 数据存储在 Cloudflare D1（SQLite）数据库中
- 提供管理员面板查看统计报表

### Cloudflare Worker 部署步骤

#### 步骤 1：创建 D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create optoreview-analytics

# 记录返回的 database_id，后续步骤需要用到
```

#### 步骤 2：初始化数据库表

```bash
# 执行 schema 初始化
npx wrangler d1 execute optoreview-analytics --file=./workers/schema.sql
```

如果没有 `schema.sql` 文件，可以手动创建：

```sql
-- workers/schema.sql
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 步骤 3：部署 Worker

1. 复制 `workers/analytics-worker.js` 到 Cloudflare Worker 编辑界面
2. 在 Worker 设置中绑定 D1 数据库：
   - 变量名：`DB`
   - 数据库：选择刚创建的 `optoreview-analytics`

或使用 Wrangler CLI：

```bash
# wrangler.toml 配置示例
[[d1_databases]]
binding = "DB"
database_name = "optoreview-analytics"
database_id = "你的-database-id"

# 部署
npx wrangler deploy workers/analytics-worker.js --name optoreview-analytics
```

#### 步骤 4：前端配置环境变量

在前端代码中设置 Worker 地址：

```typescript
// src/utils/analytics.ts
const ANALYTICS_ENDPOINT = 'https://optoreview-analytics.your-account.workers.dev';
```

### 管理员界面访问方式

1. 部署完成后，访问网站的 `/admin` 路径（HashRouter 模式下为 `/#/admin`）
2. 管理员面板展示：
   - 总访问量统计
   - 每日访问趋势
   - 用户行为分布
   - 地理分布统计

---

## 故障排除

### 构建错误

#### 错误：`Cannot find module '@/utils/xxx'`

**原因**：路径别名配置问题。

**解决**：检查 `vite.config.ts` 中的 `resolve.alias` 配置：

```typescript
// vite.config.ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},
```

同时检查 `tsconfig.json` 中的 `paths` 配置是否一致。

#### 错误：`pdfjs-dist` 相关构建警告

**原因**：PDF.js worker 的静态导入警告。

**解决**：此警告不影响功能。如需消除，在 `vite.config.ts` 中添加：

```typescript
build: {
  commonjsOptions: {
    transformMixedEsModules: true,
  },
}
```

#### 错误：TypeScript 类型检查失败

**解决**：

```bash
# 查看详细错误
npx tsc --noEmit

# 如果是第三方库类型缺失，添加声明文件
# src/types/declarations.d.ts
declare module '第三方库名';
```

#### 错误：`npm install` 失败或卡住

**解决**：

```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 或使用国内镜像加速
npm install --registry=https://registry.npmmirror.com
```

### 文件解析问题

#### 问题：PDF 上传后显示"扫描版PDF，无法提取文本"

**原因**：上传的 PDF 是图片格式（扫描件），而非文本 PDF。

**解决**：
1. 使用 OCR 工具（如 Adobe Acrobat、ABBYY FineReader）将扫描版 PDF 转换为可搜索 PDF
2. 或者将论文转换为 DOCX 格式后重新上传

#### 问题：标题提取不正确

**原因**：论文格式特殊（如标题分两行、包含特殊符号等）。

**解决**：
- 检查 `src/utils/fileParser.ts` 中的标题提取逻辑
- 可在文件上传后手动编辑提取的标题

#### 问题：DOC 格式不支持

**原因**：`.doc`（旧版 Word 二进制格式）在浏览器中没有可靠的解析库。

**解决**：将 `.doc` 文件在 Word 或 WPS 中另存为 `.docx` 或 `.pdf` 格式后上传。

### AI 请求问题

#### 问题：API 请求超时

**原因**：网络连接问题或模型响应较慢。

**解决**：
- 检查网络连接
- 尝试切换其他 AI 提供商
- 检查 API Key 是否正确（注意部分 Key 有地区限制）

#### 问题：`CORS` 跨域错误

**原因**：浏览器安全策略阻止直接请求某些 AI API。

**解决**：
- 确认使用的是支持 CORS 的官方 API 地址
- 如使用代理服务器，确保代理配置了正确的 CORS 响应头

### 状态持久化问题

#### 问题：分析中断后无法恢复

**原因**：localStorage 可能被清除或达到容量限制。

**解决**：
- 检查浏览器是否开启了"退出时清除数据"
- 尝试减少同时上传的文件数量
- 手动清理 localStorage：`localStorage.clear()`（会丢失所有保存的状态）

---

## 许可证

本项目由西湖大学仇旻教授创建，仅供学术交流使用。

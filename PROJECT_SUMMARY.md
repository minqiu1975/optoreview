# OptoReview — 项目完整交接文档

**网站地址**: https://f56vsuna3onka.ok.kimi.link  
**作者**: 西湖大学仇旻教授  
**创建工具**: Kimi AI  
**当前版本**: v3.1  
**最后更新**: 2025-05-09

---

## 一、项目概述

OptoReview 是一个光学论文预审分析平台。用户上传 PDF/DOCX 论文后，AI 自动生成三份专业报告：

1. **评价报告** — 创新点评分 + 期刊层级推荐（8级体系）
2. **质疑报告** — 模拟顶刊审稿人视角提出关键问题
3. **完善建议** — 针对性改进方案 + 修改优先级时间表

### 核心功能

| 功能 | 状态 |
|------|------|
| PDF/DOCX 文件解析（最多10个） | ✅ |
| 多模型支持（Kimi/Gemini/Claude/DeepSeek/OpenAI） | ✅ |
| 流式 AI 输出 + 思考过程显示 | ✅ |
| 8级期刊推荐体系 | ✅ |
| 状态持久化（离开页面不丢失） | ✅ |
| Markdown + PDF 导出 | ✅ |
| 停止分析按钮 | ✅ |
| 实验室共享 API Key（密码保护） | ✅ |
| 访问日志（管理员后台） | ✅ |
| 作者署名 | ✅ |

---

## 二、技术栈

- React 19 + TypeScript + Vite v7.2.4
- Tailwind CSS v3.4.19 + shadcn/ui
- Framer Motion + GSAP（动画）
- react-markdown + remark-gfm（Markdown渲染）
- **pdfjs-dist/legacy/build/pdf.mjs**（PDF文本提取）⚠️ 关键配置
- mammoth（DOCX文本提取）
- lucide-react（图标）
- HashRouter（前端路由）
- Browser fetch SSE（AI流式输出）
- localStorage（状态持久化）
- Cloudflare Worker（访问日志后端）

---

## 三、关键配置

### 3.1 环境变量 (.env)

```bash
VITE_ANALYTICS_WORKER_URL=https://optoreview-analytics.minqiu.workers.dev
VITE_ADMIN_PASSWORD=optoreview2025
VITE_ANALYTICS_API_KEY=optoreview_admin_2025
```

### 3.2 实验室 API Key

| 项目 | 值 |
|------|-----|
| 预设 API Key | `sk-A2jpyd8HPkN6ANtnEjbvh3Ric5P4UvhAVJT9fCSa4eZ6AbpE` |
| 访问密码 | `QiuLabOptoReview2026` |
| 代码位置 | `src/components/ModelConfigPanel.tsx` 第 208-262 行 |

---

## 四、项目文件结构

```
/mnt/agents/output/app/
├── public/                    # 静态资源
├── src/
│   ├── sections/
│   │   ├── Hero.tsx           # 首页Hero区域
│   │   ├── Workflow.tsx       # 工作流程展示
│   │   ├── ReportPreview.tsx  # 报告预览卡片
│   │   ├── Trust.tsx          # 信任指标
│   │   ├── FAQ.tsx            # 常见问题
│   │   ├── AppSection.tsx     # 核心应用（~700行，最复杂组件）
│   │   ├── AdminPanel.tsx     # 管理员面板
│   │   └── Footer.tsx         # 页脚
│   ├── components/
│   │   ├── Navbar.tsx         # 导航栏
│   │   ├── Layout.tsx         # 布局组件
│   │   ├── ModelConfigPanel.tsx # AI模型配置面板（含实验室API Key）
│   │   └── ui/                # shadcn/ui组件（~30个）
│   ├── utils/
│   │   ├── prompts.ts         # AI提示词 + 期刊数据库（8级体系）
│   │   ├── llmAdapter.ts     # 多模型API适配（5个提供商）
│   │   ├── fileParser.ts     # PDF/DOCX文件解析（最易出问题）
│   │   ├── persistence.ts    # 状态持久化
│   │   └── analytics.ts      # 访问日志上报
│   ├── App.tsx               # 路由配置
│   ├── main.tsx              # 入口
│   └── index.css             # 全局样式
├── workers/
│   └── analytics-worker.js   # Cloudflare Worker后端代码
├── .env                      # 环境变量
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 五、关键文件内容（必须保留）

### 5.1 src/utils/fileParser.ts — PDF解析

**关键修复（v3.0.4）**:
```typescript
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

let pdfjsReady = false;
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  pdfjsReady = true;
} catch (e) {
  console.warn('PDF.js init warning:', e);
}
```

**⚠️ 绝对不要改回** `import * as pdfjsLib from 'pdfjs-dist'` 或 `workerSrc = ''`，这会导致大文件PDF解析失败。

**标题合并修复**（防止标题和摘要第一句被错误合并）：
```typescript
const startsUppercaseLong = next[0] === next[0].toUpperCase() && next.length > 40;
const abstractOpeners = /^(here|in\s+this|we\s|this\s|interface|experiment|the\s|these\s|our\s|it\s|they\s)/i;
const isAbstractStart = abstractOpeners.test(next);
if (isAbstractStart || startsUppercaseLong) return null; // 阻止合并
```

**无Abstract关键词时的摘要提取**:
```typescript
function extractAbstractNoKeyword(lines: string[], title: string): string {
  // 从标题后到Introduction前提取文本
}
```

### 5.2 src/utils/prompts.ts — 期刊数据库（8级体系）

修正后的层级：

| 层级 | 描述性名称 | 代表期刊 |
|------|-----------|----------|
| T0 | 顶级综合刊 | Nature, Science, Cell |
| T1 | Nature大子刊 | Nature Photonics, Nature Materials, Nature Nanotechnology, Nature Physics, Nature Methods, Nature Electronics, Nature Energy |
| T1-2 | 准大子刊 | eLight, Light: Science & Applications, Advanced Materials, Nature Communications |
| T2 | 光学/学科/综合顶刊 | PhotoniX, Opto-Electronic Science, Advances in Optics and Photonics, Optica, Science Advances, PNAS, NSR, Science Bulletin, PRL, PRX, Advanced Functional Materials, Materials Today |
| T2-2 | 准顶刊 | Advanced Photonics, Opto-Electronic Advances, Nano Letters, ACS Nano, Research, Cell Reports Physical Science |
| T3 | 光学/学科强刊 | Photonics Research, LPR, Ultrafast Science, APL Photonics, ACS Photonics, Nanophotonics, Advanced Optical Materials, Light: Advanced Manufacturing, Nano Energy, Small Methods, EPJ Quantum Technology |
| T4 | 光学好刊 | Optics Express, Optics Letters, Applied Optics, IEEE PTL, JLT, Optical Fiber Technology, Optics Communications, IEEE JSTQE, Progress in Quantum Electronics, Advanced Science, HPLSE, Photonic Sensors, Neurophotonics, Chinese Optics Letters |
| T5 | 本领域核心 | OME, BOE, Journal of Biomedical Optics, Journal of Optics, APL, Journal of Applied Physics, Chinese Journal of Lasers, Laser & Optoelectronics Progress |

**输出规则**：
- 使用描述性文字（"Nature大子刊"、"光学顶刊"），不写 T0/T1 代码
- 不写 ISSN 编号
- 不推荐顶级刊时必须说明原因

### 5.3 src/utils/llmAdapter.ts — 模型配置

支持的模型（最新版）：
- **Kimi**: `kimi-k2-6`（默认）, `kimi-k2`, `moonshot-v1-8k` 等
- **Gemini**: `gemini-2.5-pro-exp-03-25`, `gemini-2.5-flash-preview-05-20` 等
- **Claude**: `claude-sonnet-4-5-20251001` 等
- **DeepSeek**: `deepseek-chat`, `deepseek-reasoner` 等
- **OpenAI**: `gpt-4.1`, `gpt-4.1-mini` 等

### 5.4 src/components/ModelConfigPanel.tsx — 实验室API Key

密码和Key硬编码在组件中（第208-262行）：
```typescript
const LAB_PASSWORD = 'QiuLabOptoReview2026';
const LAB_API_KEY = 'sk-A2jpyd8HPkN6ANtnEjbvh3Ric5P4UvhAVJT9fCSa4eZ6AbpE';
```

---

## 六、已知问题和解决方案

| 问题 | 原因 | 解决 |
|------|------|------|
| PDF大文件解析失败 | pdfjs-dist worker路径配置错误 | 必须使用legacy build + `?url` import |
| 标题和摘要合并 | tryMergeContinuation没有检测摘要开头 | 添加abstractOpeners和startsUppercaseLong检测 |
| 无Abstract关键词时摘要为空 | 只有关键词搜索，没有fallback | 添加extractAbstractNoKeyword函数 |
| TypeScript构建失败（未使用变量） | strict模式 | 用`const [, setX]`解构或`sed`批量替换 |
| 文件尾部被截断 | `sed`或`cat`追加时的编码问题 | 用Python脚本写入完整文件 |

---

## 七、常用维护操作

### 7.1 修改期刊数据库
编辑 `src/utils/prompts.ts` 中的 `JOURNAL_DATABASE` 字符串。

### 7.2 修改AI模型
编辑 `src/utils/llmAdapter.ts` 中的 `PROVIDERS` 数组。

### 7.3 修改提示词
编辑 `src/utils/prompts.ts` 中的 `buildEvaluationPrompt`、`buildCritiquePrompt`、`buildImprovementPrompt` 函数。

### 7.4 修改UI
使用 Tailwind CSS className，全局样式在 `src/index.css` 中定义CSS变量。

### 7.5 修改实验室API Key
编辑 `src/components/ModelConfigPanel.tsx` 中的 `LAB_API_KEY` 和 `LAB_PASSWORD` 常量。

### 7.6 修改管理员密码
编辑 `.env` 文件中的 `VITE_ADMIN_PASSWORD`。

### 7.7 构建部署
```bash
# 1. 进入项目目录
cd /mnt/agents/output/app

# 2. 修改代码后提交
git add -A && git commit -m "描述"

# 3. 创建build worktree
rm -rf $HOME/app-build
git worktree prune
git branch -D build 2>/dev/null
git branch build
bash /app/.agents/skills/webapp-building-swarm/scripts/setup-local.sh build $HOME/app-build

# 4. 修复TypeScript未使用变量（每次构建必须）
cd $HOME/app-build
sed -i 's/getDefaultBaseUrl,/\/\/ getDefaultBaseUrl,/' src/components/ModelConfigPanel.tsx
sed -i 's/const \[paperExtract,/const [, setPaperExtract/' src/sections/AppSection.tsx
sed -i 's/const \[isStreaming,/const [, setIsStreaming/' src/sections/AppSection.tsx
sed -i 's/const \[streamedText,/const [, setStreamedText/' src/sections/AppSection.tsx
sed -i 's/const { html, filename, date }/const { html }/' src/sections/AppSection.tsx
sed -i 's/(s, i) => s/(s) => s/' src/sections/AppSection.tsx

# 5. 构建
npm run build 2>&1

# 6. 部署
rm -rf /mnt/agents/output/app/dist
cp -r $HOME/app-build/dist /mnt/agents/output/app/
# 使用deploy_website工具部署 /mnt/agents/output/app/dist
```

---

## 八、访问日志

### Cloudflare Worker
- Worker URL: `https://optoreview-analytics.minqiu.workers.dev`
- 管理员界面: `https://f56vsuna3onka.ok.kimi.link/#/admin`
- 管理员密码: `optoreview2025`

### Worker配置
- KV Namespace: `ANALYTICS_KV`
- API_KEY: `optoreview_admin_2025`

---

## 九、对话历史摘要

| 阶段 | 内容 |
|------|------|
| v1.0 | 初始网站：上传PDF/Word → AI生成三份报告 |
| v1.1 | 多文件上传（最多10个） |
| v2.0 | 用户自填API Key方案，支持5个AI提供商 |
| v2.1 | 更新所有模型到最新版 |
| v2.2 | 设置Kimi K2.6为默认模型 |
| v2.3 | 修复Kimi 401错误（端点选择器） |
| v2.4 | 添加AI思考过程实时显示 |
| v2.5 | 添加状态持久化（离开页面不丢失） |
| v2.6 | 添加停止分析按钮 |
| v2.7 | 文件解析修复（PDF worker路径、标题提取算法迭代） |
| v2.8 | 期刊数据库更新为8级体系 |
| v2.9 | 添加访问日志（Cloudflare Worker） |
| v3.0 | 修复FDR_V3 PDF解析失败（关键：pdfjs legacy build） |
| v3.1 | 添加实验室共享API Key（密码保护） |

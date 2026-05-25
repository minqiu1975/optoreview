# OptoReview 维护指南

> 本文档面向网站维护人员，涵盖日常维护、功能扩展、数据备份等操作说明。
> 
> **维护前提**：了解基本的 Node.js 和 Git 操作，熟悉项目结构和构建流程。
> 如不熟悉，请先阅读 [README.md](./README.md)。

---

## 目录

- [日常维护](#日常维护)
- [功能扩展](#功能扩展)
- [数据备份](#数据备份)
- [更新日志格式](#更新日志格式)

---

## 日常维护

### 一、如何更新依赖包

#### 查看可更新的依赖

```bash
# 进入项目目录
cd /mnt/agents/output/app

# 查看可更新的包
npm outdated
```

输出示例：

```
Package       Current   Wanted   Latest  Location
react         ^19.2.0   19.2.0   20.0.0  node_modules/react
framer-motion ^12.38.0  12.38.0  13.0.0  node_modules/framer-motion
```

#### 安全更新（不修改大版本号）

```bash
# 只更新 patch 和 minor 版本
npm update
```

#### 更新特定依赖

```bash
# 更新单个包到最新版本
npm install react@latest react-dom@latest

# 更新 TypeScript
npm install typescript@latest --save-dev

# 更新 Vite
npm install vite@latest --save-dev
```

#### 更新后验证

```bash
# 1. 类型检查
npx tsc --noEmit

# 2. 构建测试
npm run build

# 3. 开发服务器测试
npm run dev
```

> **⚠️ 重要**：
> - React 19 升级到 20 等**大版本更新**前，务必查看官方迁移指南
> - Tailwind CSS v3 到 v4 的升级涉及配置文件格式变更，谨慎操作
> - 更新后全面测试文件上传、AI 请求、报告导出等核心功能

---

### 二、如何修改网站内容

#### 1. 修改首页展示内容

**目标文件**：`src/sections/`

| 区块 | 文件 | 修改内容 |
|------|------|----------|
| 首屏标题 | `Hero.tsx` | 主标题、副标题、CTA 按钮文字 |
| 工作流程 | `Workflow.tsx` | 3个步骤的标题和描述 |
| 报告预览 | `ReportPreview.tsx` | 报告卡片的内容示例 |
| 信任指标 | `Trust.tsx` | 数据展示、合作机构信息 |
| 常见问题 | `FAQ.tsx` | FAQ 问题和答案列表 |
| 页脚 | `Footer.tsx` | 联系方式、版权信息、链接 |

**示例** — 修改首页副标题：

```tsx
// src/sections/Hero.tsx 第 102-105 行
<motion.p ...>
  针对光学、光电子学与光学工程领域的 AI 顶刊编辑预审服务。
  <br className="hidden md:block" />
  上传文稿，获取资深编辑视角的深度评价、尖锐质疑与完善建议。
</motion.p>
```

#### 2. 修改作者信息

```tsx
// src/sections/Hero.tsx 第 116-117 行
<span>
  西湖大学仇旻教授用 Kimi AI 工具产生本网站
</span>
```

#### 3. 修改网站标题和元信息

```html
<!-- index.html 第 7-8 行 -->
<title>OptoReview — 光学论文投稿预审平台</title>
<meta name="description" content="面向光学、光电子学与光学工程领域的 AI 顶刊预审平台..." />
```

#### 4. 修改 FAQ 内容

```tsx
// src/sections/FAQ.tsx
// FAQ 数据通常以数组形式定义，例如：
const faqs = [
  {
    question: '我的论文数据是否安全？',
    answer: '论文内容仅在您的浏览器中解析，直接发送到您选择的 AI 服务商...',
  },
  // 在此处添加新的 FAQ 项
  {
    question: '新增的常见问题？',
    answer: '对应的回答内容。',
  },
];
```

---

### 三、如何重新部署

#### 部署流程

```bash
# 1. 拉取最新代码（多人协作时）
git pull

# 2. 安装依赖（如果 package.json 有变化）
npm install

# 3. 类型检查
npx tsc --noEmit

# 4. 生产构建
npm run build

# 5. 构建产物在 dist/ 目录，上传至服务器
# 根据你的部署方式选择以下一种：
```

#### 部署方式选择

| 部署目标 | 命令/操作 |
|----------|-----------|
| Nginx/Caddy 服务器 | `rsync -avz dist/ user@server:/var/www/optoreview/` |
| Cloudflare Pages | `npx wrangler pages deploy dist --project-name=optoreview` |
| Vercel | `npx vercel --prod` |
| Netlify | `npx netlify deploy --prod --dir=dist` |
| GitHub Pages | `git subtree push --prefix dist origin gh-pages` |

> **部署后检查清单**：
> - [ ] 首页正常加载，无白屏
> - [ ] 文件上传功能正常（PDF 和 DOCX）
> - [ ] AI 模型选择面板正常显示
> - [ ] 报告 Markdown 渲染正常
> - [ ] 移动端布局正常

---

## 功能扩展

### 一、如何添加新页面

#### 步骤 1：创建新页面组件

```bash
# 在 src/pages/ 目录下创建新页面
touch src/pages/About.tsx
```

```tsx
// src/pages/About.tsx
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export default function About() {
  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">关于我们</h1>
        <p>页面内容...</p>
      </main>
      <Footer />
    </div>
  );
}
```

#### 步骤 2：添加路由

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import About from './pages/About'  // ← 导入新页面

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />  // ← 添加路由
    </Routes>
  )
}
```

> **注意**：项目使用 `HashRouter`，路由访问形式为 `/#/about`，不需要服务器端配置。

#### 步骤 3：添加导航链接

```tsx
// src/sections/Navbar.tsx 的导航菜单中添加
<a href="/#/about">关于我们</a>
```

---

### 二、如何添加新功能模块

#### 场景：在报告中增加新的分析维度

以添加"图表质量评估"为例：

**步骤 1：在提示词中增加新维度**

```typescript
// src/utils/prompts.ts
// 在 buildEvaluationPrompt() 函数的"报告要求"部分添加：

7. **图表质量评估**：图表是否自明（不看正文能理解）？
   坐标轴标注是否完整？图例是否清晰？配色是否合理？
```

**步骤 2：在 UI 中增加对应的展示区域**

```tsx
// src/sections/AppSection.tsx
// 在报告展示区域添加新的 Tab 或卡片

<TabsContent value="charts">
  <div className="markdown-report">
    {/* 图表评估内容 */}
  </div>
</TabsContent>
```

**步骤 3：测试**

上传测试论文，验证新维度是否正常出现在 AI 生成的报告中。

---

#### 场景：添加新的文件格式支持

以添加 TXT 格式支持为例：

**步骤 1：在文件解析器中添加 TXT 支持**

```typescript
// src/utils/fileParser.ts

// 1. 添加 TXT 解析函数
async function parseTXT(file: File): Promise<ParsedDocument> {
  try {
    const text = await file.text();
    const fullText = text.trim();
    if (!fullText || fullText.length < 30) {
      return fallbackFromFilename(file.name, 'TXT文件内容为空');
    }
    const { title, abstract } = extractTitleAndAbstract(fullText);
    return { title, abstract, fullText, wordCount: fullText.split(/\s+/).length };
  } catch (err) {
    return fallbackFromFilename(file.name, 'TXT解析失败');
  }
}

// 2. 在 parseDocument() 函数中添加路由
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ext === '.pdf') return parsePDF(file);
  if (ext === '.docx') return parseDOCX(file);
  if (ext === '.doc') return parseDOC(file);
  if (ext === '.txt') return parseTXT(file);  // ← 新增
  throw new Error(`不支持的文件格式: ${ext}`);
}
```

**步骤 2：在 UI 中更新文件类型提示**

```tsx
// src/sections/AppSection.tsx
// 找到文件上传区域的提示文字，添加 TXT
<p>支持 PDF、DOCX、TXT 格式，最多 10 个文件</p>
```

---

### 三、如何修改路由

项目使用 `HashRouter`，所有路由在 `src/App.tsx` 中集中管理。

#### 添加嵌套路由

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AdminPanel from './sections/AdminPanel'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPanel />} />
      {/* 重定向：未匹配路由回到首页 */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
```

#### 路由访问方式

| 路由配置 | 实际访问 URL | 说明 |
|----------|-------------|------|
| `/` | `https://example.com/` | 首页 |
| `/admin` | `https://example.com/#/admin` | 管理员面板 |
| `/about` | `https://example.com/#/about` | 关于页面 |

---

## 数据备份

### 需要备份的文件

#### 1. 源代码（必须备份）

```bash
# 整个 src/ 目录
src/
├── sections/
├── components/
├── utils/
├── pages/
├── App.tsx
├── main.tsx
└── index.css

# 配置文件
vite.config.ts
tailwind.config.js
tsconfig.json
package.json
index.html
```

#### 2. 静态资源

```bash
public/
├── images/          # 如果有自定义图片
└── ...
```

#### 3. Cloudflare Worker（如果使用访问日志功能）

```bash
workers/
└── analytics-worker.js
```

### 不需要备份的文件

以下文件可以通过 `npm install` 重新生成，**不需要**纳入备份：

```bash
node_modules/       # 依赖包（通过 package.json 重建）
dist/               # 构建产物（通过 npm run build 重建）
.lock files         # 锁文件应纳入版本控制
```

### 备份策略建议

#### 策略一：Git 版本控制（推荐）

```bash
# 初始化 Git 仓库（如尚未初始化）
git init

# 创建 .gitignore 文件
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
EOF

# 提交所有源代码
git add .
git commit -m "init: initial commit"

# 推送到远程仓库（GitHub / GitLab / Gitee）
git remote add origin <repository-url>
git push -u origin main
```

#### 策略二：定期归档备份

```bash
#!/bin/bash
# backup.sh - 定期备份脚本

BACKUP_DIR="/backup/optoreview"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/mnt/agents/output/app"

# 创建备份
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/optoreview_$DATE.tar.gz \
  -C $SOURCE_DIR \
  src/ public/ workers/ \
  package.json vite.config.ts tailwind.config.js \
  tsconfig.json index.html \
  README.md MAINTENANCE.md

# 保留最近 10 个备份
ls -t $BACKUP_DIR/optoreview_*.tar.gz | tail -n +11 | xargs -r rm

echo "Backup completed: $BACKUP_DIR/optoreview_$DATE.tar.gz"
```

添加到 crontab 实现自动备份：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点自动备份
0 3 * * * /path/to/backup.sh >> /var/log/optoreview_backup.log 2>&1
```

#### 策略三：Cloudflare Pages 版本回退

如果使用 Cloudflare Pages 部署，每次部署都会保留历史版本：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages 项目 → **Deployments**
3. 可以查看所有历史部署，点击任意版本进行回退

### 数据恢复

```bash
# 从 Git 仓库恢复
git clone <repository-url>
cd app
npm install
npm run build

# 从归档恢复
tar -xzf optoreview_20250115_030000.tar.gz
cd app
npm install
npm run build
```

---

## 更新日志格式

### 版本号规则

本项目采用**语义化版本号**（SemVer）：

```
版本格式：主版本号.次版本号.修订号
示例：1.2.3

主版本号（Major）：重大功能变更、架构调整、不兼容的修改
次版本号（Minor）：新增功能、新页面、新模块（向下兼容）
修订号（Patch）：Bug 修复、样式调整、文案修改
```

#### 版本号递增规则

| 场景 | 版本变化 | 示例 |
|------|----------|------|
| 修复 PDF 解析 Bug | 修订号 +1 | 1.2.3 → 1.2.4 |
| 添加新的 AI 提供商 | 次版本号 +1 | 1.2.3 → 1.3.0 |
| 整体 UI 改版 | 主版本号 +1 | 1.2.3 → 2.0.0 |
| 添加管理员面板 | 次版本号 +1 | 1.2.3 → 1.3.0 |
| 修改期刊数据库 | 修订号 +1 | 1.2.3 → 1.2.4 |

### 更新日志模板

创建 `CHANGELOG.md` 文件记录所有版本变更：

```markdown
# 更新日志

## [1.2.3] - 2025-01-15

### 修复
- 修复扫描版 PDF 的错误提示不够明确的问题
- 修复移动端报告导出按钮被遮挡的问题

### 优化
- 优化标题提取算法对多行标题的支持
- 缩短 AI 流式输出的延迟

## [1.2.2] - 2025-01-08

### 新增
- 添加 DeepSeek 模型支持

### 修改
- 更新期刊数据库（新增 3 个期刊）

### 修复
- 修复 DOCX 文件解析时的内存泄漏

## [1.2.1] - 2024-12-20

### 修复
- 修复 localStorage 超出配额时的崩溃问题
- 修复 Safari 浏览器下 Markdown 表格样式异常

## [1.2.0] - 2024-12-15

### 新增
- 添加管理员面板（访问日志查看功能）
- 添加 Cloudflare Worker 访问统计

### 修改
- 优化 AI 提示词，增强期刊推荐的准确性

## [1.1.0] - 2024-12-01

### 新增
- 支持同时上传最多 10 个文件
- 添加报告 PDF 导出功能

### 优化
- 改进文件解析速度（PDF 解析提速 30%）

## [1.0.0] - 2024-11-15

### 初始版本
- 光学论文预审分析平台正式上线
- 支持 PDF/DOCX 文件上传和解析
- 支持 5 个 AI 提供商
- 三份预审报告（评价、质疑、完善建议）
- 8 级期刊推荐体系
```

### Git 提交规范

使用规范的提交信息，便于生成更新日志：

```bash
# 格式：<type>: <description>
# 常用 type：
#   feat     新增功能
#   fix      Bug 修复
#   docs     文档更新
#   style    样式调整（不影响功能）
#   refactor 代码重构
#   chore    构建/依赖更新

git commit -m "feat: add support for TXT file upload"
git commit -m "fix: resolve PDF parsing error for multi-column layout"
git commit -m "docs: update README with new deployment instructions"
git commit -m "style: adjust report heading font size"
git commit -m "chore: update framer-motion to v13"
```

---

## 附录：常用操作速查表

### 日常操作

| 操作 | 命令 |
|------|------|
| 启动开发服务器 | `npm run dev` |
| 生产构建 | `npm run build` |
| 类型检查 | `npx tsc --noEmit` |
| 预览生产构建 | `npm run preview` |
| 安装新依赖 | `npm install 包名` |
| 更新所有依赖 | `npm update` |

### 紧急回滚

```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定版本
git reset --hard <commit-hash>

# 重新构建
npm run build

# 重新部署（根据你的部署方式）
```

### 常见问题快速修复

| 问题 | 解决方案 |
|------|----------|
| 构建失败 | `rm -rf node_modules && npm install && npm run build` |
| 类型错误 | `npx tsc --noEmit` 查看详细错误信息 |
| 样式不生效 | 检查 `tailwind.config.js` 的 `content` 配置是否包含文件路径 |
| AI 无响应 | 检查浏览器控制台网络请求，确认 API Key 和 Base URL 正确 |
| 状态丢失 | 检查 localStorage 是否被浏览器清除，或容量是否已满 |

---

> **文档版本**：v1.0
> **最后更新**：2025-01
> **维护者**：OptoReview 开发团队

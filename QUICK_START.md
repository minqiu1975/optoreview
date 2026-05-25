# OptoReview — 新对话快速上手指南

## 第一步：上传本文件

将 `PROJECT_SUMMARY.md` 和 `SOURCE_CODE_BACKUP.md` 两个文件上传到新对话。

## 第二步：告诉AI助手

> 请继续维护我的OptoReview网站。我已经上传了项目总结文档和源代码备份。网站地址是 https://f56vsuna3onka.ok.kimi.link。请阅读PROJECT_SUMMARY.md了解项目全貌，然后根据我的需求进行修改。

## 第三步：AI助手会自动

1. 读取项目总结和源代码
2. 初始化项目（如果需要重新构建）
3. 根据您的需求修改代码
4. 构建并部署

## 常见需求模板

### 修改期刊数据库
> 请修改期刊推荐层级，将XXX期刊从T2移到T2-2

### 修改AI模型
> 请将Kimi模型更新到最新版，模型ID是xxx

### 修改实验室API Key
> 请更新实验室共享API Key，新Key是sk-xxx，密码保持不变

### 修改UI
> 请在首页添加一个新板块，内容是...

### 修改提示词
> 请修改评价报告的输出格式，要求...

### 修复Bug
> 用户反馈上传某个PDF后标题提取不正确，请修复

## 注意事项

1. **每次修改后必须构建部署**才能生效
2. **TypeScript strict模式**：所有变量必须使用，未使用的变量会导致构建失败。常用修复：
   - `const [x, setX]` → `const [, setX]`
   - `const value = await func()` → `await func()`
   - `(s, i) => s` → `(s) => s`
3. **pdfjs-dist配置绝对不要改**：必须使用 `pdfjs-dist/legacy/build/pdf.mjs` + `pdf.worker.mjs?url`
4. **文件尾部完整性**：修改 `fileParser.ts` 或 `AppSection.tsx` 后务必检查文件尾部是否完整
5. **部署步骤**：
   - 修改代码 → `git commit` → 创建worktree → 修复TS错误 → `npm run build` → 复制dist → 部署

## 项目上下文

```
项目路径: /mnt/agents/output/app
部署路径: /mnt/agents/output/app/dist
网站地址: https://f56vsuna3onka.ok.kimi.link
技术栈: React 19 + TypeScript + Vite + Tailwind CSS
```

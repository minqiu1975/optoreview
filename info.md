# OptoReview — 项目维护更新文档

## 项目概述
- **网站地址**: https://minqiu1975.github.io/optoreview/
- **GitHub 仓库**: https://github.com/minqiu1975/optoreview
- **作者**: 西湖大学仇旻教授（使用 Kimi AI 工具创建）
- **当前版本**: v3.2
- **最后更新**: 2026-05-25

## 技术栈
- React 19 + TypeScript + Vite v7.2.4
- Tailwind CSS v3.4.19 + shadcn/ui
- Framer Motion + GSAP（动画）
- react-markdown + remark-gfm（Markdown渲染）
- pdfjs-dist/legacy/build/pdf.mjs（PDF文本提取）
- mammoth（DOCX文本提取）
- lucide-react（图标）
- HashRouter（前端路由）

## 组件清单（40+）
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
button-group, button, calendar, card, carousel, chart, checkbox, collapsible,
command, context-menu, dialog, drawer, dropdown-menu, empty, field, form,
hover-card, input-group, input-otp, input, item, kbd, label, menubar,
navigation-menu, pagination, popover, progress, radio-group, resizable,
scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

## 项目结构
```
src/sections/        页面区块
src/hooks/           自定义 Hook
src/types/           类型定义
src/App.css          Webapp 样式
src/App.tsx          根 React 组件
src/index.css        全局样式
src/main.tsx         渲染入口
index.html           Webapp 入口
tailwind.config.js   Tailwind 主题配置
vite.config.ts       Vite 构建配置
postcss.config.js    CSS 后处理配置
public/images/       图片资源目录
public/favicon.png   网站 Favicon
```

## 维护更新记录（v3.2）

### 2026-05-25 更新内容
1. **品牌标识**
   - 新增 OptoReview Logo（logo.png）
   - 新增 Favicon 图标（favicon.png）
   - 新增社交媒体预览图（og-image.png）

2. **SEO 优化**
   - 更新 index.html 标题和描述
   - 添加 Open Graph 社交标签
   - 添加 Twitter Card 标签
   - 添加关键词 Meta 标签
   - 添加作者和 Robots 元数据

3. **宣传素材**
   - 生成 4 张宣传海报
     - poster1_ai_review.png — AI 智能预审
     - poster2_three_reports.png — 三份专业报告
     - poster3_privacy.png — 隐私安全
     - poster4_multimodel.png — 五大 AI 模型

4. **文档完善**
   - 新增 SEO_OPTIMIZATION.md 优化方案
   - 更新 info.md 维护文档

## 使用说明
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
```

## 图片资源说明
| 文件名 | 用途 | 尺寸 |
|--------|------|------|
| logo.png | 品牌 Logo | 1024x1024 |
| favicon.png | 网站 Favicon | 1024x1024 |
| og-image.png | 社交媒体预览图 | 1920x1080 |
| poster1_ai_review.png | AI 智能预审海报 | 1920x2560 |
| poster2_three_reports.png | 三份报告海报 | 1920x2560 |
| poster3_privacy.png | 隐私安全海报 | 1920x2560 |
| poster4_multimodel.png | 多模型支持海报 | 1920x2560 |

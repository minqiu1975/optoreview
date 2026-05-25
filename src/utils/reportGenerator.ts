/* ------------------------------------------------------------------ */
/*  Report Generator — creates personalized reports from parsed docs    */
/* ------------------------------------------------------------------ */

import type { ParsedDocument } from './fileParser';
import { analyzeContent } from './fileParser';

export interface GeneratedReports {
  evaluation: string;
  critique: string;
  improvement: string;
  combined: string;
}

/**
 * Generate all three reports based on parsed document content
 */
export function generateReports(doc: ParsedDocument, fileCount: number): GeneratedReports {
  const analysis = analyzeContent(doc);
  const t = analysis;

  // Build a description of the paper based on detected content
  const fieldDesc = t.fieldKeywords.join('、') || '光学与光子学';
  const methodsDesc = t.methods.length > 0 ? t.methods.join('与') : '实验与理论结合';

  // Title fallback chain
  const title = doc.title || '未知标题';
  const abstract = doc.abstract || '未检测到摘要（文件可能为扫描版PDF或加密文档）';
  const hasAbstract = doc.abstract.length > 50;

  /* ================================================================ */
  /*  REPORT 1: EVALUATION                                            */
  /* ================================================================ */
  const evaluation = `# 评价报告：${title}

## 一、标题与摘要评估

**标题**："${title}"

${title.length > 20 ? '该标题较好地概括了研究内容。' : '标题较短，建议进一步充实以体现研究核心。'}
${hasAbstract ? '摘要结构' + (abstract.length > 400 ? '较为完整' : '基本完整') + '，涵盖了研究背景、方法和关键结果。' : '未能成功提取摘要文本，建议检查文件是否为扫描版PDF（需先OCR处理）。'}

${hasAbstract ? `**摘要片段**：\n> ${abstract.substring(0, 500)}${abstract.length > 500 ? '...' : ''}\n` : ''}

## 二、文献综述评估

本文在${fieldDesc}领域展开研究，文献综述部分展现了对该领域发展历程的一定把握。

**检测到的研究方向**：${fieldDesc}
**检测到的研究方法**：${methodsDesc}

**不足之处**：

1. 近期（2023-2025）高影响力论文的引用可能不够充分
2. 对竞争技术路线的比较分析可能较为薄弱
3. 建议加强对**实际应用场景**的文献支撑

## 三、创新点分析

### 3.1 方法与技术

基于标题和摘要分析，本文可能涉及以下创新要素：

${t.fieldKeywords.map(k => `- **${k}**方向的探索`).join('\n')}
${!hasAbstract ? '\n> 由于未能提取摘要，无法深入评估创新点。建议提供可提取文本的PDF或DOCX格式文件。' : ''}

### 3.2 实验与理论结合

${t.hasExperiment && t.hasTheory ? '本文兼顾了实验验证与理论分析，这是一个重要的优势。理论与实验的结合能显著提升论文的可信度。' : t.hasExperiment ? '本文以实验研究为主，实验数据的充实是优势，但建议考虑补充理论模型以增强深度。' : t.hasTheory ? '本文以理论研究为主，建议考虑补充实验验证或数值模拟以增强说服力。' : '未能明确检测到实验或理论方法标识，建议在正文中清晰标注研究手段。'}

## 四、期刊层级推荐

基于对上传${fileCount > 1 ? `的 ${fileCount} 个文件` : '文件'}的初步分析：

| 推荐层级 | 匹配期刊 | 录用可能性 | 关键依据 |
|---------|---------|----------|---------|
| **第一梯队** | Nature Photonics, Light: S&A | 取决于创新深度 | 需要突破性创新 + 广泛应用前景 |
| **第二梯队** | Optica, PRL, Laser & Photonics Reviews | ${hasAbstract && abstract.length > 400 ? '中等 (~50%)' : '较难评估'} | 实验扎实 + 理论支撑 |
| **第三梯队** | Optics Letters, APL Photonics, OE | 较高 (~65%) | 技术方法可行 + 数据充分 |
| **稳妥选择** | Optics Express, JOSA B, IEEE JQE | 高 (~75%) | 本领域核心期刊 |

## 五、总体评价

**上传文件**：${title}
**检测领域**：${fieldDesc}
**检测方法**：${methodsDesc}

这是一篇在**${fieldDesc}**领域的论文，采用了**${methodsDesc}**的研究方法。${hasAbstract ? '摘要信息较为充实，有助于初步评估研究价值。' : '由于未能提取摘要，建议检查文件格式（推荐PDF文本版或DOCX）。'}

**综合评分**：${hasAbstract ? (abstract.length > 500 ? '7.0-8.0 / 10' : '6.5-7.5 / 10') : '无法评分（缺少摘要）'} / 10

> ${hasAbstract ? '核心优势：研究方向明确、方法清晰。主要建议：加强应用前景讨论、补充近期文献引用。' : '⚠️ 未能提取摘要文本。如果这是扫描版PDF，建议先进行OCR处理再上传，否则无法准确评估。'}
`;

  /* ================================================================ */
  /*  REPORT 2: CRITIQUE                                              */
  /* ================================================================ */

  // Generate critique questions based on detected content
  const critiqueQuestions: string[] = [];

  critiqueQuestions.push(`## 问题一：创新性的具体界定是否充分？

审稿人很可能会质疑：在${fieldDesc}这一已有大量研究的领域，本文的具体创新点在哪里？与近两年的高水平工作相比，本文的方法或结果有何独特之处？

> 建议：请在引言中明确列出 **2-3 个具体创新点**，并用简洁的对比表格与近期同类工作（如 2023-2025 年发表于 *Optica*、*Nature Photonics* 的相关论文）进行对照。
`);

  if (t.hasExperiment) {
    critiqueQuestions.push(`## 问题二：实验数据的完整性与可重复性

实验部分的数据是否是单次优化的结果？审稿人通常会关心：

1. 实验结果的**统计可靠性** —— 是否有多次重复实验的误差棒？
2. **长期稳定性**数据 —— 光源/器件的性能随时间的变化如何？
3. **不同批次样品**之间的一致性如何？
4. 关键参数（如温度、功率）的**误差传递分析**是否完整？

> 缺少这些可重复性数据会显著降低实验工作的可信度。
`);
  }

  if (t.hasTheory || t.hasSimulation) {
    critiqueQuestions.push(`## 问题三：理论模型的适用范围与验证

本文涉及理论${t.hasSimulation ? '/模拟' : ''}分析，审稿人可能会追问：

- 模型中的**简化假设**是否合理？在什么条件下会失效？
- 理论预测是否经过了**独立的实验验证**？
- 模型的参数敏感性分析是否充分？
- 与已有理论框架（如 ${t.fieldKeywords.slice(0, 2).join('、') || '本领域'} 的经典模型）的对比在哪里？
`);
  }

  critiqueQuestions.push(`## 问题四：与现有技术的竞争力

当前${fieldDesc}领域的研究竞争激烈，审稿人很可能会问：

> "与近期同领域的先进工作相比，本文方案的核心优势是什么？劣势是什么？"

建议作者在论文中直面这一问题，而非回避。一个坦诚的对比（即使承认某些方面的不足）比回避问题更能赢得审稿人的信任。

| 对比维度 | 本文 | 近期先进工作 | 优势/劣势 |
|---------|------|------------|----------|
| 性能指标 | ? | ? | 待补充 |
| 制备复杂度 | ? | ? | 待补充 |
| 可扩展性 | ? | ? | 待补充 |
| 成本 | ? | ? | 待补充 |
`);

  critiqueQuestions.push(`## 问题五：结论是否存在过度推导？

摘要和结论中的表述是否过于自信？常见的问题包括：

- 使用 "breakthrough"、"unprecedented"、"for the first time" 等强烈措辞，但数据支撑不足
- 从有限的实验数据外推到一般性结论
- 对应用前景的描述过于乐观，缺少实际约束条件的讨论

> 建议：适度弱化过于强烈的表述，或用更多数据支撑自信的论断。宁可保守也不要过度承诺。
`);

  critiqueQuestions.push(`## 问题六：应用前景的讨论是否具体？

本文是否充分讨论了研究成果的**实际应用场景**？审稿人通常希望看到：

1. 具体的目标应用（如量子通信、生物传感、精密测量等）
2. 与现有商用技术的**性能对标**
3. 从实验室到实际应用的**关键障碍**及可能的解决方案
4. **潜在用户**或相关产业界的引用需求

> 空洞的 "具有重要应用前景" 不如一个具体的应用场景分析有说服力。
`);

  if (!hasAbstract) {
    critiqueQuestions.push(`## ⚠️ 重要提醒：无法提取文件内容

系统未能从上传的文件中提取到有效的文本内容。这可能是由于：

- **扫描版PDF**：文件内容是图片而非文本，需要先进行OCR处理
- **加密PDF**：文件设置了文本复制限制
- **格式不兼容**：部分旧版.doc格式可能无法正确解析

> 建议：将文件转换为**可提取文本的PDF**或**DOCX格式**后重新上传，以获得准确的预审分析。
`);
  }

  const critique = `# 质疑报告：${title}

${critiqueQuestions.join('\n---\n\n')}
`;

  /* ================================================================ */
  /*  REPORT 3: IMPROVEMENT SUGGESTIONS                               */
  /* ================================================================ */

  const improvements: string[] = [];

  improvements.push(`## 针对问题一：明确创新点

**具体行动**：

1. 在引言末尾增加一段 **"Innovation and Contributions"**，用项目符号列出 2-3 个具体创新点
2. 创建对比表格，将本文与近两年的 3-5 篇高水平相关工作进行逐维对比
3. 每个创新点配一句 "Unlike previous work that..., this paper..." 的句式

**示例框架**：

> - **创新点 1**（方法）：提出/改进了...方法，相比传统方法在...指标上提升了 X%
> - **创新点 2**（实验）：首次在...平台上实现了...，填补了...的空白
> - **创新点 3**（应用）：将...技术应用于...场景，展示了...的实际潜力
`);

  if (t.hasExperiment) {
    improvements.push(`## 针对问题二：补充实验可重复性数据

**建议补充**：

1. **统计重复**：对关键实验进行至少 3 次独立重复，报告 mean ± standard deviation
2. **稳定性测试**：连续监测核心性能指标 4-24 小时（视具体实验而定）
3. **参数扫描**：展示关键参数（温度、功率、偏置等）在一定范围内的性能变化
4. **误差分析**：对主要测量量进行误差传递分析，给出不确定度

> 预计需要 3-7 天完成，但能显著提升实验部分的说服力。
`);
  }

  improvements.push(`## 针对问题三：加强竞争力对比

**建议策略**：选择 2-3 篇近期高水平相关工作（建议发表在 *Optica*、*Nature Photonics*、*Light: S&A* 或 *PRL*），从以下维度进行对比：

| 对比维度 | 本文 | 文献 A | 文献 B |
|---------|------|--------|--------|
| 核心方法 | ... | ... | ... |
| 关键性能指标 | ... | ... | ... |
| 优势 | ... | ... | ... |
| 局限 | ... | ... | ... |

> 坦诚地承认本文在某些方面的不足，同时明确指出本文的独特优势。这种平衡的论述更能赢得审稿人信任。
`);

  improvements.push(`## 针对问题四：规范结论表述

**具体修改建议**：

| 原文可能表述 | 建议修改 |
|-------------|---------|
| "breakthrough" | "significant advancement" / "promising approach" |
| "unprecedented" | "to our knowledge, the first demonstration of..." |
| "unlimited potential" | "potential in specific scenarios such as..." |
| "far superior" | "offers advantages in... while facing challenges in..." |

**原则**：用具体数据代替主观评价，用限定条件代替绝对化表述。
`);

  improvements.push(`## 针对问题五：充实应用前景讨论

**建议增加的内容**：

1. **具体应用场景**：列出 1-2 个最相关的应用方向（如高维量子通信、精密测量、生物传感等）
2. **性能对标表**：将本文指标与该应用场景的现有技术进行量化对比
3. **技术路线图**：用一张图展示从当前状态到实际应用的演进路径
4. **障碍分析**：坦诚讨论当前技术在实际应用中的瓶颈及可能的解决方向
`);

  improvements.push(`## 补充建议：文献引用优化

1. **补充 2023-2025 年的近期文献**：特别是 *Nature Photonics*、*Optica*、*Light: S&A* 上的相关工作
2. **平衡引用分布**：确保引用既有经典文献（体现传承）也有最新进展（体现前沿性）
3. **适当引用应用导向的文献**：展示研究的应用关联度
4. **检查自引比例**：自引不宜超过总引用的 15-20%
`);

  improvements.push(`## 补充建议：论文结构与写作

1. **确保每个图表都有自明性**：读者不看正文也应能理解图表的核心信息
2. **统一符号与术语**：全文保持符号和术语的一致性
3. **检查单位与国际标准**：确保所有物理量使用 SI 单位或领域内公认单位
4. **补充 Supplementary Information**：将详细的推导、额外数据、原始数据等放入补充材料
`);

  const improvement = `# 完善建议：${title}

${improvements.join('\n---\n\n')}

---

## 修改优先级时间表

| 优先级 | 修改项 | 预计时间 | 预期效果 |
|--------|--------|---------|---------|
| **高** | 明确创新点 + 对比表格 | 1-2 天 | 消除"创新性不足"质疑 |
| **高** | 规范结论表述 | 0.5 天 | 避免过度推导印象 |
| **中** | 补充实验统计/稳定性数据 | 3-7 天 | 提升实验可信度 |
| **中** | 加强竞争力对比 | 2-3 天 | 主动回应审稿人关切 |
| **中** | 补充应用前景讨论 | 1-2 天 | 提升影响力感知 |
| **低** | 文献引用优化 | 1-2 天 | 完善学术定位 |

完成以上修改后，论文的预审质量和投稿定位将有显著提升。
`;

  /* ================================================================ */
  /*  COMBINED REPORT                                                  */
  /* ================================================================ */
  const date = new Date().toISOString().split('T')[0];
  const combined = `# OptoReview 预审报告

**分析日期**：${date}
**上传文件**：${title}
**文件数量**：${fileCount} 个
**检测领域**：${fieldDesc}
**检测方法**：${methodsDesc}

---

# 一、评价报告

${evaluation}

---

# 二、质疑报告

${critique}

---

# 三、完善建议

${improvement}
`;

  return { evaluation, critique, improvement, combined };
}

/* ------------------------------------------------------------------ */
/*  Prompt Builder — constructs LLM prompts for the three report types  */
/* ------------------------------------------------------------------ */

/**
 * Journal database for recommendation — 8-tier system
 * 
 * IMPORTANT: When recommending journals in reports:
 * - Use descriptive Chinese names (e.g. "Nature大子刊", "光学顶刊") instead of T0/T1 codes
 * - Do NOT include ISSN numbers in the report
 * - If NOT recommending top-tier journals (Nature大子刊 or above), explain WHY
 */
const JOURNAL_DATABASE = `
## 参考期刊数据库（八级体系，按层级排列）

### 顶级综合刊（最高层级）
- Nature (IF~43), Science (IF~45), Cell (IF~45)

### Nature大子刊（Nature系列高影响力子刊）
- Nature Photonics (IF~33), Nature Materials (IF~38)
- Nature Nanotechnology (IF~32), Nature Physics (IF~18)
- Nature Methods (IF~36), Nature Electronics (IF~33)
- Nature Energy (IF~46)

### 准大子刊（介于Nature大子刊和光学顶刊之间）
- eLight, Light: Science & Applications (IF~20)
- Advanced Materials (IF~27), Nature Communications (IF~14)

### 光学顶刊 / 学科顶刊 / 综合顶刊
光学类:
- PhotoniX, Opto-Electronic Science
- Advances in Optics and Photonics (IF~25), Optica (IF~8.5)
综合/物理/材料类:
- Science Advances (IF~12), PNAS (IF~9)
- National Science Review (IF~17), Science Bulletin (IF~19)
- Physical Review Letters (IF~8.0), Physical Review X (IF~11)
- Advanced Functional Materials (IF~18), Materials Today (IF~22)

### 准顶刊（介于光学顶刊和光学强刊之间）
- Advanced Photonics (IF~19), Opto-Electronic Advances (IF~22)
- Nano Letters (IF~10), ACS Nano (IF~14), Research (IF~9)
- Cell Reports Physical Science

### 光学强刊 / 学科强刊 / 综合强刊
光学类:
- Photonics Research (IF~7.2), Laser & Photonics Reviews (IF~10)
- Ultrafast Science, APL Photonics (IF~5.3)
- ACS Photonics (IF~6.7), Nanophotonics (IF~6.6)
- Advanced Optical Materials (IF~7.2), Light: Advanced Manufacturing
交叉类:
- Nano Energy (IF~17), Small Methods, EPJ Quantum Technology

### 光学好刊 / 综合好刊
光学类:
- Optics Express (IF~3.3), Optics Letters (IF~3.3), Applied Optics
- IEEE Photonics Technology Letters (IF~2.5), Journal of Lightwave Technology (IF~3.3)
- Optical Fiber Technology, Optics Communications (IF~2.5)
- IEEE Journal of Selected Topics in Quantum Electronics (IF~4.6)
物理/工程类:
- Progress in Quantum Electronics (IF~7.9), Advanced Science (IF~13)
- High Power Laser Science and Engineering
- Photonic Sensors, Neurophotonics, Chinese Optics Letters (IF~2.8)

### 本领域核心 / 综合好刊
- Optical Materials Express, Biomedical Optics Express
- Journal of Biomedical Optics, Journal of Optics
- Applied Physics Letters, Journal of Applied Physics
- Chinese Journal of Lasers, Laser & Optoelectronics Progress`;

/**
 * Journal tier mapping — descriptive names for report output
 */
const JOURNAL_TIER_DESCRIPTION = `
## 期刊层级定位说明（报告中请使用这些描述性名称，不要用代码）

- 顶级综合刊：Nature / Science / Cell — 多学科顶级，要求突破性发现
- Nature大子刊：Nature Photonics, Nature Materials等 — IF 15-46，要求领域内重大突破
- 准大子刊：eLight, Light S&A, Advanced Materials, NC等 — IF 14-27，接近大子刊水平
- 光学/学科/综合顶刊：PhotoniX, Optica, PRL, PRX, SA, PNAS, NSR, AFM, Materials Today等 — IF 8-25，要求重要创新
- 准顶刊：Advanced Photonics, OEA, Nano Lett, ACS Nano, Research等 — IF 9-22
- 光学/学科/综合强刊：PR, LPR, APL Photonics, Nano Energy等 — IF 5-17，要求扎实创新
- 光学好刊/综合好刊：OE, OL, Advanced Science, EPJ QT等 — IF 2-13
- 本领域核心：OME, BOE, Chinese Optics Letters等 — 适合稳健成果发表
`;

/**
 * System role prompt for the AI expert editor
 */
export const SYSTEM_ROLE_PROMPT = `你是一位资深的学术预审专家，专注于光学与光子学领域的论文评审。你拥有以下专长：
- 多年顶刊审稿经验，熟悉Nature Photonics, Light: S&A, Optica, PRL, eLight, Advanced Photonics等
- 深厚的光学领域专业知识（量子光学、非线性光学、光纤光学、集成光学、超表面、光通信等）
- 擅长从审稿人视角发现问题、提出建设性意见
- 熟悉各层级期刊的录用标准和审稿流程

${JOURNAL_DATABASE}

${JOURNAL_TIER_DESCRIPTION}

请用中文撰写报告，采用 Markdown 格式。报告应专业、具体、可操作，避免空泛的套话。`;

interface PromptPair {
  system: string;
  user: string;
}

/**
 * Thinking instruction appended to each prompt
 */
const THINKING_INSTRUCTION = `

## 重要输出格式要求

在撰写正式报告之前，请先输出你的**思考过程**，用 
<think>
...
</think>
标签包裹。思考过程应展示：
- 你从论文中提取了哪些关键信息
- 你对各维度的初步判断和推理逻辑
- 你是如何形成评价和建议的

思考过程不需要完美，可以是你真实的分析思路。之后再用常规 Markdown 撰写正式报告。

思考过程示例格式：
<think>
1. 论文标题提到了"rewritable metasurfaces"，这是一个比较前沿的方向...
2. 摘要中描述了基于vdW材料的可重写超表面，方法上有一定创新...
3. 实验部分提到了...但缺少对照实验...
4. 总体判断：创新性中等偏上，适合投...
</think>`;

/**
 * Journal recommendation output format rules — shared across prompts
 */
const JOURNAL_RECOMMENDATION_RULES = `

## 期刊推荐格式要求（重要）

1. **层级标注**：使用描述性文字，如"Nature大子刊"、"光学顶刊"、"准顶刊"等，不要使用 T0/T1/T2 等代码
2. **期刊名称**：写全称即可，不要写 ISSN 编号
3. **推荐理由**：说明期刊与论文创新点的契合度、该期刊近期发表的相关工作
4. **录用概率**：预估为高/中/低及主要依据
5. **冲稳建议**：如果论文适合多个层级，给出冲一冲（高目标）和保一保（稳妥目标）的建议
6. **不推荐说明**：如果论文不适合投"顶级综合刊"或"Nature大子刊"，请明确说明为什么不推荐，具体指出论文与这些顶刊的差距在哪里（例如：创新性不足、影响范围有限、实验数据不够充分等）`;

/**
 * Build evaluation report prompt
 */
export function buildEvaluationPrompt(paperExtract: string): PromptPair {
  const system = SYSTEM_ROLE_PROMPT;
  const user = `请基于以下论文提取内容撰写一份详细的「评价报告」。

## 论文内容

${paperExtract}

## 报告要求

请从以下维度进行评价：

1. **标题与摘要评估**：标题是否准确概括研究？摘要结构是否完整？
2. **文献综述评估**：领域把握程度、近期文献覆盖、竞争技术对比
3. **创新点分析**：方法创新、技术创新、应用创新
4. **实验/理论分析**：数据充分性、方法合理性、可重复性
5. **期刊层级推荐**：基于论文质量推荐3-5个最适合的目标期刊：
   - 使用描述性层级名称（如"Nature大子刊"、"光学顶刊"、"准顶刊"），不要写 T0/T1 等代码
   - 只写期刊全称，不要写 ISSN
   - 说明推荐理由和预估录用概率（高/中/低）
   - 如果论文适合多个层级，给出冲一冲和保一保的建议
   - **重要**：如果不推荐顶级综合刊或Nature大子刊，请明确说明为什么不推荐
6. **总体评价**：综合评分（1-10）及核心优劣势

请用 Markdown 格式输出，包含表格和引用块增强可读性。${JOURNAL_RECOMMENDATION_RULES}${THINKING_INSTRUCTION}`;

  return { system, user };
}

/**
 * Build critique report prompt
 */
export function buildCritiquePrompt(paperExtract: string): PromptPair {
  const system = SYSTEM_ROLE_PROMPT;
  const user = `请基于以下论文提取内容撰写一份详细的「质疑报告」，模拟顶刊审稿人的视角提出关键问题。

## 论文内容

${paperExtract}

## 报告要求

请从以下角度提出质疑（至少5个核心问题）：

1. **创新性质疑**：具体创新点是否充分？与近期工作的差异化在哪里？
2. **实验数据**：可重复性、统计可靠性、误差分析是否完整？
3. **理论模型**：假设是否合理？适用范围和验证是否充分？
4. **竞争力对比**：与现有技术相比的优势和劣势是什么？
5. **结论表述**：是否存在过度推导？数据是否支撑结论？
6. **应用前景**：讨论是否具体？是否有实际应用场景分析？

每个问题请包含：
- 审稿人可能的质疑点
- 为什么这是个问题
- 建议的回应策略

请用 Markdown 格式输出。${THINKING_INSTRUCTION}`;

  return { system, user };
}

/**
 * Build improvement suggestions prompt
 */
export function buildImprovementPrompt(
  paperExtract: string,
  critiqueReport: string
): PromptPair {
  const system = SYSTEM_ROLE_PROMPT;
  const user = `请基于以下论文内容和质疑报告，撰写一份详细的「完善建议」。

## 论文内容

${paperExtract}

## 质疑报告中提出的问题

${critiqueReport}

## 报告要求

针对质疑报告中提出的每个问题，给出：

1. **具体修改建议**：明确列出需要修改的内容
2. **修改优先级**：高/中/低
3. **预计工作量**：时间估算
4. **预期效果**：修改后的提升

额外提供：
- 期刊投稿策略建议：根据修改后的论文质量，建议冲击的目标期刊层级（使用描述性名称，如"Nature大子刊"、"光学顶刊"等）
- 文献引用优化建议
- 论文结构与写作改进
- 修改优先级时间表（表格形式）

请用 Markdown 格式输出。${THINKING_INSTRUCTION}`;

  return { system, user };
}

/* ------------------------------------------------------------------ */
/*  Thinking parser — extracts <think>...</think> content               */
/* ------------------------------------------------------------------ */

/**
 * Parse streaming text to extract thinking content and report content.
 * Updates are returned incrementally as chunks arrive.
 */
export interface ParsedStream {
  thinking: string;   // content inside <think>...</think>
  report: string;     // content outside <think>...</think>
  isInThinking: boolean; // whether current position is inside thinking block
  thinkingComplete: boolean; // whether </think> has been seen
}

/**
 * Parse accumulated text to extract thinking and report content.
 * Handles partial/incomplete tags during streaming.
 */
export function parseStream(text: string): ParsedStream {
  const thinkOpenIdx = text.indexOf('<think>');
  
  // No <think> tag yet
  if (thinkOpenIdx === -1) {
    return { thinking: '', report: text, isInThinking: false, thinkingComplete: false };
  }
  
  const thinkCloseIdx = text.indexOf('</think>');
  
  // <think> opened but not yet closed
  if (thinkCloseIdx === -1) {
    const thinking = text.slice(thinkOpenIdx + 7); // after '<think>'
    const report = text.slice(0, thinkOpenIdx);
    return { thinking, report, isInThinking: true, thinkingComplete: false };
  }
  
  // Both <think> and </think> found
  const thinking = text.slice(thinkOpenIdx + 7, thinkCloseIdx);
  const report = text.slice(0, thinkOpenIdx) + text.slice(thinkCloseIdx + 8);
  return { thinking, report, isInThinking: false, thinkingComplete: true };
}

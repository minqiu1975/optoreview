/* ------------------------------------------------------------------ */
/*  Text Processor — smart extraction of paper content for LLM prompts  */
/* ------------------------------------------------------------------ */

export interface PaperExtract {
  title: string;
  abstract: string;
  keyContent: string; // title + abstract + intro + conclusion + figure captions
  fullWordCount: number;
  estimatedTokens: number;
}

/**
 * Estimate token count for Chinese + English mixed text
 * Chinese chars: ~1.5 tokens each
 * English words: ~1.3 tokens each
 */
export function estimateTokenCount(text: string): number {
  let chineseChars = 0;
  let englishWords = 0;

  for (const segment of text.split(/([\u4e00-\u9fff]+)/)) {
    if (/^[\u4e00-\u9fff]+$/.test(segment)) {
      chineseChars += segment.length;
    } else {
      const words = segment.trim().split(/\s+/).filter(w => w.length > 0);
      englishWords += words.length;
    }
  }

  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
}

/**
 * Find introduction section from paper text
 */
function extractIntroduction(text: string): string {
  // Try various patterns for introduction section
  const patterns = [
    /(?:^|\n)\s*(?:1\s*\.\s*|I\s*\.\s*|)\s*(?:introduction|引言|简介|background)[\s:：]*\n([^]*?)(?:\n\s*(?:2\s*\.\s*|II\s*\.\s*|\d+\s*\.\s*|(?:theory|methods|methodology|experimental|results|related work|模型|方法|实验|结果|相关工作)))/i,
    /(?:^|\n)\s*(?:introduction|引言|简介)[\s:：]*\n([^]*?)(?:\n\s*(?:\d+\s*\.\s*|(?:theory|methods|methodology|experimental|results)))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 50) {
      return match[1].trim().substring(0, 3000);
    }
  }
  return '';
}

/**
 * Find conclusion section from paper text
 */
function extractConclusion(text: string): string {
  const patterns = [
    /(?:^|\n)\s*(?:\d+\s*\.\s*)?(?:conclusion|conclusions|concluding remarks|总结|结论)[\s:：]*\n([^]*?)(?:\n\s*(?:acknowledgment|acknowledgements|references|附录|acknowledgments|funding|declaration|reference|\*\s*\*\s*\*)|$)/i,
    /(?:^|\n)\s*(?:summary and conclusion|结论与展望)[\s:：]*\n([^]*?)(?:\n\s*(?:acknowledgment|references|附录|funding)|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 30) {
      return match[1].trim().substring(0, 2000);
    }
  }
  return '';
}

/**
 * Find figure captions from paper text
 */
function extractFigureCaptions(text: string): string[] {
  const matches = text.match(/(?:fig(?:ure)?[\.\s]*\d+[\.:\s][^\n]+)/gi);
  return matches ? matches.slice(0, 6) : [];
}

/**
 * Smart extraction: keeps essential content within token budget
 */
export function smartExtract(
  parsedDoc: {
    title: string;
    abstract: string;
    fullText: string;
    wordCount: number;
  },
  maxTokens: number
): PaperExtract {
  const { title, abstract, fullText, wordCount } = parsedDoc;

  // Build key content: title + abstract + intro excerpt + conclusion excerpt
  let keyContent = '';

  // Always include title
  keyContent += '# 标题\n' + (title || '（未提取到标题）') + '\n\n';

  // Always include abstract
  if (abstract && abstract.length > 20) {
    keyContent += '# 摘要\n' + abstract + '\n\n';
  }

  // Try to extract introduction
  const introText = extractIntroduction(fullText);
  if (introText) {
    keyContent += '# 引言\n' + introText + '\n\n';
  }

  // Try to extract conclusion
  const conclusionText = extractConclusion(fullText);
  if (conclusionText) {
    keyContent += '# 结论\n' + conclusionText + '\n\n';
  }

  // Try to extract figure captions
  const figureCaptions = extractFigureCaptions(fullText);
  if (figureCaptions.length > 0) {
    keyContent += '# 图表说明\n' + figureCaptions.join('\n') + '\n\n';
  }

  // If we have room, add more of the body text
  const currentTokens = estimateTokenCount(keyContent);
  const remainingTokens = maxTokens - currentTokens;

  if (remainingTokens > 500) {
    // Extract key sections from the body
    const bodyText = fullText
      .replace(title, '')
      .replace(abstract, '');

    // Take portions of the body proportional to remaining budget
    const charBudget = Math.floor(remainingTokens / 1.5);
    const bodyExcerpt = bodyText.trim().substring(0, charBudget);

    if (bodyExcerpt.length > 100) {
      keyContent += '# 正文节选\n' + bodyExcerpt + '...\n\n';
    }
  }

  const estimatedTokens = estimateTokenCount(keyContent);

  return {
    title: title || '',
    abstract: abstract || '',
    keyContent: keyContent.trim(),
    fullWordCount: wordCount || 0,
    estimatedTokens,
  };
}

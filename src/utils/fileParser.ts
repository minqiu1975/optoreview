/* ------------------------------------------------------------------ */
/*  File Content Parser — extract text from PDF / DOCX                */
/* ------------------------------------------------------------------ */

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/* ------------------------------------------------------------------ */
/*  PDF setup — use legacy build for broadest browser compatibility     */
/* ------------------------------------------------------------------ */
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

let pdfjsReady = false;
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  pdfjsReady = true;
} catch (e) {
  console.warn('PDF.js init warning:', e);
}

/* ------------------------------------------------------------------ */
/*  PDF parser                                                         */
/* ------------------------------------------------------------------ */
async function parsePDF(file: File): Promise<ParsedDocument> {
  if (!pdfjsReady) {
    return fallbackFromFilename(file.name, 'PDF解析库未就绪');
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;

    let fullText = '';
    const pagesToParse = Math.min(pageCount, 10);
    for (let i = 1; i <= pagesToParse; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str?: string; hasEOL?: boolean }>;

        let lineBuf = '';
        for (const item of items) {
          const s = item.str || '';
          if (item.hasEOL) {
            lineBuf += s;
            const trimmed = lineBuf.trim();
            if (trimmed) fullText += trimmed + '\n';
            lineBuf = '';
          } else {
            lineBuf += s;
          }
        }
        if (lineBuf.trim()) {
          fullText += lineBuf.trim() + '\n';
        }
      } catch (pageErr) {
        console.warn(`PDF page ${i} error:`, pageErr);
      }
    }

    fullText = fullText.trim();
    if (!fullText || fullText.length < 30) {
      return fallbackFromFilename(file.name, '扫描版PDF（图片格式），无法提取文本。建议转换为文本版PDF或DOCX');
    }

    const { title, abstract } = extractTitleAndAbstract(fullText);
    return {
      title,
      abstract,
      fullText,
      wordCount: fullText.split(/\s+/).length,
      pageCount,
    };
  } catch (err) {
    console.error('PDF parse error:', err);
    return fallbackFromFilename(file.name, 'PDF解析失败，建议转换为DOCX格式');
  }
}

/* ------------------------------------------------------------------ */
/*  DOCX parser                                                        */
/* ------------------------------------------------------------------ */
async function parseDOCX(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const fullText = result.value.trim();

    if (!fullText || fullText.length < 30) {
      return fallbackFromFilename(file.name, 'DOCX文件内容为空');
    }

    const { title, abstract } = extractTitleAndAbstract(fullText);
    return {
      title,
      abstract,
      fullText,
      wordCount: fullText.split(/\s+/).length,
    };
  } catch (err) {
    console.error('DOCX parse error:', err);
    return fallbackFromFilename(file.name, 'DOCX解析失败，建议转换为PDF格式');
  }
}

/* ------------------------------------------------------------------ */
/*  DOC (binary) — no reliable browser parser                         */
/* ------------------------------------------------------------------ */
async function parseDOC(file: File): Promise<ParsedDocument> {
  return fallbackFromFilename(file.name, '.doc格式暂不支持，建议转换为PDF或DOCX');
}

/* ------------------------------------------------------------------ */
/*  Fallback: use filename as title                                  */
/* ------------------------------------------------------------------ */
function fallbackFromFilename(filename: string, reason: string): ParsedDocument {
  return {
    title: filenameToTitle(filename),
    abstract: '',
    fullText: `[${reason}]`,
    wordCount: 0,
  };
}

function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ================================================================== */
/*  CORE: Title & Abstract Extraction (v3 — thoroughly rewritten)     */
/* ================================================================== */

interface TitleCandidate {
  text: string;
  lineIndex: number;
  score: number;
}

function extractTitleAndAbstract(fullText: string): { title: string; abstract: string } {
  const lines = fullText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { title: '', abstract: '' };

  /* ---- STAGE 1: Collect title candidates ---- */
  const candidates: TitleCandidate[] = [];
  const scanLimit = Math.min(lines.length, 25);

  for (let i = 0; i < scanLimit; i++) {
    const line = lines[i];

    // Skip non-title lines (author, affiliation, etc.)
    if (isNonTitleLine(line)) continue;
    // Skip too short
    if (line.length < 10) continue;
    // Skip too long
    if (line.length > 300) continue;

    // Try merging with next line if this looks like a partial title
    let merged = tryMergeContinuation(lines, i, scanLimit);
    if (merged) {
      const score = scoreTitle({ text: merged.text, hasColon: merged.text.includes(':'), endsWithHyphen: merged.text.endsWith('-') }, i);
      if (score > 0) {
        candidates.push({ text: merged.text, lineIndex: i, score: score + merged.bonus });
      }
      i = merged.newIndex;
      continue;
    }

    // Single-line candidate
    const score = scoreTitle({ text: line, hasColon: line.includes(':'), endsWithHyphen: line.endsWith('-') }, i);
    if (score > 0) {
      candidates.push({ text: line, lineIndex: i, score });
    }
  }

  /* ---- STAGE 2: Select best title ---- */
  let title = '';
  if (candidates.length > 0) {
    // Sort: line position matters A LOT — earlier lines are much more likely to be the title
    candidates.sort((a, b) => {
      // Heavy position bonus: line 0 gets +100, line 1 gets +70, line 2 gets +40, etc.
      const posBonus = (idx: number) => {
        if (idx === 0) return 100;
        if (idx === 1) return 50;
        if (idx === 2) return 20;
        if (idx <= 5) return 5;
        return -20; // penalty for late candidates
      };
      const scoreA = a.score + posBonus(a.lineIndex);
      const scoreB = b.score + posBonus(b.lineIndex);
      return scoreB - scoreA;
    });
    title = candidates[0].text;
  }

  /* ---- STAGE 3: Extract abstract ---- */
  let abstract = '';
  // Try regex patterns
  const patterns = [
    /Abstract\s*[.:;\s]*\n?\s*([^]*?)(?=\n\s*(Keywords?|Key words?|I\.?\s*Introduction|1\.\s*Introduction|I\s+Introduction|INTRODUCTION\s*$|\n{2,}[A-Z][A-Z\s]{3,}\s*$))/im,
    /摘要[：:\s]*([^]*?)(?=\n\s*(关键词|Keywords?))/im,
  ];
  for (const p of patterns) {
    const m = fullText.match(p);
    if (m && m[1] && m[1].trim().length > 50) {
      abstract = cleanText(m[1].trim());
      break;
    }
  }

  // Fallback 1: find "Abstract" keyword and collect lines after it
  if (!abstract) {
    abstract = extractAbstractByKeyword(lines);
  }

  // Fallback 2: no "Abstract" keyword — extract text between title and Introduction
  if (!abstract && title) {
    abstract = extractAbstractNoKeyword(lines, title);
  }

  if (!title || title.length < 5) {
    title = '';
  }
  return { title, abstract };
}

/* ------------------------------------------------------------------ */
/*  Helper: try merging multi-line titles                             */
/* ------------------------------------------------------------------ */
function tryMergeContinuation(lines: string[], startIdx: number, limit: number): { text: string; newIndex: number; bonus: number } | null {
  const line = lines[startIdx];

  // Case A: ends with hyphen → merge with next line (word break)
  if (line.endsWith('-') && startIdx + 1 < limit) {
    const next = lines[startIdx + 1];
    if (isGoodContinuation(next)) {
      return { text: line.slice(0, -1) + next, newIndex: startIdx + 1, bonus: 5 };
    }
  }

  // Case B: ends with colon/separator and looks like a title start
  if ((line.endsWith(':') || line.endsWith('—') || line.endsWith('–')) && startIdx + 1 < limit) {
    const next = lines[startIdx + 1];
    if (isGoodContinuation(next) && line.length > 20 && line.length < 200) {
      return { text: line + ' ' + next, newIndex: startIdx + 1, bonus: 8 };
    }
  }

  // Case C: line is reasonably long and has title-like pattern (capitalized words)
  // AND next line is short and continues the thought
  if (line.length > 30 && line.length < 180 && startIdx + 1 < limit) {
    const next = lines[startIdx + 1];
    // Next line should be a continuation, not a new section
    if (
      next.length > 5 && next.length < 150 &&
      !isNonTitleLine(next) &&
      !isAuthorLine(next) &&
      !next.match(/^[\d\s*†#]+$/) &&
      !isSectionHeader(next)
    ) {
      // Next line starts with lowercase → likely continuation
      const startsLowercase =
        next[0] === next[0].toLowerCase() && next[0].match(/[a-z]/);

      // Next line has no period AND is short → could be continuation
      const noPeriodShort = !next.endsWith('.') && next.length < 80;

      // CRITICAL: next line starts with UPPERCASE and is long → likely a new sentence (abstract start)
      // Do NOT merge in this case
      const startsUppercaseLong =
        next[0] === next[0].toUpperCase() && next.length > 40;

      // Next line starts with common abstract/paper opening words → definitely NOT continuation
      const abstractOpeners = /^(here|in\s+this|we\s|this\s|interface|experiment|the\s|these\s|our\s|it\s|they\s)/i;
      const isAbstractStart = abstractOpeners.test(next);

      if (isAbstractStart || startsUppercaseLong) {
        return null; // Do not merge — next line is a new sentence
      }

      const looksLikeContinuation = startsLowercase || noPeriodShort;

      if (looksLikeContinuation) {
        // Only merge if the combined result looks more like a title
        const combined = line + ' ' + next;
        if (combined.length < 250 && hasTitleStructure(combined)) {
          return { text: combined, newIndex: startIdx + 1, bonus: 3 };
        }
      }
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Helper: score a title candidate                                   */
/* ------------------------------------------------------------------ */
interface TitleLineInfo {
  text: string;
  hasColon: boolean;
  endsWithHyphen: boolean;
}

function scoreTitle(info: TitleLineInfo, _lineIndex: number): number {
  const t = info.text;
  let score = 0;

  // Base: word count (3-20 words ideal)
  const words = t.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (wordCount >= 3 && wordCount <= 20) score += 15;
  else if (wordCount > 20) score += 5;
  else score -= 10;

  // Length (40-200 chars ideal for a title)
  if (t.length >= 30 && t.length <= 200) score += 10;
  else if (t.length > 200) score -= 5;

  // Title punctuation: colon is common in academic titles
  if (info.hasColon) score += 8;

  // Contains technical/academic words
  const techPattern = /\b(optical|photon|quantum|nonlinear|laser|fiber|waveguide|nanostructure|metasurface|plasmonic|spectroscopy|imaging|holography|entanglement|coherence|interferomet|modulation|detection|generation|propagation|scattering|absorption|emission|resonance|cavity|soliton|supercontinuum|optoelectronic|perovskite|photonic|silicon|integrated|optic|wafer|meta|beam|processing|platform|carbide|palimpsest|vdw|der\s+waals)\b/gi;
  const techMatches = t.match(techPattern);
  if (techMatches) score += Math.min(techMatches.length * 5, 20);

  // Has LaTeX notation
  if (/[$\\]/.test(t)) score += 5;

  // Title case pattern (most words capitalized)
  const capitalized = t.match(/\b[A-Z][a-z]+\b/g);
  if (capitalized && capitalized.length >= 3) score += 8;

  // Penalty: looks like an address/institution
  if (isAddressLine(t)) score -= 40;

  // Penalty: looks like an author line
  if (isAuthorLine(t)) score -= 30;

  // Penalty: ends with weak words
  const lower = t.toLowerCase();
  if (lower.endsWith('and') || lower.endsWith('the') || lower.endsWith('of')) score -= 10;

  // Penalty: contains email or URL
  if (t.includes('@') || t.includes('://')) score -= 30;

  return score;
}

/* ------------------------------------------------------------------ */
/*  Helper: detect non-title lines                                    */
/* ------------------------------------------------------------------ */
function isNonTitleLine(line: string): boolean {
  const lower = line.toLowerCase();

  // Multi-word phrases (exact match)
  const skipPhrases = [
    'all rights reserved', 'key words', 'e-mail', 'corresponding',
  ];
  if (skipPhrases.some(ph => lower.includes(ph))) return true;

  // Single-word keywords (\b = word boundary, prevents matching inside words)
  // e.g. "table" must NOT match "metasurfaces" (table is inside, not a word)
  const skipWordPattern = /\b(abstract|introduction|author|affiliation|email|received|accepted|doi|keywords|arxiv|tel|fax|address|copyright|published|acknowledgment|references|bibliography|figure|fig|table|supplementary)\b/i;
  if (skipWordPattern.test(lower)) return true;

  // Lines that are just section headers like "Results and Discussion"
  const sectionPattern = /^(results?|discussion|conclusions?|methods?|experiments?|acknowledgments?|references)\s+(and|&|\+)?\s*(results?|discussion|conclusions?|methods?|experiments?)?$/i;
  if (sectionPattern.test(lower)) return true;

  if (lower.startsWith('http')) return true;
  if (/^\d+$/.test(line)) return true;
  if (/^[\d\s*†#]+$/.test(line)) return true;
  if (line.includes('@') && line.length < 50) return true;
  if (line.startsWith('(') && line.endsWith(')')) return true;
  if (isAuthorLine(line)) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Helper: detect address lines                                      */
/* ------------------------------------------------------------------ */
function isAddressLine(line: string): boolean {
  const lower = line.toLowerCase();
  const addressSignals = [
    'university', 'college', 'laboratory', 'institute', 'school of',
    'department of', 'hangzhou', 'beijing', 'shanghai', 'china',
    'road', 'avenue', 'street', 'district', 'province',
    'zhejiang', 'beijing', 'nanjing', 'wuhan',
    'corresponding', 'e-mail',
  ];
  const matchCount = addressSignals.filter(s => lower.includes(s)).length;
  // If 2+ address signals present → likely an address
  return matchCount >= 2;
}

/* ------------------------------------------------------------------ */
/*  Helper: detect author lines                                       */
/* ------------------------------------------------------------------ */
function isAuthorLine(line: string): boolean {
  // Author patterns: "Xinyu Sun12, Haibo Shu3, ...", "John Doe*, Jane Smith†"
  if (line.includes(',') && line.match(/[\d*†#]/)) return true;
  // Multiple capitalized names with commas
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const names = line.match(namePattern);
  if (names && names.length >= 2 && line.includes(',')) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Helper: detect section headers                                    */
/* ------------------------------------------------------------------ */
function isSectionHeader(line: string): boolean {
  const lower = line.toLowerCase().trim();
  const headers = [
    'introduction', 'results', 'discussion', 'conclusion',
    'methods', 'methodology', 'experimental', 'theory',
    'acknowledgment', 'references', 'supplementary',
    'figure', 'fig.', 'table',
  ];
  return headers.some(h => lower === h || lower.startsWith(h + ' '));
}

/* ------------------------------------------------------------------ */
/*  Helper: check if a line is a good continuation                    */
/* ------------------------------------------------------------------ */
function isGoodContinuation(line: string): boolean {
  if (line.length < 3 || line.length > 200) return false;
  if (isNonTitleLine(line)) return false;
  if (/^[\d\s*†#]+$/.test(line)) return false;
  if (line.toLowerCase().includes('abstract')) return false;
  if (line.toLowerCase().includes('author')) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Helper: check if text has title structure                         */
/* ------------------------------------------------------------------ */
function hasTitleStructure(text: string): boolean {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length >= 3 && words.length <= 25 && text.length < 250;
}

/* ------------------------------------------------------------------ */
/*  Helper: extract abstract when NO "Abstract" keyword exists        */
/*  Extracts text between title and Introduction/section header       */
/* ------------------------------------------------------------------ */
function extractAbstractNoKeyword(lines: string[], title: string): string {
  // Find the line index of the title
  let titleIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes(title.substring(0, 30))) {
      titleIdx = i;
      break;
    }
  }
  if (titleIdx < 0) titleIdx = 0;

  // Collect lines after title until we hit a section header or introduction
  const absLines: string[] = [];
  const introPattern = /^(introduction|1\.\s*introduction|i\.\s*introduction|\d+\.\s)/i;

  for (let j = titleIdx + 1; j < lines.length && absLines.length < 40; j++) {
    const l = lines[j];
    const lower = l.toLowerCase();

    // Stop at Introduction or other section headers
    if (introPattern.test(l) || introPattern.test(lower)) break;
    if (isSectionHeader(l)) break;
    if (lower === 'keywords' || lower === 'key words') break;

    // Skip author/affiliation lines
    if (isAuthorLine(l)) continue;
    if (isAddressLine(l)) continue;
    if (isNonTitleLine(l)) continue;

    absLines.push(l);
  }

  const candidate = absLines.join(' ').trim();
  // Must be reasonably long to be an abstract (at least 50 words)
  return candidate.length > 200 && candidate.split(/\s+/).length >= 50
    ? cleanText(candidate)
    : '';
}

/* ------------------------------------------------------------------ */
/*  Helper: extract abstract by keyword search                         */
/* ------------------------------------------------------------------ */
function extractAbstractByKeyword(lines: string[]): string {
  const absIdx = lines.findIndex(l => l.toLowerCase() === 'abstract');
  if (absIdx < 0 || absIdx + 1 >= lines.length) return '';

  const absLines: string[] = [];
  for (let j = absIdx + 1; j < lines.length && absLines.length < 40; j++) {
    const l = lines[j];
    const lower = l.toLowerCase();
    if (
      lower === 'introduction' ||
      lower === 'keywords' ||
      lower === 'key words' ||
      lower.startsWith('1. introduction') ||
      lower.startsWith('i. introduction') ||
      lower.match(/^\d+\./) ||
      lower.match(/^fig(ure)?\.?\s*\d+/)
    ) {
      break;
    }
    absLines.push(l);
  }
  const candidate = absLines.join(' ').trim();
  return candidate.length > 50 ? cleanText(candidate) : '';
}

/* ------------------------------------------------------------------ */
/*  Helper: clean text                                                */
/* ------------------------------------------------------------------ */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().substring(0, 3000);
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

export interface ParsedDocument {
  title: string;
  abstract: string;
  fullText: string;
  wordCount: number;
  pageCount?: number;
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ext === '.pdf') return parsePDF(file);
  if (ext === '.docx') return parseDOCX(file);
  if (ext === '.doc') return parseDOC(file);
  throw new Error(`不支持的文件格式: ${ext}`);
}

/* ------------------------------------------------------------------ */
/*  Content Analysis (backward compat)                                 */
/* ------------------------------------------------------------------ */
export interface ContentAnalysis {
  topic: string;
  methods: string[];
  hasExperiment: boolean;
  hasTheory: boolean;
  hasSimulation: boolean;
  fieldKeywords: string[];
  estimatedTier: string;
}

export function analyzeContent(parsed: ParsedDocument): ContentAnalysis {
  const text = (parsed.title + ' ' + parsed.abstract + ' ' + parsed.fullText.substring(0, 5000)).toLowerCase();

  const fields: Record<string, string[]> = {
    '量子光学': ['quantum', 'entanglement', 'photon pair', 'single photon', 'quantum state', 'bell state', 'qubit', 'qudit'],
    '非线性光学': ['nonlinear', 'second-harmonic', 'shg', 'spdc', 'parametric', 'frequency conversion', 'supercontinuum'],
    '光纤光学': ['fiber', 'fibre', 'optical fiber', 'fiber laser', 'erbium', 'edfa', 'mode-locked'],
    '集成光学': ['integrated', 'waveguide', 'silicon photonic', 'photonic integrated', 'microring'],
    '超表面/等离激元': ['metasurface', 'plasmonic', 'nanostructure', 'nanoparticle', 'subwavelength'],
    '激光技术': ['laser', 'mode locking', 'q-switch', 'gain medium', 'cavity', 'resonator'],
    '光通信': ['communication', 'modulation', 'demodulation', 'ofdm', 'wdm', 'multiplexing', 'ber'],
    '光学成像': ['imaging', 'microscopy', 'holography', 'tomography', 'lensless', 'super-resolution'],
    '光谱学': ['spectroscop', 'raman', 'absorption', 'emission', 'fluorescence'],
    '太阳能电池/光电': ['solar cell', 'photovoltaic', 'perovskite', 'optoelectronic', 'photodetector'],
  };

  const detectedFields: string[] = [];
  for (const [field, keywords] of Object.entries(fields)) {
    if (keywords.some(k => text.includes(k))) detectedFields.push(field);
  }

  const methodMap: Record<string, string[]> = {
    '实验研究': ['experiment', 'measured', 'demonstrated', 'fabricated', 'characterized', 'observed'],
    '理论建模': ['theor', 'model', 'analytical', 'equation', 'hamiltonian'],
    '数值模拟': ['simulation', 'fdtd', 'fem', 'numerical', 'finite element'],
  };

  const methods: string[] = [];
  for (const [method, keywords] of Object.entries(methodMap)) {
    if (keywords.some(k => text.includes(k))) method
      }

  const methods: string[] = [];
  for (const [method, keywords] of Object.entries(methodMap)) {
    if (keywords.some(k => text.includes(k))) methods.push(method);
  }

  return {
    topic: detectedFields[0] || '光学与光子学',
    methods,
    hasExperiment: methods.includes('实验研究'),
    hasTheory: methods.includes('理论建模'),
    hasSimulation: methods.includes('数值模拟'),
    fieldKeywords: detectedFields,
    estimatedTier: parsed.abstract.length > 500 && detectedFields.length >= 2 ? 'Nature/Science 子刊' :
      parsed.abstract.length > 300 && detectedFields.length >= 2 ? '本领域顶刊 / 大子刊' :
      '本领域核心期刊',
  };
}

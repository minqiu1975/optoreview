import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  RotateCw,
  CheckCircle,
  Circle,
  Loader2,
  Download,
  ScrollText,
  Plus,
  ChevronDown,
  ChevronUp,
  Bot,
  BrainCircuit,
  Square,
} from 'lucide-react';
import { parseDocument } from '@/utils/fileParser';
import type { ParsedDocument } from '@/utils/fileParser';
import { type LLMConfig, streamChat } from '@/utils/llmAdapter';
import { buildEvaluationPrompt, buildCritiquePrompt, buildImprovementPrompt, parseStream } from '@/utils/prompts';
import { smartExtract, type PaperExtract } from '@/utils/textProcessor';
import { saveState, loadState, wasInterrupted, onVisibilityChange } from '@/utils/persistence';
import type { SavedState } from '@/utils/persistence';
import ModelConfigPanel from '@/components/ModelConfigPanel';
import { trackEvent } from '@/utils/analytics';

/* ------------------------------------------------------------------ */
/*  Markdown to HTML converter for PDF export                          */
/* ------------------------------------------------------------------ */
function convertMdToHtml(md: string): string {
  if (!md) return '';
  return md
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Pre blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Tables (simple)
    .replace(/\|([^\n]+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in p if not already wrapped
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    });
}


/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ReportStatus = 'idle' | 'generating' | 'done';
type OverallStatus = 'idle' | 'ready' | 'evaluating' | 'eval_done' | 'critiquing' | 'critique_done' | 'improving' | 'all_done' | 'error';

interface FileInfo {
  id: string;
  name: string;
  size: string;
  type: string;
  rawSize: number;
  parsed: ParsedDocument | null;
  parseError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const VALID_TYPES = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 10;

let fileIdCounter = 0;
const nextId = () => `f_${++fileIdCounter}_${Date.now()}`;

const TABS = [
  { key: 'eval', label: '评价报告', color: '#0E6B5E', lightColor: '#E8F3F1' },
  { key: 'critique', label: '质疑报告', color: '#8B5E34', lightColor: '#F9F4EF' },
  { key: 'improve', label: '完善建议', color: '#2E5A8C', lightColor: '#F0F3F7' },
] as const;

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */
function StatusBadge({ status, color }: { status: ReportStatus; color: string }) {
  const configs = {
    idle: { bg: '#F0EDE8', text: 'var(--color-text-muted)', label: '等待中' },
    generating: { bg: '#FFF3E0', text: '#C8963E', label: '生成中' },
    done: { bg: '#E8F3F1', text: color, label: '已完成' },
  };
  const c = configs[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Single File Card                                                   */
/* ------------------------------------------------------------------ */
function FileCard({ file, onRemove, disabled }: { file: FileInfo; onRemove: () => void; disabled: boolean }) {
  const isParsed = file.parsed !== null;
  const isParsing = !isParsed && !file.parseError;

  return (
    <div
      className="rounded-xl border p-3.5 flex items-center gap-3"
      style={{
        background: file.parseError ? '#FFF5F5' : isParsed ? 'var(--color-primary-light)' : 'var(--color-bg-input)',
        borderColor: file.parseError ? '#B84949' : isParsed ? 'var(--color-primary)' : 'var(--color-border)',
      }}
    >
      <FileText
        size={20}
        className="shrink-0"
        style={{ color: file.parseError ? '#B84949' : isParsed ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {file.name}
        </p>
        <p className="text-xs flex items-center gap-1.5">
          <span style={{ color: 'var(--color-text-muted)' }}>{file.size}</span>
          {isParsing && (
            <span className="inline-flex items-center gap-1" style={{ color: '#C8963E' }}>
              <Loader2 size={10} className="animate-spin-loader" />
              解析中...
            </span>
          )}
          {isParsed && file.parsed && (
            <span style={{ color: 'var(--color-primary)' }}>
              已提取：{file.parsed.title.length > 30 ? file.parsed.title.substring(0, 30) + '...' : file.parsed.title}
            </span>
          )}
          {file.parseError && (
            <span style={{ color: '#B84949' }}>解析失败</span>
          )}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        disabled={disabled}
        className="p-1.5 rounded-md hover:bg-[#B84949]/10 transition-colors focus:outline-none shrink-0"
        style={{ color: 'var(--color-text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
        onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.color = '#B84949'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; }}
        aria-label="Remove file"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Streaming Indicator Component                                      */
/* ------------------------------------------------------------------ */
function StreamingIndicator({ tabIndex, charCount, thinkingLength }: { tabIndex: number; charCount: number; thinkingLength: number }) {
  const messages = [
    'AI 正在阅读并思考论文内容，准备生成评价报告...',
    'AI 正在审视论文的薄弱环节，准备提出质疑...',
    'AI 正在综合质疑意见，准备给出完善建议...',
  ];
  const stageLabels = ['评价报告', '质疑报告', '完善建议'];

  const hasThinking = thinkingLength > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-r-lg px-4 py-3 space-y-2"
      style={{
        background: 'var(--color-primary-light)',
        borderLeft: '3px solid var(--color-primary)',
      }}
    >
      {/* Main status line */}
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin-loader" style={{ color: 'var(--color-primary)' }} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-primary)' }}>
          {messages[tabIndex] || '正在生成报告...'}
        </span>
      </div>

      {/* Progress stats */}
      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1">
          <Bot size={11} />
          已接收 {charCount.toLocaleString()} 字符
        </span>
        {hasThinking && (
          <span className="flex items-center gap-1" style={{ color: '#C8963E' }}>
            <Sparkles size={11} />
            思考过程 {thinkingLength.toLocaleString()} 字符
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#E8F3F1', color: 'var(--color-primary)' }}>
          {stageLabels[tabIndex]}
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Thinking Panel — collapsible reasoning display                     */
/* ------------------------------------------------------------------ */
function ThinkingPanel({ thinking }: { thinking: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!thinking || thinking.length < 10) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-xl overflow-hidden"
      style={{ border: '1px solid #F0D78C', background: '#FFFDF5' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={{ background: '#FFF8E1' }}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} style={{ color: '#C8963E' }} />
          <span className="text-[12px] font-semibold" style={{ color: '#8B6914' }}>
            AI 思考过程
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F0D78C', color: '#8B6914' }}>
            {thinking.length.toLocaleString()} 字符
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} style={{ color: '#C8963E' }} />
        ) : (
          <ChevronDown size={14} style={{ color: '#C8963E' }} />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: '#8B7355', maxHeight: '300px', overflowY: 'auto' }}>
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AppSection() {
  /* ---- File states ---- */
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const [shake, setShake] = useState(false);
  const [isParsingFiles, setIsParsingFiles] = useState(false);

  /* ---- LLM config ---- */
  const [llmConfig, setLLmConfig] = useState<LLMConfig | null>(null);

  /* ---- Paper extract ---- */
  const [, setPaperExtract] = useState<PaperExtract | null>(null);

  /* ---- Streaming states ---- */
  const [, setIsStreaming] = useState(false);
  const [, setStreamedText] = useState('');

  /* ---- Report states ---- */
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('idle');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [statuses, setStatuses] = useState<ReportStatus[]>(['idle', 'idle', 'idle']);
  const [reportsReady, setReportsReady] = useState<boolean[]>([false, false, false]);
  const [reportContents, setReportContents] = useState<(string | null)[]>([null, null, null]);
  const [thinkingContents, setThinkingContents] = useState<(string | null)[]>([null, null, null]);
  const [charCounts, setCharCounts] = useState<number[]>([0, 0, 0]);

  /* ---- UI state ---- */
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredState, setRestoredState] = useState<SavedState | null>(null);
  const hiddenTimeRef = useRef<number>(0);

  /* ---- Abort refs for streaming ---- */
  const abortRef = useRef<(() => void) | null>(null);

  /* ---- Cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  /* ---- Restore saved state on mount ---- */
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      // Restore report data
      setReportContents(saved.reportContents);
      setThinkingContents(saved.thinkingContents);
      setStatuses(saved.statuses as ReportStatus[]);
      setReportsReady(saved.reportsReady);
      setOverallStatus(saved.overallStatus as OverallStatus);
      setActiveTab(saved.activeTab);
      setCharCounts(saved.charCounts);
      setRestoredState(saved);

      // Restore LLM config (without API key — user needs to re-enter it)
      if (saved.llmConfig) {
        // Just save for reference, don't set as active config
        // User needs to re-enter API key for security
      }

      // Show restore prompt if there's content
      const hasAnyReport = saved.reportContents.some(c => c !== null && c.length > 0);
      if (hasAnyReport) {
        if (saved.isComplete) {
          // All done — silently restore
          setShowRestorePrompt(true);
        } else if (wasInterrupted(saved)) {
          // Interrupted — show warning
          setShowRestorePrompt(true);
        }
      }

      // Restore file metadata for display
      if (saved.fileNames.length > 0) {
        setFiles(saved.fileNames.map((f, i) => ({
          id: `restored_${i}`,
          name: f.name,
          size: f.size,
          type: f.type,
          rawSize: 0,
          parsed: null,
          parseError: null,
        })));
      }
    }
  }, []);

  /* ---- Auto-save state whenever reports change ---- */
  const saveCurrentState = useCallback(() => {
    const state: SavedState = {
      reportContents,
      thinkingContents,
      statuses,
      reportsReady,
      overallStatus,
      activeTab,
      charCounts,
      fileNames: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      llmConfig: llmConfig ? { provider: llmConfig.provider, model: llmConfig.model, baseUrl: llmConfig.baseUrl } : null,
      savedAt: Date.now(),
      isComplete: overallStatus === 'all_done',
    };
    saveState(state);
  }, [reportContents, thinkingContents, statuses, reportsReady, overallStatus, activeTab, charCounts, files, llmConfig]);

  /* ---- Page Visibility handling ---- */
  useEffect(() => {
    const cleanup = onVisibilityChange((visible) => {
      if (!visible) {
        // Page hidden — save state immediately
        hiddenTimeRef.current = Date.now();
        saveCurrentState();
      } else {
        // Page visible again — check if analysis was interrupted
        const hiddenDuration = Date.now() - hiddenTimeRef.current;
        if (hiddenDuration > 5000 && overallStatus !== 'all_done' && overallStatus !== 'idle') {
          // Hidden for more than 5 seconds while analyzing
          // The fetch connection may have been cut by the browser
          // Show a notice to the user
        }
      }
    });
    return cleanup;
  }, [overallStatus, saveCurrentState]);

  /* ---- Persist whenever key data changes ---- */
  useEffect(() => {
    if (overallStatus !== 'idle') {
      saveCurrentState();
    }
  }, [reportContents, thinkingContents, statuses, overallStatus, saveCurrentState]);

  /* ---- Validation ---- */
  const totalRawSize = files.reduce((sum, f) => sum + f.rawSize, 0);
  const canAddMore = files.length < MAX_FILES;

  /* ---- File parsing ---- */
  const parseFileContent = useCallback(async (fileInfo: FileInfo) => {
    try {
      const actualFile = fileMapRef.current.get(fileInfo.id);
      if (!actualFile) return;

      const parsed = await parseDocument(actualFile);

      setFiles(prev => prev.map(f =>
        f.id === fileInfo.id ? { ...f, parsed, parseError: null } : f
      ));
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.id === fileInfo.id ? { ...f, parsed: null, parseError: err.message || '解析失败' } : f
      ));
    }
  }, []);

  /* ---- File handling ---- */
  const validateAndAddFiles = useCallback((incoming: globalThis.File[]) => {
    if (files.length + incoming.length > MAX_FILES) {
      setUploadError(`最多上传 ${MAX_FILES} 个文件（当前已有 ${files.length} 个）`);
      setShake(true);
      setTimeout(() => { setShake(false); setUploadError(''); }, 4000);
      incoming = incoming.slice(0, MAX_FILES - files.length);
    }

    if (incoming.length === 0) return;

    const newFiles: FileInfo[] = [];
    let errorMsg = '';

    for (const f of incoming) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!VALID_TYPES.includes(ext)) {
        errorMsg = `跳过不支持的文件"${f.name}"，仅支持 PDF、DOC、DOCX`;
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errorMsg = `"${f.name}" 超过 100MB 单文件限制`;
        continue;
      }
      if (totalRawSize + f.size > MAX_TOTAL_SIZE) {
        errorMsg = '文件总大小超过 100MB 限制';
        break;
      }
      const id = nextId();
      newFiles.push({
        id,
        name: f.name,
        size: formatBytes(f.size),
        type: ext,
        rawSize: f.size,
        parsed: null,
        parseError: null,
      });
      fileMapRef.current.set(id, f);
    }

    if (errorMsg) {
      setUploadError(errorMsg);
      setShake(true);
      setTimeout(() => { setShake(false); setUploadError(''); }, 4000);
    }

    if (newFiles.length > 0) {
      setUploadError('');
      setFiles((prev) => [...prev, ...newFiles]);
      setOverallStatus((prev) => (prev === 'idle' ? 'ready' : prev));

      setIsParsingFiles(true);
      Promise.all(newFiles.map(f => parseFileContent(f))).finally(() => {
        setIsParsingFiles(false);
      });

      // Track file upload
      trackEvent('file_upload', {
        filenames: newFiles.map(f => f.name),
        count: newFiles.length,
      });
    }
  }, [files.length, totalRawSize, parseFileContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) validateAndAddFiles(dropped);
  }, [validateAndAddFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      validateAndAddFiles(selected);
    }
    e.target.value = '';
  }, [validateAndAddFiles]);

  const removeFile = useCallback((id: string) => {
    fileMapRef.current.delete(id);
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        setOverallStatus('idle');
      }
      return next;
    });
  }, []);

  /* ---- Merge multiple parsed documents ---- */
  const mergeParsedDocuments = useCallback((docs: ParsedDocument[]): ParsedDocument => {
    const primary = docs.reduce((best, d) =>
      d.fullText.length > best.fullText.length ? d : best
    , docs[0]);

    return {
      title: primary.title,
      abstract: primary.abstract,
      fullText: docs.map(d => d.fullText).join('\n\n---\n\n'),
      wordCount: docs.reduce((sum, d) => sum + d.wordCount, 0),
      pageCount: docs.reduce((sum, d) => sum + (d.pageCount || 0), 0),
    };
  }, []);

  const createFallbackParsed = useCallback((fileList: FileInfo[]): ParsedDocument => {
    const title = fileList[0]?.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '未知文稿';
    return {
      title,
      abstract: '',
      fullText: '[未能提取文件文本内容。可能原因：扫描版PDF（图片格式）、加密PDF或旧版.doc格式。建议转换为文本版PDF或DOCX后重新上传。]',
      wordCount: 0,
    };
  }, []);

  /* ---- Streaming report generation ---- */
  const generateReportWithStreaming = useCallback(async (
    tabIndex: number,
    promptBuilder: () => { system: string; user: string }
  ): Promise<string> => {
    if (!llmConfig) throw new Error('LLM config not set');

    return new Promise((resolve, reject) => {
      const { system, user } = promptBuilder();
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ];

      let fullText = '';

      streamChat(
        llmConfig,
        messages,
        (chunk) => {
          fullText += chunk;
          setStreamedText(fullText);

          // Real-time parse thinking vs report content
          const parsed = parseStream(fullText);
          setThinkingContents(prev => {
            const next = [...prev];
            next[tabIndex] = parsed.thinking || null;
            return next;
          });
          setReportContents(prev => {
            const next = [...prev];
            // Show thinking in report area too during streaming, so user can see activity
            next[tabIndex] = fullText;
            return next;
          });
          setCharCounts(prev => {
            const next = [...prev];
            next[tabIndex] = fullText.length;
            return next;
          });
        },
        (error) => {
          reject(new Error(error));
        },
        () => {
          // Final parse: clean up the report by removing <think> tags
          const finalParsed = parseStream(fullText);
          setReportContents(prev => {
            const next = [...prev];
            next[tabIndex] = finalParsed.report || fullText;
            return next;
          });
          setThinkingContents(prev => {
            const next = [...prev];
            next[tabIndex] = finalParsed.thinking || null;
            return next;
          });
          resolve(finalParsed.report || fullText);
        }
      ).then((abort) => {
        abortRef.current = abort;
      }).catch((err) => {
        reject(err);
      });
    });
  }, [llmConfig]);

  /* ---- Main analysis flow ---- */
  const startAnalysis = useCallback(async () => {
    if (files.length === 0 || !llmConfig) return;

    // Track analysis start
    trackEvent('start_analysis', {
      model: llmConfig.model,
      provider: llmConfig.provider,
      fileCount: files.length,
    });

    // Stop any ongoing streaming
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    // Build combined parsed document
    const parsedDocs = files.filter(f => f.parsed).map(f => f.parsed!);
    const mergedDoc = parsedDocs.length > 0
      ? mergeParsedDocuments(parsedDocs)
      : createFallbackParsed(files);

    // Extract paper content for LLM
    const extract = smartExtract(mergedDoc, 6000);
    setPaperExtract(extract);

    // Reset states
    setOverallStatus('evaluating');
    setStatuses(['generating', 'idle', 'idle']);
    setReportsReady([false, false, false]);
    setReportContents([null, null, null]);
    setThinkingContents([null, null, null]);
    setCharCounts([0, 0, 0]);
    setActiveTab(0);
    setIsStreaming(true);
    setStreamedText('');

    const extractText = extract.keyContent;

    try {
      /* === PHASE 1: Evaluation Report === */
      setActiveTab(0);
      await generateReportWithStreaming(0, () =>
        buildEvaluationPrompt(extractText)
      );

      setOverallStatus('eval_done');
      setStatuses(['done', 'generating', 'idle']);
      setReportsReady([true, false, false]);

      /* === PHASE 2: Critique Report === */
      setActiveTab(1);
      setStreamedText('');
      const critique = await generateReportWithStreaming(1, () =>
        buildCritiquePrompt(extractText)
      );

      setOverallStatus('critique_done');
      setStatuses(['done', 'done', 'generating']);
      setReportsReady([true, true, false]);

      /* === PHASE 3: Improvement Report === */
      setActiveTab(2);
      setStreamedText('');
      await generateReportWithStreaming(2, () =>
        buildImprovementPrompt(extractText, critique)
      );

      setOverallStatus('all_done');
      setStatuses(['done', 'done', 'done']);
      setReportsReady([true, true, true]);
      setIsStreaming(false);
      setStreamedText('');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Streaming error:', message);
      setOverallStatus('error');
      setIsStreaming(false);
      // Keep partial results if any
      setReportContents(prev => {
        const next = [...prev];
        // If a report was being generated, mark error note
        if (next[0] === null) next[0] = `**生成过程中出现错误**: ${message}\n\n请检查API Key和网络连接后重试。`;
        return next;
      });
      setReportsReady(prev => prev.map((r, i) => r || (reportContents[i] !== null)));
    }
  }, [files, llmConfig, generateReportWithStreaming, mergeParsedDocuments, createFallbackParsed]);

  const switchTab = useCallback((i: number) => {
    setActiveTab(i);
    trackEvent('report_view', { reportType: TABS[i].key });
  }, []);

  const handleLLMConfigChange = useCallback((config: LLMConfig | null) => {
    setLLmConfig(config);
    if (config) {
      trackEvent('config_model', {
        provider: config.provider,
        model: config.model,
      });
    }
  }, []);

  const resetAll = useCallback(() => {
    // Abort any ongoing streaming
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setFiles([]);
    setOverallStatus('idle');
    setStatuses(['idle', 'idle', 'idle']);
    setReportsReady([false, false, false]);
    setReportContents([null, null, null]);
    setThinkingContents([null, null, null]);
    setCharCounts([0, 0, 0]);
    setActiveTab(0);
    setUploadError('');
    setIsStreaming(false);
    setStreamedText('');
    setPaperExtract(null);
    fileMapRef.current.clear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ---- Export builders ---- */
  const buildCombinedReport = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    const filename = files.length > 0 ? files[0].name.replace(/\.[^.]+$/, '') : '文稿';

    const evaluation = reportContents[0] || '';
    const critique = reportContents[1] || '';
    const improvement = reportContents[2] || '';

    const markdown = `# OptoReview 预审报告\n\n**分析日期**：${date}\n**上传文件**：${filename}\n\n---\n\n# 一、评价报告\n\n${evaluation}\n\n---\n\n# 二、质疑报告\n\n${critique}\n\n---\n\n# 三、完善建议\n\n${improvement}\n`;

    const html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<title>OptoReview 预审报告 — ${filename}</title>\n<style>\n  body { font-family: 'Inter', 'Noto Sans SC', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #2A2926; line-height: 1.7; }\n  h1 { font-size: 24px; border-bottom: 2px solid #0E6B5E; padding-bottom: 10px; color: #0E6B5E; }\n  h2 { font-size: 18px; border-left: 4px solid #0E6B5E; padding-left: 12px; margin-top: 30px; color: #2A2926; }\n  h3 { font-size: 15px; margin-top: 20px; }\n  blockquote { border-left: 3px solid #D4A27F; margin: 10px 0; padding: 8px 16px; background: #FDF6EE; }\n  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }\n  th, td { border: 1px solid #E6E1DA; padding: 8px 12px; text-align: left; }\n  th { background: #F7F4F0; font-weight: 600; }\n  code { background: #F0EDE8; padding: 2px 6px; border-radius: 4px; font-size: 12px; }\n  pre { background: #F7F4F0; padding: 16px; border-radius: 8px; overflow-x: auto; }\n  hr { border: none; border-top: 1px solid #E6E1DA; margin: 30px 0; }\n  p { margin: 8px 0; }\n  ul, ol { margin: 8px 0; padding-left: 24px; }\n  .meta { color: #8E8A83; font-size: 13px; margin-bottom: 20px; }\n</style>\n</head>\n<body>\n<h1>OptoReview 预审报告</h1>\n<p class="meta"><strong>分析日期</strong>：${date}　|　<strong>上传文件</strong>：${filename}</p>\n<hr>\n<h2>一、评价报告</h2>\n${convertMdToHtml(evaluation)}\n<hr>\n<h2>二、质疑报告</h2>\n${convertMdToHtml(critique)}\n<hr>\n<h2>三、完善建议</h2>\n${convertMdToHtml(improvement)}\n</body>\n</html>`;

    return { markdown, html, filename, date };
  }, [files, reportContents]);

  const exportMD = useCallback(() => {
    trackEvent('export_md', { filename: files[0]?.name });
    const { markdown, filename, date } = buildCombinedReport();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptoReview_预审报告_${filename}_${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildCombinedReport]);

  const exportPDF = useCallback(() => {
    trackEvent('export_pdf', { filename: files[0]?.name });
    const { html } = buildCombinedReport();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }, [buildCombinedReport]);

/* ---- Stop analysis ---- */
  const stopAnalysis = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setOverallStatus('error');
    setIsStreaming(false);
    setStatuses(prev => prev.map((s) => s === 'generating' ? 'idle' : s));
    // Keep any partial results
    setReportsReady(prev => prev.map((r, idx) => r || (reportContents[idx] !== null && reportContents[idx]!.length > 50)));
  }, [reportContents]);

  /* ---- Derived UI states ---- */
  const isAnalyzing = overallStatus === 'evaluating' || overallStatus === 'eval_done' || overallStatus === 'critiquing' || overallStatus === 'critique_done' || overallStatus === 'improving';
  const isAllDone = overallStatus === 'all_done';
  const hasFiles = files.length > 0;
  const canStart = hasFiles && !isParsingFiles && llmConfig !== null && !isAnalyzing;

  const progressPct = overallStatus === 'idle' || overallStatus === 'ready' ? 0
    : overallStatus === 'evaluating' ? 10
    : overallStatus === 'eval_done' ? 33
    : overallStatus === 'critiquing' ? 45
    : overallStatus === 'critique_done' ? 66
    : overallStatus === 'improving' ? 80
    : overallStatus === 'all_done' ? 100
    : 0;

  const buttonConfig = isAllDone
    ? { text: '重新分析', icon: <RotateCw size={18} />, disabled: false, action: 'restart' as const }
    : isAnalyzing
      ? { text: '停止分析', icon: <Square size={18} />, disabled: false, action: 'stop' as const }
      : { text: '开始分析', icon: <Sparkles size={18} />, disabled: !canStart, action: 'start' as const };

  /* ---- Render helpers ---- */
  const UploadZone = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
      className={`relative rounded-xl border-2 border-dashed p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200 ${shake ? 'animate-shake' : ''}`}
      style={{
        background: dragOver ? 'var(--color-primary-light)' : 'var(--color-bg-input)',
        borderColor: uploadError ? '#B84949' : dragOver ? 'var(--color-primary)' : 'var(--color-border)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
      role="button"
      tabIndex={0}
      aria-label="选择或拖放文件"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
    >
      <Upload
        size={36}
        className="transition-transform duration-200"
        style={{ color: uploadError ? '#B84949' : 'var(--color-text-muted)', transform: dragOver ? 'scale(1.1)' : 'scale(1)' }}
      />
      <p className="mt-3 text-[14px] font-medium" style={{ color: uploadError ? '#B84949' : 'var(--color-text-secondary)' }}>
        {dragOver ? '松开以上传文件' : '点击或拖放文件到此处'}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        支持 PDF、DOC、DOCX，单文件最大 100MB
      </p>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        最多 {MAX_FILES} 个文件，当前 {files.length}/{MAX_FILES}
      </p>
      {uploadError && (
        <p className="mt-2 text-[12px] text-[#B84949] font-medium">{uploadError}</p>
      )}
    </motion.div>
  );

  /* ====== Determine what to show in the report content area ====== */
  const renderReportContent = () => {
    // State A: Empty initial state (or restored without files)
    if ((overallStatus === 'idle' || overallStatus === 'ready') && !reportContents.some(c => c)) {
      return (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full flex flex-col items-center justify-center text-center"
        >
          <ScrollText size={64} style={{ color: 'var(--color-border)' }} />
          <p className="mt-4 text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
            报告会显示在这里
          </p>
          <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
            上传文稿并配置AI模型后，点击「开始分析」生成个性化预审报告
          </p>
        </motion.div>
      );
    }

    // State A': Restored state — user has reports but no files uploaded yet
    if ((overallStatus === 'idle' || overallStatus === 'ready') && reportContents.some(c => c)) {
      const completedCount = statuses.filter(s => s === 'done').length;
      return (
        <motion.div
          key="restored"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full flex flex-col items-center justify-center text-center px-4"
        >
          <CheckCircle size={48} style={{ color: 'var(--color-primary)' }} />
          <p className="mt-4 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {completedCount === 3 ? '三份报告均已完成' : `已有 ${completedCount} 份报告`}
          </p>
          <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
            上次分析报告已自动保存。点击下方标签切换查看。如需重新分析新论文，请重新上传文件。
          </p>
        </motion.div>
      );
    }

    // State B: Currently streaming for the active tab
    if (statuses[activeTab] === 'generating' && reportContents[activeTab]) {
      return (
        <motion.div
          key={`streaming-${activeTab}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <StreamingIndicator tabIndex={activeTab} charCount={charCounts[activeTab]} thinkingLength={thinkingContents[activeTab]?.length || 0} />
          <div className="mt-4">
            <ThinkingPanel thinking={thinkingContents[activeTab]} />
            <div className="rounded-xl border p-6 md:p-8" style={{ background: '#FAF8F5', borderColor: 'var(--color-border-light)' }}>
              <div className={`markdown-report ${activeTab === 1 ? 'brown' : activeTab === 2 ? 'blue' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {reportContents[activeTab]!}
                </ReactMarkdown>
              {/* Blinking cursor indicator */}
              <motion.span
                className="inline-block w-2 h-4 ml-0.5 rounded-sm"
                style={{ background: 'var(--color-primary)', verticalAlign: 'text-bottom' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // State C: Generating but no content yet (skeleton)
    if (statuses[activeTab] === 'generating' && !reportContents[activeTab]) {
      return (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          <StreamingIndicator tabIndex={activeTab} charCount={charCounts[activeTab]} thinkingLength={thinkingContents[activeTab]?.length || 0} />
          <div className="space-y-3">
            <div className="skeleton-shimmer rounded-lg" style={{ width: '60%', height: '24px' }} />
            <div className="space-y-2">
              <div className="skeleton-shimmer rounded" style={{ width: '100%', height: '12px' }} />
              <div className="skeleton-shimmer rounded" style={{ width: '95%', height: '12px' }} />
              <div className="skeleton-shimmer rounded" style={{ width: '90%', height: '12px' }} />
              <div className="skeleton-shimmer rounded" style={{ width: '85%', height: '12px' }} />
            </div>
            <div className="space-y-2 pt-4">
              <div className="skeleton-shimmer rounded" style={{ width: '80%', height: '12px' }} />
              <div className="skeleton-shimmer rounded" style={{ width: '75%', height: '12px' }} />
              <div className="skeleton-shimmer rounded" style={{ width: '70%', height: '12px' }} />
            </div>
          </div>
        </motion.div>
      );
    }

    // State D: Report content ready
    if (reportContents[activeTab]) {
      return (
        <motion.div
          key={`report-${activeTab}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] as [number, number, number, number] }}
        >
          <ThinkingPanel thinking={thinkingContents[activeTab]} />
          <div className="rounded-xl border p-6 md:p-8" style={{ background: '#FAF8F5', borderColor: 'var(--color-border-light)' }}>
            <div className={`markdown-report ${activeTab === 1 ? 'brown' : activeTab === 2 ? 'blue' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reportContents[activeTab]!}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>
      );
    }

    // Fallback: waiting state for non-active tabs
    return (
      <motion.div
        key="waiting"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col items-center justify-center text-center"
      >
        <Bot size={48} style={{ color: 'var(--color-border)' }} />
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          等待生成中...
        </p>
      </motion.div>
    );
  };

  /* ---- Render ---- */
  return (
    <section
      id="app-section"
      className="py-6 px-4 md:px-6"
      style={{ background: 'var(--color-bg-base)', minHeight: '100dvh' }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6" style={{ minHeight: 'calc(100dvh - 48px)' }}>

        {/* ==================== LEFT PANEL ==================== */}
        <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-5">

          {/* --- File Upload Section --- */}
          <div
            className="rounded-2xl p-6 md:p-7 flex flex-col"
            style={{ background: 'var(--color-bg-panel)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          >
            {/* Title */}
            <div className="flex items-start gap-3 mb-4">
              <FileText size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  光学论文预审分析器
                </h3>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  上传文稿，获取三份预审报告
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full mb-5" style={{ background: 'var(--color-border)' }} />

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
              className="sr-only"
              style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
              onChange={handleFileInput}
            />

            {/* Upload area */}
            <AnimatePresence mode="wait">
              {!hasFiles ? (
                <div key="empty-zone">{UploadZone}</div>
              ) : (
                <motion.div
                  key="file-list"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
                  className="flex flex-col gap-3"
                >
                  {/* Scrollable file list */}
                  <div
                    className="space-y-2.5 overflow-y-auto pr-1"
                    style={{ maxHeight: files.length > 4 ? '240px' : undefined }}
                  >
                    {files.map((f) => (
                      <FileCard
                        key={f.id}
                        file={f}
                        onRemove={() => removeFile(f.id)}
                        disabled={isAnalyzing}
                      />
                    ))}
                  </div>

                  {/* Total size + count indicator */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      共 {files.length} 个文件，{formatBytes(totalRawSize)}
                    </span>
                    {canAddMore && !isAnalyzing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[12px] font-medium transition-colors focus:outline-none"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <Plus size={12} />
                        继续添加
                      </button>
                    )}
                  </div>

                  {/* Add more zone */}
                  {canAddMore && !isAnalyzing && (
                    <div
                      className="rounded-lg border-2 border-dashed p-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
                      role="button"
                      tabIndex={0}
                      aria-label="继续添加文件"
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                    >
                      <Plus size={16} style={{ color: 'var(--color-text-muted)' }} />
                      <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                        拖放或点击添加更多（最多 {MAX_FILES} 个）
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-[12px] text-[#B84949] font-medium text-center">{uploadError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parsing indicator */}
            {isParsingFiles && (
              <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#FFF8E1' }}>
                <Loader2 size={14} className="animate-spin-loader" style={{ color: '#C8963E' }} />
                <span className="text-[12px]" style={{ color: '#C8963E' }}>
                  正在解析文件内容，提取标题和摘要...
                </span>
              </div>
            )}

            {/* Progress bar */}
            {isAnalyzing && (
              <div className="mt-5">
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <motion.div
                    className="h-full rounded-full origin-left"
                    style={{ background: 'var(--color-primary)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progressPct / 100 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  />
                </div>
                <p className="mt-2 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {progressPct}%
                </p>
              </div>
            )}

            {/* Restore prompt — shows when returning to page with previous results */}
            <AnimatePresence>
              {showRestorePrompt && restoredState && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 rounded-xl p-3.5"
                  style={{
                    background: restoredState.isComplete ? '#E8F3F1' : '#FFF3E0',
                    border: restoredState.isComplete
                      ? '1px solid #0E6B5E'
                      : '1px solid #C8963E',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="mt-0.5 shrink-0"
                      style={{ color: restoredState.isComplete ? '#0E6B5E' : '#C8963E' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {restoredState.isComplete
                          ? '上次分析报告已完成'
                          : '上次分析已保存（可能部分完成）'}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {restoredState.isComplete
                          ? `${restoredState.fileNames.map(f => f.name).join(', ')} 的三份报告已就绪`
                          : `已完成 ${restoredState.statuses.filter(s => s === 'done').length}/3 份报告，可点击下方标签查看。如需重新分析，请重新上传文件。`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRestorePrompt(false)}
                      className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start / Stop / Restart button */}
            <button
              onClick={() => {
                if (buttonConfig.action === 'stop') {
                  stopAnalysis();
                } else if (buttonConfig.action === 'restart') {
                  resetAll();
                } else {
                  startAnalysis();
                }
              }}
              disabled={buttonConfig.disabled}
              className="mt-5 w-full flex items-center justify-center gap-2 text-base font-semibold text-white py-3.5 rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: buttonConfig.disabled ? '#B8D4D0'
                  : buttonConfig.action === 'stop' ? 'linear-gradient(180deg, #B84949 0%, #9A3B3B 100%)'
                  : 'linear-gradient(180deg, #0E6B5E 0%, #0A5248 100%)',
                cursor: buttonConfig.disabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!buttonConfig.disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {buttonConfig.icon}
              {buttonConfig.text}
              {buttonConfig.action === 'start' && <ArrowRight size={18} />}
            </button>

            {/* Analysis error / parse error notice */}
            <AnimatePresence>
              {(overallStatus === 'error' || files.some(f => f.parseError)) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 rounded-xl p-3"
                  style={{ background: '#FFF5F5', border: '1px solid #E8B4B4' }}
                >
                  <p className="text-[12px] font-medium" style={{ color: '#B84949' }}>
                    {overallStatus === 'error' ? '分析已停止' : '部分文件解析失败'}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#D48383' }}>
                    {overallStatus === 'error'
                      ? '已保留已生成的报告内容。如需重新分析，请点击「重新分析」按钮。'
                      : `${files.filter(f => f.parseError).length} 个文件无法提取文本（可能是扫描版PDF或加密文档）。建议转换为文本版PDF或DOCX后重新上传。`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LLM config status hint */}
            {!llmConfig && hasFiles && !isAnalyzing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-[11px] text-center"
                style={{ color: 'var(--color-text-muted)' }}
              >
                请在下方配置AI模型和API Key以开始分析
              </motion.p>
            )}

            {/* Status indicators */}
            <div className="mt-6">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                报告生成进度
              </p>
              <div className="space-y-3">
                {TABS.map((tab, i) => {
                  const s = statuses[i];
                  const borderStyle = s === 'done'
                    ? `3px solid ${tab.color}`
                    : s === 'generating'
                      ? '1px solid #C8963E'
                      : '1px solid var(--color-border)';
                  return (
                    <motion.div
                      key={tab.key}
                      layout
                      className="rounded-[10px] p-3.5 px-4 flex items-center gap-3 transition-all duration-300"
                      style={{
                        background: 'var(--color-bg-input)',
                        borderLeft: borderStyle,
                        borderTop: s === 'generating' ? '1px solid #C8963E' : '1px solid var(--color-border)',
                        borderRight: s === 'generating' ? '1px solid #C8963E' : '1px solid var(--color-border)',
                        borderBottom: s === 'generating' ? '1px solid #C8963E' : '1px solid var(--color-border)',
                        animation: s === 'generating' ? 'status-pulse 1.5s ease-in-out infinite' : undefined,
                      }}
                    >
                      {s === 'done' ? (
                        <CheckCircle size={20} style={{ color: tab.color }} />
                      ) : s === 'generating' ? (
                        <Loader2 size={20} className="animate-spin-loader" style={{ color: '#C8963E' }} />
                      ) : (
                        <Circle size={20} style={{ color: 'var(--color-text-muted)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {tab.label}
                          </span>
                          <StatusBadge status={s} color={tab.color} />
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: s === 'done' ? tab.color : s === 'generating' ? '#C8963E' : 'var(--color-text-muted)' }}>
                        {s === 'done' ? '已完成' : s === 'generating' ? '生成中...' : '等待中'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom action buttons */}
            <AnimatePresence>
              {isAllDone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-auto pt-5 space-y-2"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={exportMD}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg border transition-all duration-200 focus:outline-none"
                      style={{
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)',
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.background = 'var(--color-bg-input)';
                        el.style.borderColor = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.background = 'transparent';
                        el.style.borderColor = 'var(--color-border)';
                      }}
                    >
                      <Download size={16} />
                      导出 Markdown
                    </button>
                    <button
                      onClick={exportPDF}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg border transition-all duration-200 focus:outline-none"
                      style={{
                        color: 'var(--color-primary)',
                        borderColor: 'var(--color-primary)',
                        background: 'var(--color-primary-light)',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.background = '#0E6B5E';
                        el.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.background = 'var(--color-primary-light)';
                        el.style.color = 'var(--color-primary)';
                      }}
                    >
                      <Download size={16} />
                      导出 PDF
                    </button>
                  </div>
                  <button
                    onClick={resetAll}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition-all duration-200 focus:outline-none"
                    style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}
                  >
                    <RotateCw size={16} />
                    分析新文稿
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- Model Config Section (Collapsible) --- */}
          <div className="flex flex-col">
            {/* Collapse toggle bar */}
            <button
              onClick={() => setConfigCollapsed(!configCollapsed)}
              className="flex items-center justify-between px-1 py-2 mb-2 text-[12px] font-medium transition-colors focus:outline-none"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <Bot size={13} />
                {configCollapsed ? '展开模型配置' : '收起模型配置'}
              </span>
              {configCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            <AnimatePresence>
              {!configCollapsed && (
                <motion.div
                  key="model-config"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <ModelConfigPanel
                    config={llmConfig}
                    onChange={handleLLMConfigChange}
                    disabled={isAnalyzing}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div
          className="flex-1 rounded-2xl flex flex-col overflow-hidden"
          style={{ background: 'var(--color-bg-panel)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)', height: '52px' }}>
            <div className="flex items-center gap-2">
              <Bot size={16} style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                AI 预审报告
              </span>
              {llmConfig && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {llmConfig.provider} · {llmConfig.model}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                const content = reportContents[activeTab];
                if (!content) return;
                navigator.clipboard.writeText(content).catch(() => {});
              }}
              disabled={!reportContents[activeTab]}
              className="text-xs font-medium px-3 py-1.5 rounded-md border transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-border)',
                background: 'transparent',
              }}
            >
              复制 Markdown
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;
              const isReady = reportsReady[i] || (statuses[i] === 'generating');
              return (
                <button
                  key={tab.key}
                  onClick={() => isReady && switchTab(i)}
                  className="relative flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    color: isActive ? 'var(--color-text-primary)' : isReady ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                    opacity: !isReady && !isActive ? 0.5 : 1,
                    cursor: isReady ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: tab.color, opacity: isReady ? 1 : 0.3 }}
                  />
                  {tab.label}
                  <AnimatePresence>
                    {statuses[i] === 'generating' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: '#FFF3E0', color: '#C8963E' }}
                      >
                        生成中
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: tab.color }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Report content area */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>
            <AnimatePresence mode="wait">
              {renderReportContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

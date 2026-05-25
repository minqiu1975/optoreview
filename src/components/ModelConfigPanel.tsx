import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ExternalLink,
  KeyRound,
  Link,
  Sparkles,
  BookOpen,
  Copy,
  Globe,
  AlertCircle,
  Lock,
  Shield,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  type LLMConfig,
  type ModelProvider,
  getDefaultModel,
  getModelOptions,
  getProviderConfig,
  validateApiKey,
  streamChat,
} from '@/utils/llmAdapter';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ModelConfigPanelProps {
  config: LLMConfig | null;
  onChange: (config: LLMConfig | null) => void;
  disabled?: boolean;
}

type ValidationState = 'idle' | 'testing' | 'valid' | 'invalid';

/* ------------------------------------------------------------------ */
/*  Provider data                                                      */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Provider data                                                      */
/* ------------------------------------------------------------------ */
const PROVIDERS: {
  key: ModelProvider;
  icon: string;
  label: string;
  tag: string;
  costTag: string;
  color: string;
  bgColor: string;
  borderColor: string;
  recommended?: boolean;
  free?: boolean;
}[] = [
  {
    key: 'gemini',
    icon: '✦',
    label: 'Gemini',
    tag: '2.5 Pro · 1M上下文 · 多模态',
    costTag: '免费',
    color: '#1A73E8',
    bgColor: '#E8F0FE',
    borderColor: '#1A73E8',
    recommended: true,
    free: true,
  },
  {
    key: 'kimi',
    icon: '🌙',
    label: 'Kimi',
    tag: 'K2.6 · 1T参数MoE · 256K上下文',
    costTag: '~¥0.3/次',
    color: '#4F6EF7',
    bgColor: '#F0F2FF',
    borderColor: '#4F6EF7',
  },
  {
    key: 'deepseek',
    icon: '🔥',
    label: 'DeepSeek',
    tag: 'V3 · 671B参数 · 性价比之王',
    costTag: '~¥0.01/次',
    color: '#4F6EF7',
    bgColor: '#F0F2FF',
    borderColor: '#4F6EF7',
  },
  {
    key: 'claude',
    icon: '◆',
    label: 'Claude',
    tag: 'Sonnet 4.5 · 200K上下文 · 编码最强',
    costTag: '~$0.15/次',
    color: '#D4A27F',
    bgColor: '#FDF6EE',
    borderColor: '#D4A27F',
  },
  {
    key: 'openai',
    icon: '◉',
    label: 'OpenAI',
    tag: 'GPT-4.1 · 1M上下文 · 多模态',
    costTag: '~$0.08/次',
    color: '#10A37F',
    bgColor: '#E6F7F3',
    borderColor: '#10A37F',
  },
];

const API_KEY_GUIDES: {
  provider: ModelProvider;
  title: string;
  url: string;
  steps: string[];
  note?: string;
}[] = [
  {
    provider: 'gemini',
    title: 'Gemini（推荐，免费）',
    url: 'https://aistudio.google.com/app/apikey',
    steps: [
      '访问 https://aistudio.google.com/app/apikey',
      '用 Google / Gmail 账号一键登录（无需额外注册）',
      '点击「Create API Key」',
      '立即复制密钥，无需绑定信用卡',
    ],
    note: 'Gemini Flash 模型对普通用户完全免费，无限额度，是入门首选。',
  },
  {
    provider: 'kimi',
    title: 'Kimi (Moonshot)',
    url: 'https://platform.moonshot.cn/',
    steps: [
      '访问 https://platform.moonshot.cn/（国内）或 https://platform.moonshot.ai/（国际）',
      '注册/登录账号（国内需实名认证）',
      '进入「账户管理」→「API Key管理」',
      '点击「创建API Key」，复制以 sk- 开头的密钥',
      '在网站配置中选对端点：.cn 的 Key 选「中国境内」，.ai 的 Key 选「国际/境外」',
    ],
    note: '两个平台（.cn 和 .ai）的账户和 Key 完全独立，不能混用。新用户赠送 15 元体验金。',
  },
  {
    provider: 'claude',
    title: 'Claude (Anthropic)',
    url: 'https://console.anthropic.com/',
    steps: [
      '访问 https://console.anthropic.com/',
      '注册/登录账号',
      '进入「Settings」→「API Keys」',
      '点击「Create Key」，复制密钥',
    ],
  },
  {
    provider: 'deepseek',
    title: 'DeepSeek',
    url: 'https://platform.deepseek.com/',
    steps: [
      '访问 https://platform.deepseek.com/',
      '注册/登录账号',
      '进入「API Keys」页面',
      '点击「创建API Key」，复制密钥',
    ],
  },
  {
    provider: 'openai',
    title: 'OpenAI',
    url: 'https://platform.openai.com/',
    steps: [
      '访问 https://platform.openai.com/',
      '注册/登录账号',
      '进入「Settings」→「API Keys」',
      '点击「Create new secret key」，复制密钥',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ModelConfigPanel({ config, onChange, disabled = false }: ModelConfigPanelProps) {
  const [provider, setProvider] = useState<ModelProvider>(config?.provider || 'kimi');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(config?.model || getDefaultModel('kimi'));
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validation, setValidation] = useState<ValidationState>('idle');
  const [validationMsg, setValidationMsg] = useState('');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  /* -- Lab-shared API Key (password protected) -- */
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [labPassword, setLabPassword] = useState('');
  const [labPasswordError, setLabPasswordError] = useState('');
  const [isLabMode, setIsLabMode] = useState(false);

  const LAB_PASSWORD = 'QiuLabOptoReview2026';
  const LAB_API_KEY = 'sk-A2jpyd8HPkN6ANtnEjbvh3Ric5P4UvhAVJT9fCSa4eZ6AbpE';

  const modelOptions = getModelOptions(provider);
  const providerConfig = getProviderConfig(provider);

  // Sync local state when config prop changes externally
  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModel(config.model);
      setBaseUrl(config.baseUrl || '');
    }
  }, [config?.provider, config?.apiKey, config?.model, config?.baseUrl]);

  // Update config when form values change
  const updateConfig = useCallback((
    newProvider: ModelProvider,
    newApiKey: string,
    newModel: string,
    newBaseUrl: string
  ) => {
    if (newApiKey.trim() && validateApiKey(newProvider, newApiKey.trim())) {
      onChange({
        provider: newProvider,
        apiKey: newApiKey.trim(),
        model: newModel,
        baseUrl: newBaseUrl.trim() || undefined,
      });
    } else {
      onChange(null);
    }
  }, [onChange]);

  const handleProviderChange = (p: ModelProvider) => {
    setProvider(p);
    const defaultModel = getDefaultModel(p);
    setModel(defaultModel);
    setBaseUrl('');
    setValidation('idle');
    setValidationMsg('');
    updateConfig(p, apiKey, defaultModel, '');
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    setValidation('idle');
    setValidationMsg('');
    updateConfig(provider, val, model, baseUrl);
  };

  const handleModelChange = (val: string) => {
    setModel(val);
    updateConfig(provider, apiKey, val, baseUrl);
  };

  const handleBaseUrlChange = (val: string) => {
    setBaseUrl(val);
    updateConfig(provider, apiKey, model, val);
  };

  const testConnection = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || !validateApiKey(provider, trimmedKey)) {
      setValidation('invalid');
      setValidationMsg('请输入有效的 API Key');
      return;
    }

    setValidation('testing');
    setValidationMsg('');

    const testConfig: LLMConfig = {
      provider,
      apiKey: trimmedKey,
      model,
      baseUrl: baseUrl.trim() || undefined,
    };

    try {
      const abort = await streamChat(
        testConfig,
        [{ role: 'user', content: '你好，请回复"连接成功"。' }],
        () => {}, // no need to collect chunks for test
        (err) => {
          setValidation('invalid');
          setValidationMsg(`连接失败: ${err}`);
        },
        () => {
          setValidation('valid');
          setValidationMsg('连接成功！API Key 有效。');
        }
      );

      // Timeout after 15 seconds
      setTimeout(() => {
        abort();
        setValidation((prev) => {
          if (prev === 'testing') {
            setValidationMsg('连接超时，请检查网络或 Base URL 设置');
            return 'invalid';
          }
          return prev;
        });
      }, 15000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setValidation('invalid');
      setValidationMsg(`连接失败: ${message}`);
    }
  };

  const copyStep = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  /* -- Lab API Key functions -- */
  const applyLabApiKey = () => {
    if (labPassword !== LAB_PASSWORD) {
      setLabPasswordError('密码错误，请输入正确的实验室密码');
      return;
    }
    setLabPasswordError('');
    setShowLabDialog(false);
    setIsLabMode(true);
    setLabPassword('');

    // Auto-configure Kimi with lab API key
    const labProvider: ModelProvider = 'kimi';
    const labModel = getDefaultModel(labProvider);
    const labBaseUrl = 'https://api.moonshot.cn/v1';

    setProvider(labProvider);
    setApiKey(LAB_API_KEY);
    setModel(labModel);
    setBaseUrl(labBaseUrl);
    setShowKey(false);
    setValidation('idle');
    setValidationMsg('');

    onChange({
      provider: labProvider,
      apiKey: LAB_API_KEY,
      model: labModel,
      baseUrl: labBaseUrl,
    });
  };

  const clearLabMode = () => {
    setIsLabMode(false);
    setApiKey('');
    onChange(null);
  };

  return (
    <div
      className="rounded-[16px] p-6 flex flex-col gap-5"
      style={{ background: 'var(--color-bg-panel)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
    >
      {/* ====== Header ====== */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <Settings size={16} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            模型配置
          </h3>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            选择AI模型并输入API Key
          </p>
        </div>
      </div>

      {/* ====== Divider ====== */}
      <div className="h-px w-full" style={{ background: 'var(--color-border)' }} />

      {/* ====== Cost Comparison Card ====== */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: '#F0F7FF', border: '1px solid #C2D8F5' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: '#1A73E8' }} />
          <span className="text-[12px] font-semibold" style={{ color: '#1A73E8' }}>
            费用对比（每次预审约 5K-15K tokens）
          </span>
        </div>
        <div className="space-y-1">
          {PROVIDERS.map(p => (
            <div key={p.key} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span>{p.icon}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{p.label}</span>
                {p.free && (
                  <span
                    className="px-1 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: '#10A37F', color: '#fff' }}
                  >
                    免费
                  </span>
                )}
                {p.recommended && !p.free && (
                  <span
                    className="px-1 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: '#E8F3F1', color: '#0E6B5E' }}
                  >
                    推荐
                  </span>
                )}
              </div>
              <span style={{ color: p.free ? '#10A37F' : 'var(--color-text-muted)', fontWeight: p.free ? 600 : 400 }}>
                {p.costTag}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Gemini Flash 模型对普通用户完全免费，无需绑定信用卡。预审 3 份报告仅需约 ¥0.01-0.3 元（DeepSeek/Kimi）。
        </p>
      </div>

      {/* ====== Provider Selector ====== */}
      <div>
        <label className="text-[13px] font-medium mb-2.5 block" style={{ color: 'var(--color-text-secondary)' }}>
          选择模型提供商
        </label>
        <div className="grid grid-cols-1 gap-2">
          {PROVIDERS.map((p) => {
            const isSelected = provider === p.key;
            return (
              <motion.button
                key={p.key}
                whileHover={{ scale: disabled ? 1 : 1.01 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                onClick={() => { if (!disabled) handleProviderChange(p.key); }}
                className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none"
                style={{
                  borderColor: isSelected ? p.borderColor : 'var(--color-border)',
                  background: isSelected ? p.bgColor : 'var(--color-bg-input)',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {/* Selected indicator dot */}
                {isSelected && (
                  <motion.div
                    layoutId="provider-dot"
                    className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: p.color }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                <span className="text-xl shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? p.color : 'var(--color-text-primary)' }}
                    >
                      {p.label}
                    </span>
                    {p.free && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: '#10A37F', color: '#fff' }}
                      >
                        免费
                      </span>
                    )}
                    {p.recommended && !p.free && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: '#E8F3F1', color: '#0E6B5E' }}
                      >
                        推荐
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {p.tag}
                  </p>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? p.color : 'var(--color-border)',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: p.color }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ====== API Key Input ====== */}
      <div>
        <label className="text-[13px] font-medium mb-2 block flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          <KeyRound size={13} />
          API Key
          <span className="text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({providerConfig.keyHint})
          </span>
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            disabled={disabled}
            placeholder={providerConfig.keyPrefix ? `${providerConfig.keyPrefix}...` : '请输入 API Key'}
            className="w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              borderColor: validation === 'invalid' ? 'var(--color-error)' : 'var(--color-border)',
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
            }}
            onFocus={(e) => {
              if (validation !== 'invalid') {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }
            }}
            onBlur={(e) => {
              if (validation !== 'invalid') {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors focus:outline-none"
            style={{ color: 'var(--color-text-muted)' }}
            tabIndex={-1}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {/* Lab API Key button */}
        {!isLabMode && (
          <button
            onClick={() => { setShowLabDialog(true); setLabPasswordError(''); }}
            disabled={disabled}
            className="mt-2 flex items-center gap-1.5 text-[12px] font-medium transition-colors focus:outline-none"
            style={{ color: 'var(--color-primary)' }}
          >
            <Shield size={13} />
            使用实验室 API Key（需密码）
          </button>
        )}
        {isLabMode && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-primary)' }}>
              <Shield size={13} className="inline mr-1" />
              已启用实验室 API Key (Kimi)
            </span>
            <button
              onClick={clearLabMode}
              className="text-[11px] underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              清除
            </button>
          </div>
        )}
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          您的API Key仅存储在本地浏览器中，不会上传至任何服务器
        </p>
        {/* Validation indicator */}
        <AnimatePresence>
          {validation !== 'idle' && validation !== 'testing' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 flex items-center gap-1.5 text-[12px]"
              style={{
                color: validation === 'valid' ? 'var(--color-primary)' : 'var(--color-error)',
              }}
            >
              {validation === 'valid' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {validationMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====== Model Selector ====== */}
      <div>
        <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
          选择模型版本
        </label>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {modelOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* ====== Gemini Free Tier Warning ====== */}
      {provider === 'gemini' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl p-3.5"
          style={{ background: '#FFF3E0', border: '1px solid #FFCC80' }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={14} style={{ color: '#E65100', marginTop: 1, flexShrink: 0 }} />
            <div>
              <span className="text-[12px] font-semibold" style={{ color: '#E65100' }}>
                免费版 Gemini 可能输出不完整
              </span>
              <p className="text-[11px] mt-1" style={{ color: '#BF360C' }}>
                Gemini 免费版有输出长度限制，报告可能生成到一半就被截断。如遇此问题，建议改用 <strong>Kimi</strong> 或 <strong>DeepSeek</strong>（费用极低，约 ¥0.01-0.3/次），或升级 Gemini 到付费版本。
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ====== Kimi Endpoint Selector ====== */}
      {provider === 'kimi' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl p-3.5"
          style={{ background: '#FFF8E1', border: '1px solid #F0D78C' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={13} style={{ color: '#C8963E' }} />
            <span className="text-[12px] font-semibold" style={{ color: '#C8963E' }}>
              选择 API 端点（Key 与端点必须匹配）
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBaseUrlChange('https://api.moonshot.cn/v1')}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-[12px] font-medium transition-all duration-200 focus:outline-none"
              style={{
                borderColor: (baseUrl === 'https://api.moonshot.cn/v1' || !baseUrl)
                  ? '#4F6EF7' : 'var(--color-border)',
                background: (baseUrl === 'https://api.moonshot.cn/v1' || !baseUrl)
                  ? '#F0F2FF' : 'var(--color-bg-input)',
                color: (baseUrl === 'https://api.moonshot.cn/v1' || !baseUrl)
                  ? '#4F6EF7' : 'var(--color-text-muted)',
              }}
            >
              <Globe size={14} />
              中国境内 (.cn)
            </button>
            <button
              onClick={() => handleBaseUrlChange('https://api.moonshot.ai/v1')}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-[12px] font-medium transition-all duration-200 focus:outline-none"
              style={{
                borderColor: baseUrl === 'https://api.moonshot.ai/v1'
                  ? '#4F6EF7' : 'var(--color-border)',
                background: baseUrl === 'https://api.moonshot.ai/v1'
                  ? '#F0F2FF' : 'var(--color-bg-input)',
                color: baseUrl === 'https://api.moonshot.ai/v1'
                  ? '#4F6EF7' : 'var(--color-text-muted)',
              }}
            >
              <Globe size={14} />
              国际/境外 (.ai)
            </button>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: '#C8963E' }}>
            在 platform.moonshot.cn 注册的 Key → 选「中国境内」；在 platform.moonshot.ai 注册的 Key → 选「国际/境外」。两个平台的 Key 不互通，选错会出现 401 错误。
          </p>
        </motion.div>
      )}

      {/* ====== Advanced: Base URL ====== */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors focus:outline-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Link size={13} />
            高级设置（Base URL）
            <ChevronDown
              size={13}
              className="transition-transform duration-200"
              style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
              自定义 Base URL（代理用户）
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              disabled={disabled}
              placeholder={providerConfig.defaultBaseUrl}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              默认: {providerConfig.defaultBaseUrl}
            </p>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* ====== Test Connection Button ====== */}
      <button
        onClick={testConnection}
        disabled={disabled || !apiKey.trim() || validation === 'testing'}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none"
        style={{
          background: validation === 'valid'
            ? 'var(--color-primary-light)'
            : 'var(--color-bg-input)',
          color: validation === 'valid'
            ? 'var(--color-primary)'
            : 'var(--color-text-secondary)',
          border: `1px solid ${validation === 'valid' ? 'var(--color-primary)' : 'var(--color-border)'}`,
          cursor: disabled || !apiKey.trim() || validation === 'testing' ? 'not-allowed' : 'pointer',
          opacity: disabled || !apiKey.trim() ? 0.5 : 1,
        }}
      >
        {validation === 'testing' ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            测试中...
          </>
        ) : validation === 'valid' ? (
          <>
            <CheckCircle size={15} />
            连接成功
          </>
        ) : (
          <>
            <Sparkles size={15} />
            测试连接
          </>
        )}
      </button>

      {/* ====== Divider ====== */}
      <div className="h-px w-full" style={{ background: 'var(--color-border)' }} />

      {/* ====== Lab API Key Password Dialog ====== */}
      <AnimatePresence>
        {showLabDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowLabDialog(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
              style={{ background: 'var(--color-bg-panel)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-primary-light)' }}
                >
                  <Lock size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h4 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  实验室 API Key
                </h4>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                请输入实验室密码以使用共享的 Kimi API Key。此功能仅面向仇旻教授认可的实验室成员开放。
              </p>
              <div className="relative">
                <input
                  type="password"
                  value={labPassword}
                  onChange={(e) => { setLabPassword(e.target.value); setLabPasswordError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyLabApiKey(); }}
                  placeholder="请输入实验室密码"
                  autoFocus
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{
                    borderColor: labPasswordError ? 'var(--color-error)' : 'var(--color-border)',
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                {labPasswordError && (
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--color-error)' }}>
                    {labPasswordError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLabDialog(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={applyLabApiKey}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                  }}
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== API Key Guide Accordion ====== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            如何获取API Key
          </span>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {API_KEY_GUIDES.map((guide, idx) => {
            const pConfig = PROVIDERS.find(p => p.key === guide.provider)!;
            return (
              <AccordionItem
                key={guide.provider}
                value={guide.provider}
                className="border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border-light)' }}
              >
                <AccordionTrigger className="py-3 text-[13px] hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>{pConfig.icon}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {guide.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {guide.note && (
                      <p
                        className="text-[11px] rounded-lg px-3 py-2"
                        style={{ background: pConfig.bgColor, color: pConfig.color }}
                      >
                        {guide.note}
                      </p>
                    )}
                    <a
                      href={guide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] transition-colors hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <ExternalLink size={11} />
                      {guide.url}
                    </a>
                    <ol className="space-y-1.5">
                      {guide.steps.map((step, stepIdx) => (
                        <li
                          key={stepIdx}
                          className="flex items-start gap-2 text-[12px] group"
                        >
                          <span
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold mt-0.5"
                            style={{
                              background: pConfig.bgColor,
                              color: pConfig.color,
                            }}
                          >
                            {stepIdx + 1}
                          </span>
                          <span
                            className="flex-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {step}
                          </span>
                          <button
                            onClick={() => copyStep(step, idx * 5 + stepIdx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                            style={{ color: 'var(--color-text-muted)' }}
                            title="复制"
                          >
                            {copiedStep === idx * 5 + stepIdx ? (
                              <CheckCircle size={12} style={{ color: 'var(--color-primary)' }} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LLM Adapter — unified streaming interface for multiple providers    */
/* ------------------------------------------------------------------ */

export type ModelProvider = 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'openai';

/* ---------- Pricing config (CNY per 1M tokens, China domestic) ---------- */

interface ModelPricing {
  input: number;       // ¥ per 1M input tokens (cache-miss)
  inputCached: number; // ¥ per 1M cached input tokens
  output: number;      // ¥ per 1M output tokens
  currency: 'CNY' | 'USD';
}

// Verified pricing as of 2026-05-30
// Sources: platform.moonshot.cn, platform.deepseek.com, etc.
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Kimi — moonshot.cn domestic pricing
  'kimi-k2.6':   { input: 6.50,  inputCached: 1.10, output: 27.00, currency: 'CNY' },
  'kimi-k2.5':   { input: 4.00,  inputCached: 0.70, output: 16.00, currency: 'CNY' },
  // DeepSeek — platform.deepseek.com
  'deepseek-chat':     { input: 2.00, inputCached: 0.50, output: 8.00, currency: 'CNY' },
  'deepseek-reasoner': { input: 4.00, inputCached: 1.00, output: 16.00, currency: 'CNY' },
  // OpenAI — USD pricing
  'gpt-4.1':      { input: 2.00,  inputCached: 0.50, output: 8.00,  currency: 'USD' },
  'gpt-4.1-mini': { input: 0.40,  inputCached: 0.10, output: 1.60,  currency: 'USD' },
  'o4-mini':      { input: 1.10,  inputCached: 0.275, output: 4.40, currency: 'USD' },
  // Claude — USD pricing
  'claude-sonnet-4-5': { input: 3.00, inputCached: 0.30, output: 15.00, currency: 'USD' },
  'claude-opus-4-1':   { input: 15.00, inputCached: 1.50, output: 75.00, currency: 'USD' },
  'claude-haiku-4-5':  { input: 1.00, inputCached: 0.10, output: 5.00,  currency: 'USD' },
  // Gemini — free tier
  'gemini-2.5-pro-exp-03-25': { input: 0, inputCached: 0, output: 0, currency: 'CNY' },
  'gemini-2.5-flash':         { input: 0, inputCached: 0, output: 0, currency: 'CNY' },
  'gemini-2.0-flash':         { input: 0, inputCached: 0, output: 0, currency: 'CNY' },
};

const USD_TO_CNY = 7.25; // Approximate exchange rate 2026-05

/**
 * Calculate estimated cost in CNY for a given model and token usage.
 * Costs are approximate — actual billing may differ due to:
 * - Cache hit/miss ratios (we assume 0% cache hit for worst-case)
 * - Platform-specific rounding or minimum charges
 * - Network/request surcharges on some platforms
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): { cny: number; usd: number; breakdown: string } {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return { cny: 0, usd: 0, breakdown: '未知模型定价' };
  }

  if (pricing.currency === 'CNY' && pricing.input === 0) {
    return { cny: 0, usd: 0, breakdown: '免费' };
  }

  const missTokens = Math.max(0, inputTokens - cachedTokens);
  const hitTokens = Math.min(cachedTokens, inputTokens);

  let costCny = 0;
  let costUsd = 0;

  if (pricing.currency === 'CNY') {
    costCny = (missTokens / 1_000_000) * pricing.input +
              (hitTokens / 1_000_000) * pricing.inputCached +
              (outputTokens / 1_000_000) * pricing.output;
    costUsd = costCny / USD_TO_CNY;
  } else {
    costUsd = (missTokens / 1_000_000) * pricing.input +
              (hitTokens / 1_000_000) * pricing.inputCached +
              (outputTokens / 1_000_000) * pricing.output;
    costCny = costUsd * USD_TO_CNY;
  }

  const missCost = (missTokens / 1_000_000) * pricing.input;
  const hitCost = (hitTokens / 1_000_000) * pricing.inputCached;
  const outCost = (outputTokens / 1_000_000) * pricing.output;

  const parts: string[] = [];
  if (missTokens > 0) parts.push(`输入${missTokens >= 1000 ? (missTokens/1000).toFixed(1)+'K' : missTokens} ¥${missCost.toFixed(3)}`);
  if (hitTokens > 0) parts.push(`缓存${hitTokens >= 1000 ? (hitTokens/1000).toFixed(1)+'K' : hitTokens} ¥${hitCost.toFixed(3)}`);
  if (outputTokens > 0) parts.push(`输出${outputTokens >= 1000 ? (outputTokens/1000).toFixed(1)+'K' : outputTokens} ¥${outCost.toFixed(3)}`);

  return {
    cny: costCny,
    usd: costUsd,
    breakdown: parts.join(' + ') || '无',
  };
}

/**
 * Get pricing display for a model (for UI cost tags).
 * Returns a human-readable cost estimate string.
 */
export function getModelCostEstimate(model: string): string {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return '';

  if (pricing.currency === 'CNY' && pricing.input === 0) {
    return '免费';
  }

  // Estimate for a typical review: ~12K input, ~2K output, 0% cache
  const { cny, usd } = calculateCost(model, 12000, 2000);

  if (pricing.currency === 'CNY') {
    // Show range: typical to worst-case (longer papers)
    const { cny: maxCny } = calculateCost(model, 50000, 8000);
    if (maxCny > cny * 1.5) {
      return `~¥${cny.toFixed(1)}-${maxCny.toFixed(0)}/次`;
    }
    return `~¥${cny.toFixed(1)}/次`;
  } else {
    return `~$${usd.toFixed(2)}/次`;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: ModelProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

/* ---------- Provider metadata ---------- */

const PROVIDER_CONFIGS: Record<ModelProvider, {
  label: string;
  description: string;
  icon: string;
  brandColor: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  keyPrefix: string;
  keyHint: string;
}> = {
  kimi: {
    label: 'Kimi',
    description: '1T参数MoE，256K上下文，Agent Swarm',
    icon: '🌙',
    brandColor: '#4F6EF7',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-k2.6',
    models: ['kimi-k2.6', 'kimi-k2.5'],
    keyPrefix: 'sk-',
    keyHint: '以 sk- 开头的 Moonshot API Key',
  },
  gemini: {
    label: 'Gemini',
    description: '2.5 Pro · 1M上下文 · 多模态',
    icon: '✦',
    brandColor: '#1A73E8',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-pro-exp-03-25',
    models: ['gemini-2.5-pro-exp-03-25', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    keyPrefix: '',
    keyHint: 'Google AI Studio API Key',
  },
  claude: {
    label: 'Claude',
    description: 'Sonnet 4.5 · 200K上下文 · 编码最强',
    icon: '◆',
    brandColor: '#D4A27F',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-5',
    models: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
    keyPrefix: 'sk-ant-',
    keyHint: 'Anthropic API Key',
  },
  deepseek: {
    label: 'DeepSeek',
    description: 'V3 · 671B参数 · 性价比之王',
    icon: '🔥',
    brandColor: '#4F6EF7',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyPrefix: 'sk-',
    keyHint: '以 sk- 开头的 DeepSeek API Key',
  },
  openai: {
    label: 'OpenAI',
    description: 'GPT-4.1 · 1M上下文 · 多模态',
    icon: '◉',
    brandColor: '#10A37F',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1',
    models: ['gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
    keyPrefix: 'sk-',
    keyHint: '以 sk- 开头的 OpenAI API Key',
  },
};

export function getProviderConfig(provider: ModelProvider) {
  return PROVIDER_CONFIGS[provider];
}

export function getDefaultModel(provider: ModelProvider): string {
  return PROVIDER_CONFIGS[provider].defaultModel;
}

export function getDefaultBaseUrl(provider: ModelProvider): string {
  return PROVIDER_CONFIGS[provider].defaultBaseUrl;
}

export function getModelOptions(provider: ModelProvider): string[] {
  return PROVIDER_CONFIGS[provider].models;
}

export function validateApiKey(provider: ModelProvider, key: string): boolean {
  if (!key || key.length < 8) return false;
  const config = PROVIDER_CONFIGS[provider];
  if (config.keyPrefix && !key.startsWith(config.keyPrefix)) {
    // Allow any key if prefix doesn't match (some providers have varying prefixes)
    // but require minimum length
    return key.length >= 10;
  }
  return true;
}

/* ---------- API call adapters ---------- */

async function* streamOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ':ok') continue;
        if (trimmed.startsWith('event:') || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (typeof content === 'string') {
              yield content;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* streamClaude(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMsg?.content || '',
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('event:')) continue;
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield parsed.delta.text;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* streamGemini(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const chatMessages = messages.filter(m => m.role !== 'system');
  const systemMsg = messages.find(m => m.role === 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Consolidate consecutive messages with same role (Gemini requires alternating user/model)
  const consolidatedContents: typeof contents = [];
  for (const content of contents) {
    if (consolidatedContents.length > 0 && consolidatedContents[consolidatedContents.length - 1].role === content.role) {
      // Merge with previous
      consolidatedContents[consolidatedContents.length - 1].parts[0].text += '\n\n' + content.parts[0].text;
    } else {
      consolidatedContents.push(content);
    }
  }

  const body: Record<string, unknown> = { contents: consolidatedContents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  // FIX 1: Increase maxOutputTokens for Gemini (reports are long)
  body.generationConfig = {
    maxOutputTokens: 8192,
    temperature: 0.7,
  };

  // FIX 2: Relax safety settings to prevent academic content from being blocked
  body.safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
  ];

  const res = await fetch(
    `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // FIX 3: Check for prompt blocking (input was rejected)
            if (parsed.promptFeedback?.blockReason) {
              throw new Error(
                `Content blocked: ${parsed.promptFeedback.blockReason}. ` +
                `Details: ${JSON.stringify(parsed.promptFeedback.safetyRatings || [])}`
              );
            }

            const candidate = parsed.candidates?.[0];
            if (!candidate) continue;

            // FIX 4: Check finishReason to detect truncation
            const finishReason = candidate.finishReason;
            if (finishReason === 'MAX_TOKENS' && !truncated) {
              truncated = true;
              yield '\n\n---\n⚠️ **注意**：报告因达到输出长度限制而被截断。建议：1) 使用付费API获得更长输出 2) 减少论文篇幅后重试 3) 切换至其他模型。\n';
            } else if (finishReason === 'SAFETY' && !truncated) {
              truncated = true;
              yield '\n\n---\n⚠️ **注意**：报告因安全过滤被截断。请检查论文内容是否包含敏感信息。\n';
            } else if (finishReason === 'RECITATION' && !truncated) {
              truncated = true;
              yield '\n\n---\n⚠️ **注意**：报告因引用限制被截断。\n';
            }

            // FIX 5: Handle content with parts
            const parts = candidate.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (typeof part.text === 'string') {
                  yield part.text;
                }
              }
            }

            // FIX 6: Handle empty content but with finishReason STOP (normal end)
            // —— nothing to yield, stream naturally ends
          } catch (e) {
            // If it's our thrown error, re-throw it
            if (e instanceof Error && e.message.startsWith('Content blocked')) {
              throw e;
            }
            // Otherwise skip unparseable lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/* ---------- Public streaming API ---------- */

export async function streamChat(
  config: LLMConfig,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<() => void> {
  const { provider, apiKey, baseUrl, model } = config;
  const effectiveBaseUrl = baseUrl || getDefaultBaseUrl(provider);
  const abortController = new AbortController();
  const { signal } = abortController;

  (async () => {
    try {
      let generator: AsyncGenerator<string, void, unknown>;

      switch (provider) {
        case 'claude':
          generator = streamClaude(effectiveBaseUrl, apiKey, model, messages, signal);
          break;
        case 'gemini':
          generator = streamGemini(effectiveBaseUrl, apiKey, model, messages, signal);
          break;
        default:
          // OpenAI-compatible: kimi, deepseek, openai
          generator = streamOpenAICompatible(effectiveBaseUrl, apiKey, model, messages, signal);
          break;
      }

      for await (const chunk of generator) {
        if (signal.aborted) return;
        onChunk(chunk);
      }

      if (!signal.aborted) {
        onDone();
      }
    } catch (err: unknown) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      onError(message);
    }
  })();

  return () => {
    abortController.abort();
  };
}

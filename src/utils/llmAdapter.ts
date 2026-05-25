/* ------------------------------------------------------------------ */
/*  LLM Adapter — unified streaming interface for multiple providers    */
/* ------------------------------------------------------------------ */

export type ModelProvider = 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'openai';

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

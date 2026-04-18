export interface BYOMConfig {
  provider: "openai" | "anthropic" | "ollama" | "custom";
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

export interface BYOMAdapter {
  chat(messages: ChatMessage[]): AsyncIterable<ChatCompletionChunk>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1" },
  ollama: { baseUrl: "http://localhost:11434/v1" },
};

export function createBYOMAdapter(config: BYOMConfig): BYOMAdapter {
  const baseUrl = config.baseUrl || PROVIDER_DEFAULTS[config.provider]?.baseUrl || config.baseUrl;

  async function* chat(messages: ChatMessage[]): AsyncIterable<ChatCompletionChunk> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BYOM request failed (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          yield { content: "", done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield { content: delta, done: false };
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    yield { content: "", done: true };
  }

  async function testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.headers,
      };

      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  return { chat, testConnection };
}

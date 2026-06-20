import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
export const OPENROUTER_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS || 700);

export const AI_MODEL = process.env.OPENROUTER_API_KEY ? OPENROUTER_MODEL : OPENAI_MODEL;

export function getOpenAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("No AI API key is configured.");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" : undefined,
    defaultHeaders: process.env.OPENROUTER_API_KEY
      ? {
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-OpenRouter-Title": "AI PPT Analyzer"
        }
      : undefined
  });
}

type OutputContent = {
  type?: string;
  text?: string;
};

type OutputMessage = {
  type?: string;
  content?: OutputContent[];
};

type ResponseLike = {
  output_text?: unknown;
  output?: OutputMessage[];
};

export function getResponseText(response: unknown) {
  const responseLike = response as ResponseLike;

  if (typeof responseLike.output_text === "string") {
    return responseLike.output_text;
  }

  const textParts: string[] = [];

  for (const item of responseLike.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

export function getChatCompletionText(response: unknown) {
  const completion = response as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string; type?: string }>;
      };
    }>;
  };
  const content = completion.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export function getAIProviderError(error: unknown) {
  const candidate = error as {
    message?: unknown;
    status?: unknown;
    error?: {
      message?: unknown;
      code?: unknown;
    };
  };
  const message =
    typeof candidate.error?.message === "string"
      ? candidate.error.message
      : typeof candidate.message === "string"
        ? candidate.message
        : "";
  const status = typeof candidate.status === "number" ? `Status ${candidate.status}: ` : "";

  return `${status}${message}`.trim();
}

export async function createDocumentResponse({
  buffer,
  filename,
  mimeType,
  prompt,
  extractedText
}: {
  buffer?: Buffer;
  filename: string;
  mimeType?: string;
  prompt: string;
  extractedText?: string;
}) {
  const client = getOpenAIClient();

  if (process.env.OPENROUTER_API_KEY) {
    const response = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      max_tokens: OPENROUTER_MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nDocument name: ${filename}\n\nExtracted document text:\n${extractedText || "No readable text could be extracted from this document."}`
        }
      ]
    });

    return getChatCompletionText(response);
  }

  if (!buffer) {
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: `${prompt}\n\nDocument name: ${filename}\n\nExtracted document text:\n${extractedText || "No readable text could be extracted from this document."}`
    });

    return getResponseText(response);
  }

  const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${buffer.toString("base64")}`;

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename,
            file_data: dataUrl
          },
          {
            type: "input_text",
            text: prompt
          }
        ]
      }
    ]
  });

  return getResponseText(response);
}

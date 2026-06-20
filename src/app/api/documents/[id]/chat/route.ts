import fs from "node:fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { extractDocumentText, limitExtractedText } from "@/lib/documents";
import { AI_MODEL, createDocumentResponse, getAIProviderError, getOpenAIClient } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to chat with a document." }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a question about this document." }, { status: 400 });
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: session.user.id
    },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      chatMessages: {
        orderBy: { createdAt: "asc" },
        take: 10
      }
    }
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  let client;

  try {
    client = getOpenAIClient();
  } catch (error) {
    return NextResponse.json({ error: "AI is not configured. Add OPENAI_API_KEY or OPENROUTER_API_KEY to your environment." }, { status: 500 });
  }

  const buffer = await fs.readFile(document.storagePath).catch(() => null);

  if (!buffer) {
    return NextResponse.json({ error: "The original uploaded file is missing from local storage." }, { status: 410 });
  }

  await prisma.chatMessage.create({
    data: {
      documentId: document.id,
      role: "user",
      content: parsed.data.message
    }
  });

  const previousChat = document.chatMessages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  const prompt = [
    "Answer the user's question concisely using only the uploaded document and the saved analysis summary.",
    "If the document does not contain the answer, say that clearly and suggest what information is missing.",
    document.analyses[0]?.content ? `Saved analysis:\n${document.analyses[0].content}` : "",
    previousChat ? `Recent chat:\n${previousChat}` : "",
    `User question: ${parsed.data.message}`
  ].join("\n\n");

  try {
    const extractedText = limitExtractedText(await extractDocumentText(buffer, document.originalName));

    if (process.env.OPENROUTER_API_KEY && !extractedText) {
      throw new Error("This file type cannot be used for chat with the current OpenRouter balance because file uploads require at least $0.50. Use a PDF, TXT, Markdown, or CSV file, or add OpenRouter credits.");
    }

    const answer = await createDocumentResponse({
      buffer,
      filename: document.originalName,
      mimeType: document.mimeType,
      prompt,
      extractedText
    });

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        documentId: document.id,
        role: "assistant",
        content: answer || "I could not produce an answer from this document.",
        model: AI_MODEL
      }
    });

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    const message = getAIProviderError(error);
    const creditError = message.includes("requires more credits") || message.includes("can only afford") || message.includes("$0.50");

    return NextResponse.json(
      {
        error: creditError
          ? "OpenRouter rejected the request because the account does not have enough credits for this answer. Try a smaller PDF, add OpenRouter credits, or lower OPENROUTER_MAX_TOKENS."
          : `The AI could not answer this question right now.${message ? ` Provider said: ${message}` : ""}`
      },
      { status: 502 }
    );
  }
}

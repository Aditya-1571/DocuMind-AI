import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { extractDocumentText, limitExtractedText, safeStoredName, validateUpload } from "@/lib/documents";
import { AI_MODEL, createDocumentResponse, getAIProviderError, getOpenAIClient } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to analyze documents." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const instruction = String(formData?.get("instruction") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a document to analyze." }, { status: 400 });
  }

  const validationError = validateUpload(file);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    getOpenAIClient();
  } catch (error) {
    return NextResponse.json({ error: "AI is not configured. Add OPENAI_API_KEY or OPENROUTER_API_KEY to your environment." }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedName = safeStoredName(file.name);
  const uploadsDir = process.env.VERCEL ? os.tmpdir() : path.join(process.cwd(), "uploads");
  const storagePath = path.join(uploadsDir, storedName);

  const prompt = [
    "Analyze this uploaded document for a learner.",
    "Return a concise study report with these sections:",
    "1. Short summary",
    "2. Detailed explanation",
    "3. Page or slide-wise breakdown when the document structure is available",
    "4. Key concepts and definitions",
    "5. Important takeaways",
    "6. Suggested questions and answers",
    "Keep the response under 700 tokens. Use plain language, be accurate, and do not invent details that are not present.",
    instruction ? `User instruction: ${instruction}` : "User instruction: explain in a balanced, beginner-friendly way."
  ].join("\n");

  try {
    const extractedText = limitExtractedText(await extractDocumentText(buffer, file.name));

    if (process.env.OPENROUTER_API_KEY && !extractedText) {
      throw new Error("No readable text could be extracted. Upload a text-based PDF, TXT, Markdown, or CSV file. Scanned image PDFs need OCR before analysis.");
    }

    await fs.mkdir(uploadsDir, { recursive: true }).catch(() => undefined);
    await fs.writeFile(storagePath, buffer).catch(() => undefined);

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        extractedText: extractedText || null
      }
    });

    const content = await createDocumentResponse({
      buffer,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      prompt,
      extractedText
    });

    const analysis = await prisma.analysis.create({
      data: {
        documentId: document.id,
        instruction: instruction || null,
        content: content || "The analysis completed, but no text was returned.",
        model: AI_MODEL
      }
    });

    return NextResponse.json({ documentId: document.id, analysisId: analysis.id });
  } catch (error) {
    await fs.unlink(storagePath).catch(() => undefined);
    const message = getAIProviderError(error);
    const creditError = message.includes("requires more credits") || message.includes("can only afford") || message.includes("$0.50");

    return NextResponse.json(
      {
        error: creditError
          ? "OpenRouter rejected the request because the account does not have enough credits for this analysis. Try a smaller PDF, add OpenRouter credits, or lower OPENROUTER_MAX_TOKENS."
          : `The AI could not analyze this document.${message ? ` Provider said: ${message}` : " Check the file type, API key, and model access, then try again."}`
      },
      { status: 502 }
    );
  }
}

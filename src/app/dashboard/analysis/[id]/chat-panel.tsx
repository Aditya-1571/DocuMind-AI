"use client";

import { useState } from "react";
import type { ChatMessage } from "@prisma/client";
import { Send } from "lucide-react";

type Message = Pick<ChatMessage, "id" | "role" | "content">;

export function ChatPanel({ documentId, initialMessages }: { documentId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    const optimisticUserMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setMessage("");
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/documents/${documentId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed })
    });

    const data = (await response.json().catch(() => null)) as { message?: Message; error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok || !data?.message) {
      setError(data?.error ?? "Could not answer that question.");
      return;
    }

    setMessages((current) => [...current, data.message as Message]);
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-ink dark:text-slate-100">Chat with document</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ask follow-up questions from the uploaded file.</p>
      </div>

      <div className="flex h-[520px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">Ask what matters most from this document.</p>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg px-3 py-2 text-sm leading-6 ${
                  item.role === "user" ? "ml-8 bg-blue-600 text-white" : "mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {item.content}
              </div>
            ))
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 p-4 dark:border-slate-800">
          {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask a question..."
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              aria-label="Send question"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

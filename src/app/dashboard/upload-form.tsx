"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Choose a document first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("instruction", instruction);
    setIsSubmitting(true);

    const response = await fetch("/api/documents/analyze", {
      method: "POST",
      body: formData
    });

    const data = (await response.json().catch(() => null)) as { documentId?: string; error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok || !data?.documentId) {
      setError(data?.error ?? "Could not analyze the document.");
      return;
    }

    router.push(`/dashboard/analysis/${data.documentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Document
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.csv,.xls,.xlsx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-slate-800"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Analysis instruction
        <textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          rows={5}
          placeholder="Example: explain for a beginner, make exam notes, or list the most important concepts."
          className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        <Send className="h-4 w-4" aria-hidden />
        {isSubmitting ? "Analyzing..." : "Analyze document"}
      </button>
    </form>
  );
}

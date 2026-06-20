import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderMenu } from "@/components/HeaderMenu";
import { ChatPanel } from "@/app/dashboard/analysis/[id]/chat-panel";

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = params;
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
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!document) {
    notFound();
  }

  const analysis = document.analyses[0];

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-ink dark:text-slate-100">{document.originalName}</h1>
          </div>
          <HeaderMenu />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-accent">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-semibold text-ink dark:text-slate-100">AI study report</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Generated with {analysis?.model ?? "AI"}</p>
            </div>
          </div>
          <div className="prose-report text-sm text-slate-800 dark:text-slate-200">{analysis?.content ?? "No analysis is available for this document."}</div>
        </article>

        <ChatPanel documentId={document.id} initialMessages={document.chatMessages} />
      </div>
    </main>
  );
}

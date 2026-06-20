import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderMenu } from "@/components/HeaderMenu";
import { UploadForm } from "@/app/dashboard/upload-form";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-accent">Your DOC Analyzer</p>
            <h1 className="text-xl font-semibold text-ink dark:text-slate-100">Document dashboard</h1>
          </div>
          <HeaderMenu />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-accent">
              <Upload className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-semibold text-ink dark:text-slate-100">Upload a document</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">PDF, PPT, Word, text, or spreadsheet.</p>
            </div>
          </div>
          <UploadForm />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Recent analyses</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">{documents.length} saved</span>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <FileText className="mx-auto h-9 w-9 text-slate-400" aria-hidden />
              <p className="mt-3 font-medium text-slate-800 dark:text-slate-100">No documents yet</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload your first file to generate a study report.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/dashboard/analysis/${document.id}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-ink dark:text-slate-100">{document.originalName}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {document.analyses[0]?.content || "Analysis saved."}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(document.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import { Building2, Mail } from "lucide-react";
import { signIn } from "next-auth/react";

export function OAuthButtons({
  googleEnabled,
  microsoftEnabled,
  callbackUrl
}: {
  googleEnabled: boolean;
  microsoftEnabled: boolean;
  callbackUrl: string;
}) {
  if (!googleEnabled && !microsoftEnabled) {
    return null;
  }

  return (
    <div className="space-y-3">
      {googleEnabled ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Continue with Google/Gmail
        </button>
      ) : null}

      {microsoftEnabled ? (
        <button
          type="button"
          onClick={() => signIn("azure-ad", { callbackUrl })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Building2 className="h-4 w-4" aria-hidden />
          Continue with Microsoft
        </button>
      ) : null}

      <div className="flex items-center gap-3 text-xs font-medium uppercase text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}

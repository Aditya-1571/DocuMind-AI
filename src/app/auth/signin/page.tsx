import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { SignInForm } from "@/app/auth/signin/sign-in-form";

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const microsoftEnabled = Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

  return (
    <AuthCard title="Sign in" subtitle="Use email, Google/Gmail, or Microsoft to continue to your document dashboard.">
      <Suspense fallback={<div className="h-48 rounded-md bg-slate-50" />}>
        <SignInForm googleEnabled={googleEnabled} microsoftEnabled={microsoftEnabled} />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/auth/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

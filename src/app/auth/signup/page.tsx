import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { SignUpForm } from "@/app/auth/signup/sign-up-form";

export default function SignUpPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const microsoftEnabled = Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

  return (
    <AuthCard title="Create account">
      <SignUpForm googleEnabled={googleEnabled} microsoftEnabled={microsoftEnabled} />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/auth/signin" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

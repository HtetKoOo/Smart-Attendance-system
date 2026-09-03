import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import Link from "next/link";

export const metadata = {
  title: "Login - KBU Smart Attendance System",
};

export default async function LoginPage() {
  const session = await getSession();

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your KBU Smart Attendance account
        </p>
      </div>

      <LoginForm />

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service
      </p>
    </div>
  );
}

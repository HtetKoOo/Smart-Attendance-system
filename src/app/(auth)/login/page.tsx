import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";

export const metadata = {
  title: "Login - Smart Attendance System",
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
          Sign in to your Smart Attendance account
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service
      </p>
    </div>
  );
}

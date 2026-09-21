import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";
import Link from "next/link";

export const metadata = {
  title: "Register - KBU Smart Attendance System",
};

export default async function RegisterPage() {
  const session = await getSession();

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="mx-auto w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Academic Seminar Project
        </p>
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to get started with KBU Smart Attendance
        </p>
      </div>

      <RegisterForm />

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign In
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By registering, you agree to our Terms of Service
      </p>
    </div>
  );
}

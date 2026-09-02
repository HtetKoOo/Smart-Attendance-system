import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users2,
  BookOpen,
  Clock,
  BarChart3,
  GraduationCap,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <Link href="/login">
            <Button variant="default" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium">
            <GraduationCap className="size-4" />
            Smart Attendance System
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Attendance Made{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Simple
            </span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Streamline student attendance tracking with modern face recognition
            technology. Built for universities and educational institutions.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Designed for Modern Education
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Users2}
            title="Student Management"
            description="Manage students, enrollment, and track individual attendance records"
          />
          <FeatureCard
            icon={BookOpen}
            title="Course Management"
            description="Organize courses, classrooms, and class schedules efficiently"
          />
          <FeatureCard
            icon={Clock}
            title="Schedule Management"
            description="Create and manage class schedules with automatic time tracking"
          />
          <FeatureCard
            icon={BarChart3}
            title="Attendance Analytics"
            description="View detailed attendance reports and analytics by student or course"
          />
        </div>
      </section>

      {/* Roles Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Built for All Users
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          <RoleCard
            title="Administrators"
            description="Manage all students, lecturers, courses, and view system-wide attendance analytics"
          />
          <RoleCard
            title="Lecturers"
            description="Track your students' attendance, view your courses, and manage your schedule"
          />
          <RoleCard
            title="Students"
            description="View your courses, check your attendance record, and stay updated on class schedules"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
          <p>Smart Attendance System © 2025. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface RoleCardProps {
  title: string;
  description: string;
}

function RoleCard({ title, description }: RoleCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

import { requireRole } from "@/lib/session";
import { BarChart3, Users, Users2, BookOpen } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard - Smart Attendance System",
};

export default async function AdminDashboardPage() {
  // Protect this route - only admins can access
  await requireRole("ADMIN");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Overview of your attendance system
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Users}
          title="Total Students"
          value="248"
          description="Enrolled students"
        />
        <SummaryCard
          icon={Users2}
          title="Total Lecturers"
          value="32"
          description="Active lecturers"
        />
        <SummaryCard
          icon={BookOpen}
          title="Total Courses"
          value="64"
          description="Active courses"
        />
        <SummaryCard
          icon={BarChart3}
          title="Today's Attendance"
          value="92%"
          description="Class attendance rate"
        />
      </div>

      {/* Placeholder sections for future features */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">
            Coming soon: Activity feed and system logs
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">System Status</h3>
          <p className="text-sm text-muted-foreground">
            Coming soon: System health and performance metrics
          </p>
        </div>
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="size-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

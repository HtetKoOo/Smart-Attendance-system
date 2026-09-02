import { requireRole } from "@/lib/session";
import { BookOpen, Clock, BarChart3, Users } from "lucide-react";

export const metadata = {
  title: "Lecturer Dashboard - Smart Attendance System",
};

export default async function LecturerDashboardPage() {
  // Protect this route - only lecturers can access
  await requireRole("LECTURER");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Lecturer Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Manage courses and track attendance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          title="My Courses"
          value="4"
          description="Assigned courses"
        />
        <SummaryCard
          icon={Users}
          title="My Students"
          value="156"
          description="Total enrolled"
        />
        <SummaryCard
          icon={Clock}
          title="Classes Today"
          value="2"
          description="Scheduled today"
        />
        <SummaryCard
          icon={BarChart3}
          title="Avg. Attendance"
          value="87%"
          description="Across all courses"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">My Courses</h3>
            <div className="space-y-3">
              <CourseItem code="CS101" name="Introduction to Programming" />
              <CourseItem code="CS201" name="Data Structures" />
              <CourseItem code="CS301" name="Algorithms" />
              <CourseItem code="CS401" name="Web Development" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Today Classes</h3>
            <p className="text-sm text-muted-foreground">
              Coming soon: Real-time class schedules
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <p className="text-sm text-muted-foreground">
              Coming soon: Class-specific attendance metrics
            </p>
          </div>
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

interface CourseItemProps {
  code: string;
  name: string;
}

function CourseItem({ code, name }: CourseItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3 hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{code}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

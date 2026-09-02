import { requireRole } from "@/lib/session";
import { BookOpen, Clock, BarChart3, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Student Dashboard - Smart Attendance System",
};

export default async function StudentDashboardPage() {
  // Protect this route - only students can access
  await requireRole("STUDENT");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Student Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Track courses and attendance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          title="My Courses"
          value="5"
          description="Enrolled courses"
        />
        <SummaryCard
          icon={Clock}
          title="Classes Today"
          value="2"
          description="Scheduled today"
        />
        <SummaryCard
          icon={BarChart3}
          title="Attendance Rate"
          value="94%"
          description="Overall this semester"
        />
        <SummaryCard
          icon={AlertCircle}
          title="Low Attendance"
          value="0"
          description="Courses below threshold"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">My Courses</h3>
            <div className="space-y-3">
              <CourseItem
                code="CS101"
                name="Introduction to Programming"
                attendance="95%"
              />
              <CourseItem
                code="CS201"
                name="Data Structures"
                attendance="92%"
              />
              <CourseItem code="CS301" name="Algorithms" attendance="88%" />
              <CourseItem
                code="CS401"
                name="Web Development"
                attendance="97%"
              />
              <CourseItem code="MATH101" name="Calculus I" attendance="90%" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Today Schedule</h3>
            <div className="space-y-2">
              <ScheduleItem time="09:00" course="CS101" room="Room 201" />
              <ScheduleItem time="14:00" course="CS301" room="Room 305" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Full schedule coming soon
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Attendance Alert</h3>
            <p className="text-sm text-muted-foreground">
              Keep attending classes to maintain excellent attendance!
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
  attendance: string;
}

function CourseItem({ code, name, attendance }: CourseItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3 hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium text-sm">{code}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">{attendance}</p>
        <p className="text-xs text-muted-foreground">attendance</p>
      </div>
    </div>
  );
}

interface ScheduleItemProps {
  time: string;
  course: string;
  room: string;
}

function ScheduleItem({ time, course, room }: ScheduleItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background p-2">
      <div className="text-sm font-semibold">{time}</div>
      <div>
        <p className="text-sm font-medium">{course}</p>
        <p className="text-xs text-muted-foreground">{room}</p>
      </div>
    </div>
  );
}

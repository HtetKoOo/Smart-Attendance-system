"use client";

import { NavItem } from "@/components/common/nav-item";
import { Logo } from "@/components/common/logo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Users2,
  Building2,
  Clock,
  BarChart3,
  Settings,
  ScanFace,
  UserCheck,
  Eye,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

interface NavItemConfig {
  href: string;
  icon: LucideIcon;
  label: string;
  comingSoon?: boolean;
}

interface SidebarProps {
  role?: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const getNavItems = () => {
    const baseItems: NavItemConfig[] = [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ];

    if (role === "ADMIN") {
      return [
        ...baseItems,
        {
          href: "/dashboard/admin/students",
          icon: Users,
          label: "Students",
        },
        {
          href: "/dashboard/admin/lecturers",
          icon: Users2,
          label: "Lecturers",
        },
        {
          href: "/dashboard/admin/courses",
          icon: BookOpen,
          label: "Courses",
        },
        {
          href: "/dashboard/admin/classrooms",
          icon: Building2,
          label: "Classrooms",
        },
        {
          href: "/dashboard/admin/schedules",
          icon: Clock,
          label: "Schedules",
        },
        {
          href: "/dashboard/admin/face-enrollment",
          icon: UserCheck,
          label: "Face Enrollment",
        },
        {
          href: "/dashboard/admin/face-recognition-test",
          icon: Eye,
          label: "Face Recognition Test",
        },
        {
          href: "/dashboard/attendance/record",
          icon: ClipboardCheck,
          label: "Record Attendance",
        },
        {
          href: "/dashboard/admin/enrollments",
          icon: GraduationCap,
          label: "Course Enrollments",
        },
        {
          href: "/dashboard/admin/face-recognition",
          icon: ScanFace,
          label: "Face Detection",
        },
        {
          href: "/dashboard/admin/attendance",
          icon: BarChart3,
          label: "Attendance",
          comingSoon: true,
        },
        {
          href: "/dashboard/admin/settings",
          icon: Settings,
          label: "Settings",
          comingSoon: true,
        },
      ];
    }

    if (role === "LECTURER") {
      return [
        ...baseItems,
        {
          href: "/dashboard/lecturer/enrollments",
          icon: GraduationCap,
          label: "My Course Students",
        },
        {
          href: "/dashboard/attendance/record",
          icon: ClipboardCheck,
          label: "Record Attendance",
        },
        {
          href: "/dashboard/admin/face-recognition",
          icon: ScanFace,
          label: "Face Detection",
        },
        {
          href: "/dashboard/lecturer/courses",
          icon: BookOpen,
          label: "My Courses",
          comingSoon: true,
        },
        {
          href: "/dashboard/lecturer/schedule",
          icon: Clock,
          label: "My Schedule",
          comingSoon: true,
        },
        {
          href: "/dashboard/lecturer/attendance",
          icon: BarChart3,
          label: "Attendance",
          comingSoon: true,
        },
        {
          href: "/dashboard/lecturer/settings",
          icon: Settings,
          label: "Settings",
          comingSoon: true,
        },
      ];
    }

    if (role === "STUDENT") {
      return [
        ...baseItems,
        {
          href: "/dashboard/student/courses",
          icon: BookOpen,
          label: "My Courses",
          comingSoon: true,
        },
        {
          href: "/dashboard/student/schedule",
          icon: Clock,
          label: "My Schedule",
          comingSoon: true,
        },
        {
          href: "/dashboard/student/attendance",
          icon: BarChart3,
          label: "My Attendance",
          comingSoon: true,
        },
        {
          href: "/dashboard/student/settings",
          icon: Settings,
          label: "Settings",
          comingSoon: true,
        },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const navigation = (showLabel = false, onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {navItems.map((item) => (
        <div key={item.href} onClick={onNavigate}>
          <NavItem
            href={item.href}
            icon={item.icon}
            label={item.label}
            comingSoon={item.comingSoon}
            showLabel={showLabel}
          />
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="border-b border-sidebar-border p-4">
          <Logo />
        </div>
        {navigation()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="border-b border-sidebar-border p-4">
              <Logo />
            </div>
            {navigation(true, onMobileClose)}
          </aside>
        </div>
      )}
    </>
  );
}

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
  UserCheck,
  Eye,
  ClipboardCheck,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

interface NavItemConfig {
  href: string;
  icon: LucideIcon;
  label: string;
  comingSoon?: boolean;
  exact?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItemConfig[];
}

interface SidebarProps {
  role?: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const getNavItems = () => {
    const dashboardHref = role
      ? `/dashboard/${role.toLowerCase()}`
      : "/dashboard";
    const baseItems: NavItemConfig[] = [
      { href: dashboardHref, icon: LayoutDashboard, label: "Dashboard", exact: true },
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
          href: "/dashboard/admin/face-calibration",
          icon: SlidersHorizontal,
          label: "Recognition Calibration",
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
          href: "/dashboard/admin/attendance",
          icon: BarChart3,
          label: "Attendance History",
        },
        {
          href: "/dashboard/admin/settings",
          icon: Settings,
          label: "Settings",
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
          href: "/dashboard/lecturer/courses",
          icon: BookOpen,
          label: "My Courses",
        },
        {
          href: "/dashboard/lecturer/schedule",
          icon: Clock,
          label: "My Schedule",
        },
        {
          href: "/dashboard/lecturer/attendance",
          icon: BarChart3,
          label: "My Attendance History",
        },
        {
          href: "/dashboard/lecturer/settings",
          icon: Settings,
          label: "Settings",
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
        },
        {
          href: "/dashboard/student/schedule",
          icon: Clock,
          label: "My Schedule",
        },
        {
          href: "/dashboard/student/attendance",
          icon: BarChart3,
          label: "My Attendance",
        },
        {
          href: "/dashboard/student/settings",
          icon: Settings,
          label: "Settings",
        },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const navSections: NavSection[] =
    role === "ADMIN"
      ? [
          { items: navItems.filter((item) => item.label === "Dashboard") },
          {
            label: "Academic Management",
            items: navItems.filter((item) =>
              [
                "/dashboard/admin/students",
                "/dashboard/admin/lecturers",
                "/dashboard/admin/courses",
                "/dashboard/admin/classrooms",
                "/dashboard/admin/schedules",
                "/dashboard/admin/enrollments",
              ].includes(item.href),
            ),
          },
          {
            label: "Attendance",
            items: navItems.filter((item) =>
              [
                "/dashboard/admin/face-enrollment",
                "/dashboard/attendance/record",
                "/dashboard/admin/attendance",
              ].includes(item.href),
            ),
          },
          {
            label: "Advanced Tools",
            items: navItems.filter((item) =>
              [
                "/dashboard/admin/face-recognition-test",
                "/dashboard/admin/face-calibration",
              ].includes(item.href),
            ),
          },
          {
            label: "Settings",
            items: navItems.filter(
              (item) => item.href === "/dashboard/admin/settings",
            ),
          },
        ]
      : [{ items: navItems }];

  const navigation = (showLabel = false, onNavigate?: () => void) => (
    <nav className="flex-1 space-y-5 overflow-y-auto p-4">
      {navSections.map((section, sectionIndex) => (
        <section key={section.label ?? `navigation-${sectionIndex}`}>
          {section.label && (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
              {section.label}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <div key={item.href} onClick={onNavigate}>
                <NavItem
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  comingSoon={item.comingSoon}
                  showLabel={showLabel}
                  exact={item.exact}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
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
            <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
              <Logo />
            </div>
            {navigation(true, onMobileClose)}
          </aside>
        </div>
      )}
    </>
  );
}

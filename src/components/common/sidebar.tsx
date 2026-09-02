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
}

export function Sidebar({ role }: SidebarProps) {
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
          comingSoon: true,
        },
        {
          href: "/dashboard/admin/lecturers",
          icon: Users2,
          label: "Lecturers",
          comingSoon: true,
        },
        {
          href: "/dashboard/admin/courses",
          icon: BookOpen,
          label: "Courses",
          comingSoon: true,
        },
        {
          href: "/dashboard/admin/classrooms",
          icon: Building2,
          label: "Classrooms",
          comingSoon: true,
        },
        {
          href: "/dashboard/admin/schedules",
          icon: Clock,
          label: "Schedules",
          comingSoon: true,
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

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border p-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            comingSoon={item.comingSoon}
          />
        ))}
      </nav>
    </aside>
  );
}

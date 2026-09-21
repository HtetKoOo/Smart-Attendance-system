"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileBarChart,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Schedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  course: { code: string; name: string };
  classroom: { name: string };
  lecturer: { user: { name: string } };
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT";
  recognizedAt: string | null;
  student: { id: string; name: string };
  course: { code: string; name: string };
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    classroom: string;
    lecturer: string;
  };
};

type ReportData = {
  summary: { total: number; present: number; late: number; absent: number };
  truncated: boolean;
  maxRows: number;
  attendances: AttendanceRecord[];
};

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function csvCell(value: string | number | null) {
  const normalized = value === null ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

function statusClasses(status: AttendanceRecord["status"]) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-800";
  if (status === "LATE") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function AttendanceReportContent() {
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return inputDate(start);
  });
  const [to, setTo] = useState(() => inputDate(today));
  const [classScheduleId, setClassScheduleId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedules() {
      try {
        const response = await fetch("/api/attendance/schedules");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load schedules.");
        if (!cancelled) setSchedules(data.schedules || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load schedules.",
          );
        }
      } finally {
        if (!cancelled) setLoadingSchedules(false);
      }
    }

    loadSchedules();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadReport = useCallback(async () => {
    if (!from || !to) return;

    setLoadingReport(true);
    setError(null);

    try {
      const params = new URLSearchParams({ from, to });
      if (classScheduleId) params.set("classScheduleId", classScheduleId);
      if (status) params.set("status", status);

      const response = await fetch(`/api/admin/attendance-reports?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load attendance report.");
      setReport(data);
    } catch (loadError) {
      setReport(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load attendance report.",
      );
    } finally {
      setLoadingReport(false);
    }
  }, [from, to, classScheduleId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const visibleRecords = useMemo(() => {
    if (!report) return [];
    const query = search.trim().toLowerCase();
    if (!query) return report.attendances;

    return report.attendances.filter((record) =>
      [
        record.student.name,
        record.student.id,
        record.course.code,
        record.course.name,
        record.schedule.lecturer,
        record.schedule.classroom,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [report, search]);

  function exportCsv() {
    if (!report) return;

    const header = [
      "Date",
      "Student Name",
      "Student ID",
      "Course Code",
      "Course Name",
      "Schedule",
      "Classroom",
      "Lecturer",
      "Status",
      "Recognized At",
    ];

    const rows = visibleRecords.map((record) => [
      formatDate(record.date),
      record.student.name,
      record.student.id,
      record.course.code,
      record.course.name,
      `${record.schedule.dayOfWeek} ${record.schedule.startTime}-${record.schedule.endTime}`,
      record.schedule.classroom,
      record.schedule.lecturer,
      record.status,
      formatTime(record.recognizedAt),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvCell(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <FileBarChart className="size-4" />
            Attendance reporting
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
          <p className="mt-2 text-muted-foreground">
            Review real recorded attendance, filter sessions, and export the selected report.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          disabled={!report || visibleRecords.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Report filters</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a date range, then narrow the history to one class session or status.
            </p>
          </div>
          <Button type="button" size="sm" onClick={loadReport} disabled={loadingReport}>
            <RefreshCw className={`mr-2 size-4 ${loadingReport ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm font-medium">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={inputDate(today)}
              onChange={(event) => setTo(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Class schedule
            <select
              value={classScheduleId}
              onChange={(event) => setClassScheduleId(event.target.value)}
              disabled={loadingSchedules}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value="">All schedules</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.course.code} · {schedule.dayOfWeek} {schedule.startTime}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All recorded statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Recorded" value={report?.summary.total ?? 0} icon={Users} loading={loadingReport} />
        <SummaryCard label="Present" value={report?.summary.present ?? 0} icon={CheckCircle2} loading={loadingReport} tone="success" />
        <SummaryCard label="Late" value={report?.summary.late ?? 0} icon={AlertCircle} loading={loadingReport} tone="warning" />
        <SummaryCard label="Absent" value={report?.summary.absent ?? 0} icon={AlertCircle} loading={loadingReport} tone="danger" />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Attendance records</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loadingReport ? "Loading attendance…" : `${visibleRecords.length} record(s) shown`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student or course…"
              className="h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {report?.truncated && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
            This query has {report.summary.total} records. Only the newest {report.maxRows} records are displayed and exported; narrow the date range for a complete CSV.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Course / session</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Recognized at</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
{loadingReport ? (
  Array.from({ length: 5 }, (_, index) => (
    <tr key={`report-skeleton-${index}`}>
      <td className="px-5 py-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-2 h-3 w-40" />
      </td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    </tr>
  ))
) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    No attendance records match these filters.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium">{record.student.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{record.student.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{record.course.code}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {record.schedule.dayOfWeek} · {record.schedule.startTime}–{record.schedule.endTime} · {record.schedule.classroom}
                      </p>
                    </td>
                    <td className="px-5 py-4">{formatDate(record.date)}</td>
                    <td className="px-5 py-4">{formatTime(record.recognizedAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        This page reports saved attendance records only. It does not infer or create absences for students who were not scanned.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Users;
  loading: boolean;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-2 text-3xl font-bold">{value}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

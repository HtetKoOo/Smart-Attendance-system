"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, Users, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface RosterEntry {
  enrollmentId: string;
  studentDbId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
}

export function LecturerRosterContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCourses() {
      setLoadingCourses(true);
      setCourseError(null);
      try {
        const res = await fetch("/api/lecturer/courses");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load courses");
        setCourses(data.courses || []);
      } catch (err) {
        setCourseError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, []);

  const loadRoster = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingRoster(true);
    setRosterError(null);
    try {
      const res = await fetch(`/api/lecturer/roster?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load roster");
      setRoster(data.roster || []);
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    setSearch("");
    setRoster([]);
    setRosterError(null);
    if (courseId) loadRoster(courseId);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const filteredRoster = roster.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId.toLowerCase().includes(search.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Course Students</h1>
        <p className="text-muted-foreground mt-2">
          View the student roster for your assigned courses.
        </p>
      </div>

      {/* Course selector */}
      <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold">Select a Course</h2>
        {loadingCourses ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your courses…
          </div>
        ) : courseError ? (
          <div className="flex items-center gap-2 text-sm text-destructive border border-destructive/50 rounded-lg p-3 bg-destructive/10">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {courseError}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no courses assigned. Ask an admin to assign you to a schedule.
          </p>
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full max-w-sm px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Roster */}
      {selectedCourseId && (
        <div className="border border-border bg-card rounded-xl shadow-sm">
          <div className="p-5 border-b border-border space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Enrolled Students
            </h2>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {loadingRoster ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
              </div>
            ) : rosterError ? (
              <div className="flex items-center gap-2 text-sm text-destructive p-5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {rosterError}
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {search
                  ? "No students match your search."
                  : "No students are enrolled in this course yet."}
              </div>
            ) : (
              filteredRoster.map((r, i) => (
                <div
                  key={r.enrollmentId}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.studentId} · {r.studentEmail}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Enrolled {formatDate(r.enrolledAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {!loadingRoster && filteredRoster.length > 0 && (
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
              {filteredRoster.length} student{filteredRoster.length !== 1 ? "s" : ""} shown
            </div>
          )}
        </div>
      )}
    </div>
  );
}

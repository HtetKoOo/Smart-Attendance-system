"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Search, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  user: { name: string; email: string };
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  student: {
    id: string;
    studentId: string;
    user: { name: string; email: string };
  };
  course: { id: string; code: string; name: string };
}

function StatusBanner({
  status,
  onDismiss,
}: {
  status: { type: "success" | "error" | "info"; message: string } | null;
  onDismiss: () => void;
}) {
  if (!status) return null;

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }[status.type];

  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }[status.type];

  return (
    <div className={`border rounded-lg p-3 flex items-start gap-2 text-sm ${styles}`}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span className="flex-1">{status.message}</span>
      <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EnrollmentManagementContent() {
  // --- Enrollment form state ---
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // --- Enrollment list state ---
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [listStudentFilter, setListStudentFilter] = useState("");
  const [listCourseFilter, setListCourseFilter] = useState("");

  // --- Confirm delete dialog state ---
  const [confirmDelete, setConfirmDelete] = useState<Enrollment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Load all students and courses for selector ---
  useEffect(() => {
    async function loadDropdowns() {
      setLoadingDropdowns(true);
      try {
        const [studRes, courseRes] = await Promise.all([
          fetch("/api/admin/students?pageSize=1000"),
          fetch("/api/admin/courses?pageSize=1000"),
        ]);
        const [studData, courseData] = await Promise.all([
          studRes.json(),
          courseRes.json(),
        ]);
        setStudents(studData.data || []);
        setCourses(courseData.data || []);
      } catch (err) {
        console.error("Failed to load students/courses", err);
      } finally {
        setLoadingDropdowns(false);
      }
    }
    loadDropdowns();
  }, []);

  // --- Load enrollments ---
  const loadEnrollments = useCallback(async (student = "", course = "") => {
    setLoadingEnrollments(true);
    try {
      const params = new URLSearchParams();
      if (student) params.set("student", student);
      if (course) params.set("course", course);
      const res = await fetch(`/api/admin/enrollments?${params}`);
      const data = await res.json();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error("Failed to load enrollments", err);
    } finally {
      setLoadingEnrollments(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoadingEnrollments(true);
      try {
        const params = new URLSearchParams();
        if (listStudentFilter) params.set("student", listStudentFilter);
        if (listCourseFilter) params.set("course", listCourseFilter);
        const res = await fetch(`/api/admin/enrollments?${params}`);
        const data = await res.json();
        if (!ignore) setEnrollments(data.enrollments || []);
      } catch (err) {
        console.error("Failed to load enrollments", err);
      } finally {
        if (!ignore) setLoadingEnrollments(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [listStudentFilter, listCourseFilter]);

  // --- Filtered selectors ---
  const filteredStudents = students.filter(
    (s) =>
      s.user.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  // --- Enroll ---
  async function handleEnroll() {
    if (!selectedStudentId || !selectedCourseId) return;
    setEnrolling(true);
    setFormStatus(null);
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, courseId: selectedCourseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormStatus({ type: "error", message: data.error || "Failed to enroll student." });
        return;
      }
      if (data.created) {
        const s = students.find((x) => x.id === selectedStudentId);
        const c = courses.find((x) => x.id === selectedCourseId);
        setFormStatus({
          type: "success",
          message: `${s?.user.name ?? "Student"} successfully enrolled in ${c?.code ?? "course"}.`,
        });
      } else {
        setFormStatus({ type: "info", message: "This student is already enrolled in that course." });
      }
      setSelectedStudentId("");
      setSelectedCourseId("");
      setStudentSearch("");
      setCourseSearch("");
      loadEnrollments(listStudentFilter, listCourseFilter);
    } catch {
      setFormStatus({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setEnrolling(false);
    }
  }

  // --- Delete ---
  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setFormStatus({ type: "error", message: data.error || "Failed to remove enrollment." });
      } else {
        setFormStatus({
          type: "success",
          message: `Removed ${confirmDelete.student.user.name} from ${confirmDelete.course.code}.`,
        });
        loadEnrollments(listStudentFilter, listCourseFilter);
      }
    } catch {
      setFormStatus({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Enrollments</h1>
        <p className="text-muted-foreground mt-2">
          Enroll students into courses and manage existing enrollments.
        </p>
      </div>

      <StatusBanner status={formStatus} onDismiss={() => setFormStatus(null)} />

      {/* Enroll form */}
      <div className="border border-border bg-card rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Enroll a Student
        </h2>

        {loadingDropdowns ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students and courses...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId("");
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                size={5}
              >
                <option value="" disabled>
                  — select a student —
                </option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} ({s.studentId})
                  </option>
                ))}
              </select>
              {selectedStudentId && (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ {students.find((s) => s.id === selectedStudentId)?.user.name} selected
                </p>
              )}
            </div>

            {/* Course selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by code or name…"
                  value={courseSearch}
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setSelectedCourseId("");
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                size={5}
              >
                <option value="" disabled>
                  — select a course —
                </option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              {selectedCourseId && (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ {courses.find((c) => c.id === selectedCourseId)?.code} selected
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleEnroll}
          disabled={!selectedStudentId || !selectedCourseId || enrolling || loadingDropdowns}
        >
          {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="mr-2 h-4 w-4" />
          Enroll Student
        </Button>
      </div>

      {/* Enrollment list */}
      <div className="border border-border bg-card rounded-xl shadow-sm">
        <div className="p-5 border-b border-border space-y-4">
          <h2 className="font-semibold text-lg">Existing Enrollments</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by student name or ID…"
                value={listStudentFilter}
                onChange={(e) => setListStudentFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by course code or name…"
                value={listCourseFilter}
                onChange={(e) => setListCourseFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {loadingEnrollments ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading enrollments…
            </div>
          ) : enrollments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No enrollments found. Try adjusting your filters or enroll a student above.
            </div>
          ) : (
            enrollments.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                  <div>
                    <span className="font-medium">{e.student.user.name}</span>
                    <span className="text-muted-foreground ml-2">({e.student.studentId})</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary mr-2">
                      {e.course.code}
                    </span>
                    {e.course.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enrolled {formatDate(e.enrolledAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setConfirmDelete(e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {!loadingEnrollments && enrollments.length > 0 && (
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Remove Enrollment</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {confirmDelete.student.user.name}
              </span>{" "}
              from{" "}
              <span className="font-medium text-foreground">
                {confirmDelete.course.code} — {confirmDelete.course.name}
              </span>
              ?
            </p>
            <p className="text-xs text-muted-foreground">
              Existing attendance records for this student in this course will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove Enrollment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

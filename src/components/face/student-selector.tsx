"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Search, User, XCircle } from "lucide-react";

export interface StudentItem {
  id: string;
  studentId: string;
  user: {
    name: string;
    email: string;
  };
}

interface StudentSelectorProps {
  selectedStudent: StudentItem | null;
  onSelectStudent: (student: StudentItem | null) => void;
  enrolledStudentIds: string[];
  disabled?: boolean;
}

export function StudentSelector({
  selectedStudent,
  onSelectStudent,
  enrolledStudentIds,
  disabled = false,
}: StudentSelectorProps) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function loadStudents() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", "1");

        const response = await fetch(`/api/admin/students?${params}`);
        const result = await response.json();

        if (ignore) return;
        if (response.ok && Array.isArray(result.data)) {
          setStudents(result.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load students:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      ignore = true;
    };
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Select Student for Face Enrollment
        </label>
        {selectedStudent && (
          <button
            type="button"
            onClick={() => onSelectStudent(null)}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Change Student
          </button>
        )}
      </div>

      {!selectedStudent ? (
        <div className="border border-border bg-card rounded-xl p-4 shadow-sm space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student name or student ID..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                startTransition(() => setSearch(val));
              }}
              disabled={disabled}
              className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            />
          </div>

          {/* Student Selection List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-border/40">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Loading students...
              </p>
            ) : students.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No students found matching &quot;{search}&quot;.
              </p>
            ) : (
              students.map((st) => {
                const isEnrolled = enrolledStudentIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStudent(st)}
                    disabled={disabled}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted/70 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {st.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition">
                          {st.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: <span className="font-mono">{st.studentId}</span> • {st.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          <XCircle className="size-3" />
                          Not Enrolled
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Selected Student Banner */
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">
                  {selectedStudent.user.name}
                </p>
                {enrolledStudentIds.includes(selectedStudent.id) ? (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Enrolled
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Not Enrolled
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Student ID: <span className="font-mono font-medium text-foreground">{selectedStudent.studentId}</span> • {selectedStudent.user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

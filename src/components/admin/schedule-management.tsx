"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
  location?: string;
}

interface Lecturer {
  id: string;
  lecturerId: string;
  user: {
    name: string;
  };
}

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  course: {
    code: string;
    name: string;
  };
  classroom: {
    name: string;
    location?: string;
  };
  lecturer: {
    lecturerId: string;
    user: {
      name: string;
    };
  };
  createdAt: string;
}

interface ScheduleFormData {
  courseId?: string;
  lecturerId?: string;
  classroomId?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  [key: string]: string | undefined;
}

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

function useSchedules(
  page: number,
  filterCourse: string,
  filterLecturer: string,
  filterDay: string,
) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      try {
        const [schedulesRes, coursesRes, classroomsRes, lecturersRes] =
          await Promise.all([
            fetch(
              `/api/admin/schedules?courseId=${filterCourse}&lecturerId=${filterLecturer}&dayOfWeek=${filterDay}&page=${page}`,
            ),
            fetch("/api/admin/courses?page=1"),
            fetch("/api/admin/classrooms?page=1"),
            fetch("/api/admin/lecturers?page=1"),
          ]);

        const schedulesData = await schedulesRes.json();
        const coursesData = await coursesRes.json();
        const classroomsData = await classroomsRes.json();
        const lecturersData = await lecturersRes.json();

        if (ignore) return;

        if (!schedulesRes.ok) {
          setError(schedulesData.error || "Failed to fetch schedules");
          return;
        }

        setSchedules(schedulesData.data);
        setTotalPages(schedulesData.pagination.totalPages);

        if (coursesRes.ok) setCourses(coursesData.data);
        if (classroomsRes.ok) setClassrooms(classroomsData.data);
        if (lecturersRes.ok) setLecturers(lecturersData.data);
        setError("");
      } catch (err) {
        if (ignore) return;
        setError("An error occurred while fetching data");
        console.error(err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [page, filterCourse, filterLecturer, filterDay, refreshKey]);

  return {
    schedules,
    courses,
    classrooms,
    lecturers,
    isLoading,
    totalPages,
    error,
    refetch,
    setError,
  };
}

export function ScheduleManagementContent() {
  const [filterCourse, setFilterCourse] = useState("");
  const [filterLecturer, setFilterLecturer] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);

  const {
    schedules,
    courses,
    classrooms,
    lecturers,
    isLoading,
    totalPages,
    error,
    refetch: fetchData,
    setError,
  } = useSchedules(page, filterCourse, filterLecturer, filterDay);

  const handleAdd = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = (schedule: Schedule) => {
    setDeleteSchedule(schedule);
  };

  const handleFormSubmit = async (data: ScheduleFormData) => {
    try {
      const url = editingSchedule
        ? `/api/admin/schedules/${editingSchedule.id}`
        : "/api/admin/schedules";

      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save schedule");
      }

      setShowForm(false);
      setEditingSchedule(null);
      setPage(1);
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteSchedule) return;

    try {
      const response = await fetch(
        `/api/admin/schedules/${deleteSchedule.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      setDeleteSchedule(null);
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Class Schedules</h1>
        <p className="text-muted-foreground mt-1">
          Manage class schedules and timetables
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={filterDay}
          onChange={(e) => {
            setFilterDay(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Days</option>
          {DAYS_OF_WEEK.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>

        <select
          value={filterCourse}
          onChange={(e) => {
            setFilterCourse(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>

        <select
          value={filterLecturer}
          onChange={(e) => {
            setFilterLecturer(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All Lecturers</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer.id} value={lecturer.id}>
              {lecturer.user.name}
            </option>
          ))}
        </select>

        <Button onClick={handleAdd} size="sm" className="ml-auto">
          <Plus className="mr-2 size-4" />
          Add Schedule
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<Schedule>
        columns={[
          {
            key: "course.code",
            label: "Course",
            render: (_, row) => `${row.course.code} - ${row.course.name}`,
          },
          {
            key: "lecturer.user.name",
            label: "Lecturer",
            render: (_, row) => row.lecturer.user.name,
          },
          {
            key: "classroom.name",
            label: "Classroom",
            render: (_, row) => row.classroom.name,
          },
          {
            key: "dayOfWeek",
            label: "Day",
          },
          {
            key: "startTime",
            label: "Time",
            render: (_, row) => `${row.startTime} - ${row.endTime}`,
          },
        ]}
        data={schedules}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey="id"
        emptyMessage="No schedules found"
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {showForm && (
        <FormDialog
          title={editingSchedule ? "Edit Schedule" : "Add Schedule"}
          fields={[
            {
              name: "courseId",
              label: "Course",
              type: "select",
              required: true,
              options: courses.map((c) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
              })),
            },
            {
              name: "lecturerId",
              label: "Lecturer",
              type: "select",
              required: true,
              options: lecturers.map((l) => ({
                value: l.id,
                label: l.user.name,
              })),
            },
            {
              name: "classroomId",
              label: "Classroom",
              type: "select",
              required: true,
              options: classrooms.map((c) => ({
                value: c.id,
                label: `${c.name}${c.location ? ` (${c.location})` : ""}`,
              })),
            },
            {
              name: "dayOfWeek",
              label: "Day of Week",
              type: "select",
              required: true,
              options: DAYS_OF_WEEK,
            },
            {
              name: "startTime",
              label: "Start Time (HH:MM)",
              placeholder: "09:00",
              required: true,
            },
            {
              name: "endTime",
              label: "End Time (HH:MM)",
              placeholder: "10:30",
              required: true,
            },
          ]}
          initialData={
            editingSchedule
              ? {
                  courseId: editingSchedule.course.code, // This will need adjustment
                  lecturerId: editingSchedule.lecturer.lecturerId,
                  classroomId: editingSchedule.classroom.name,
                  dayOfWeek: editingSchedule.dayOfWeek,
                  startTime: editingSchedule.startTime,
                  endTime: editingSchedule.endTime,
                }
              : undefined
          }
          error={error}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setError("");
          }}
        />
      )}

      {deleteSchedule && (
        <ConfirmDialog
          title="Delete Schedule"
          description={`Are you sure you want to delete this schedule? (${deleteSchedule.course.code} on ${deleteSchedule.dayOfWeek} at ${deleteSchedule.startTime})`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteSchedule(null)}
        />
      )}
    </div>
  );
}

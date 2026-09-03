"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface CourseFormData {
  code?: string;
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

function useCourses(page: number, search: string) {
  const [courses, setCourses] = useState<Course[]>([]);
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
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page.toString());

        const response = await fetch(`/api/admin/courses?${params}`);
        const result = await response.json();

        if (ignore) return;

        if (!response.ok) {
          setError(result.error || "Failed to fetch courses");
          return;
        }

        setCourses(result.data);
        setTotalPages(result.pagination.totalPages);
        setError("");
      } catch (err) {
        if (ignore) return;
        setError("An error occurred while fetching courses");
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
  }, [page, search, refreshKey]);

  return { courses, isLoading, totalPages, error, refetch, setError };
}

export function CourseManagementContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);

  const {
    courses,
    isLoading,
    totalPages,
    error,
    refetch: fetchCoursesData,
    setError,
  } = useCourses(page, search);

  const handleAdd = () => {
    setEditingCourse(null);
    setShowForm(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDelete = (course: Course) => {
    setDeleteCourse(course);
  };

  const handleFormSubmit = async (data: CourseFormData) => {
    try {
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.id}`
        : "/api/admin/courses";

      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save course");
      }

      setShowForm(false);
      setEditingCourse(null);
      setPage(1);
      fetchCoursesData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCourse) return;

    try {
      const response = await fetch(`/api/admin/courses/${deleteCourse.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      setDeleteCourse(null);
      fetchCoursesData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground mt-1">
          Manage courses and course information
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 size-4" />
          Add Course
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<Course>
        columns={[
          {
            key: "code",
            label: "Code",
          },
          {
            key: "name",
            label: "Name",
          },
          {
            key: "description",
            label: "Description",
            render: (val) => {
              const str = typeof val === "string" ? val : "";
              return (
                str.substring(0, 50) + (str.length > 50 ? "..." : "") || "-"
              );
            },
          },
          {
            key: "createdAt",
            label: "Created",
            render: (val) =>
              typeof val === "string"
                ? new Date(val).toLocaleDateString()
                : "-",
          },
        ]}
        data={courses}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey="id"
        emptyMessage="No courses found"
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
          title={editingCourse ? "Edit Course" : "Add Course"}
          fields={[
            { name: "code", label: "Course Code", required: true },
            { name: "name", label: "Course Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          initialData={
            editingCourse
              ? {
                  code: editingCourse.code,
                  name: editingCourse.name,
                  description: editingCourse.description || "",
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

      {deleteCourse && (
        <ConfirmDialog
          title="Delete Course"
          description={`Are you sure you want to delete ${deleteCourse.name} (${deleteCourse.code})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCourse(null)}
        />
      )}
    </div>
  );
}

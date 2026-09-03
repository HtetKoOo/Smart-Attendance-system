"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  user: {
    name: string;
    email: string;
    createdAt: string;
  };
}

interface StudentFormData {
  name?: string;
  email?: string;
  studentId?: string;
  [key: string]: string | undefined;
}

function useStudents(page: number, search: string) {
  const [students, setStudents] = useState<Student[]>([]);
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

        const response = await fetch(`/api/admin/students?${params}`);
        const result = await response.json();

        if (ignore) return;

        if (!response.ok) {
          setError(result.error || "Failed to fetch students");
          return;
        }

        setStudents(result.data);
        setTotalPages(result.pagination.totalPages);
        setError("");
      } catch (err) {
        if (ignore) return;
        setError("An error occurred while fetching students");
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

  return { students, isLoading, totalPages, error, refetch, setError };
}

export function StudentManagementContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);

  const {
    students,
    isLoading,
    totalPages,
    error,
    refetch: fetchStudentsData,
    setError,
  } = useStudents(page, search);

  const handleAdd = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDelete = (student: Student) => {
    setDeleteStudent(student);
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      const url = editingStudent
        ? `/api/admin/students/${editingStudent.id}`
        : "/api/admin/students";

      const method = editingStudent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save student");
      }

      setShowForm(false);
      setEditingStudent(null);
      setPage(1);
      fetchStudentsData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteStudent) return;

    try {
      const response = await fetch(`/api/admin/students/${deleteStudent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setDeleteStudent(null);
      fetchStudentsData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-1">
          Manage student records and enrollment
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
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
          Add Student
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<Student>
        columns={[
          {
            key: "studentId",
            label: "Student ID",
          },
          {
            key: "user.name",
            label: "Name",
            render: (_, row) => row.user.name,
          },
          {
            key: "user.email",
            label: "Email",
            render: (_, row) => row.user.email,
          },
          {
            key: "user.createdAt",
            label: "Joined",
            render: (_, row) =>
              new Date(row.user.createdAt).toLocaleDateString(),
          },
        ]}
        data={students}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey="id"
        emptyMessage="No students found"
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
          title={editingStudent ? "Edit Student" : "Add Student"}
          fields={[
            { name: "name", label: "Full Name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "studentId", label: "Student ID", required: true },
          ]}
          initialData={
            editingStudent
              ? {
                  name: editingStudent.user.name,
                  email: editingStudent.user.email,
                  studentId: editingStudent.studentId,
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

      {deleteStudent && (
        <ConfirmDialog
          title="Delete Student"
          description={`Are you sure you want to delete ${deleteStudent.user.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteStudent(null)}
        />
      )}
    </div>
  );
}

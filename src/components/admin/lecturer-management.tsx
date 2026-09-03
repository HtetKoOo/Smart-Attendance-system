"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Lecturer {
  id: string;
  lecturerId: string;
  user: {
    name: string;
    email: string;
    createdAt: string;
  };
}

interface LecturerFormData {
  name?: string;
  email?: string;
  lecturerId?: string;
  [key: string]: string | undefined;
}

interface UnlinkedUser {
  id: string;
  name: string;
  email: string;
}

function useLecturers(page: number, search: string) {
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
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page.toString());

        const response = await fetch(`/api/admin/lecturers?${params}`);
        const result = await response.json();

        if (ignore) return;

        if (!response.ok) {
          setError(result.error || "Failed to fetch lecturers");
          return;
        }

        setLecturers(result.data);
        setTotalPages(result.pagination.totalPages);
        setError("");
      } catch (err) {
        if (ignore) return;
        setError("An error occurred while fetching lecturers");
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

  return { lecturers, isLoading, totalPages, error, refetch, setError };
}

export function LecturerManagementContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [deleteLecturer, setDeleteLecturer] = useState<Lecturer | null>(null);
  const [unlinkedUsers, setUnlinkedUsers] = useState<UnlinkedUser[]>([]);

  const {
    lecturers,
    isLoading,
    totalPages,
    error,
    refetch: fetchLecturersData,
    setError,
  } = useLecturers(page, search);

  const handleAdd = async () => {
    setEditingLecturer(null);
    setError("");
    setShowForm(true);

    try {
      const response = await fetch("/api/admin/unlinked-users");
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch registered accounts");
      }
      setUnlinkedUsers(result.data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (lecturer: Lecturer) => {
    setEditingLecturer(lecturer);
    setShowForm(true);
  };

  const handleDelete = (lecturer: Lecturer) => {
    setDeleteLecturer(lecturer);
  };

  const handleFormSubmit = async (data: LecturerFormData) => {
    try {
      const url = editingLecturer
        ? `/api/admin/lecturers/${editingLecturer.id}`
        : "/api/admin/lecturers";

      const method = editingLecturer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save lecturer");
      }

      setShowForm(false);
      setEditingLecturer(null);
      setPage(1);
      fetchLecturersData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteLecturer) return;

    try {
      const response = await fetch(
        `/api/admin/lecturers/${deleteLecturer.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete lecturer");
      }

      setDeleteLecturer(null);
      fetchLecturersData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lecturers</h1>
        <p className="text-muted-foreground mt-1">
          Manage lecturer records and assignments
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
          Link Registered Lecturer
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<Lecturer>
        columns={[
          {
            key: "lecturerId",
            label: "Lecturer ID",
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
        data={lecturers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey="id"
        emptyMessage="No lecturers found"
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
          title={editingLecturer ? "Edit Lecturer" : "Link Registered Lecturer"}
          fields={
            editingLecturer
              ? [
                  { name: "name", label: "Full Name", required: true },
                  { name: "email", label: "Email", type: "email", required: true },
                  { name: "lecturerId", label: "Lecturer ID", required: true },
                ]
              : [
                  {
                    name: "userId",
                    label: "Registered Account",
                    type: "select",
                    required: true,
                    options: unlinkedUsers.map((user) => ({
                      value: user.id,
                      label: `${user.name} (${user.email})`,
                    })),
                  },
                  { name: "lecturerId", label: "Lecturer ID", required: true },
                ]
          }
          initialData={
            editingLecturer
              ? {
                  name: editingLecturer.user.name,
                  email: editingLecturer.user.email,
                  lecturerId: editingLecturer.lecturerId,
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

      {deleteLecturer && (
        <ConfirmDialog
          title="Delete Lecturer"
          description={`Are you sure you want to delete ${deleteLecturer.user.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteLecturer(null)}
        />
      )}
    </div>
  );
}

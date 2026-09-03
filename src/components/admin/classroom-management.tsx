"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

interface ClassroomFormData {
  name?: string;
  location?: string;
  [key: string]: string | undefined;
}

function useClassrooms(page: number, search: string) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
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

        const response = await fetch(`/api/admin/classrooms?${params}`);
        const result = await response.json();

        if (ignore) return;

        if (!response.ok) {
          setError(result.error || "Failed to fetch classrooms");
          return;
        }

        setClassrooms(result.data);
        setTotalPages(result.pagination.totalPages);
        setError("");
      } catch (err) {
        if (ignore) return;
        setError("An error occurred while fetching classrooms");
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

  return { classrooms, isLoading, totalPages, error, refetch, setError };
}

export function ClassroomManagementContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(
    null,
  );
  const [deleteClassroom, setDeleteClassroom] = useState<Classroom | null>(
    null,
  );

  const {
    classrooms,
    isLoading,
    totalPages,
    error,
    refetch: fetchClassrooms,
    setError,
  } = useClassrooms(page, search);

  const handleAdd = () => {
    setEditingClassroom(null);
    setShowForm(true);
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setShowForm(true);
  };

  const handleDelete = (classroom: Classroom) => {
    setDeleteClassroom(classroom);
  };

  const handleFormSubmit = async (data: ClassroomFormData) => {
    try {
      const url = editingClassroom
        ? `/api/admin/classrooms/${editingClassroom.id}`
        : "/api/admin/classrooms";

      const method = editingClassroom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save classroom");
      }

      setShowForm(false);
      setEditingClassroom(null);
      setPage(1);
      await fetchClassrooms();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteClassroom) return;

    try {
      const response = await fetch(
        `/api/admin/classrooms/${deleteClassroom.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete classroom");
      }

      setDeleteClassroom(null);
      await fetchClassrooms();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Classrooms</h1>
        <p className="text-muted-foreground mt-1">
          Manage classroom rooms and locations
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or location..."
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
          Add Classroom
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<Classroom>
        columns={[
          {
            key: "name",
            label: "Classroom Name",
          },
          {
            key: "location",
            label: "Location",
            render: (val) => (typeof val === "string" && val ? val : "-"),
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
        data={classrooms}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey="id"
        emptyMessage="No classrooms found"
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
          title={editingClassroom ? "Edit Classroom" : "Add Classroom"}
          fields={[
            { name: "name", label: "Classroom Name", required: true },
            { name: "location", label: "Location" },
          ]}
          initialData={
            editingClassroom
              ? {
                  name: editingClassroom.name,
                  location: editingClassroom.location || "",
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

      {deleteClassroom && (
        <ConfirmDialog
          title="Delete Classroom"
          description={`Are you sure you want to delete ${deleteClassroom.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteClassroom(null)}
        />
      )}
    </div>
  );
}

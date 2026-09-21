"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface AccountSettingsContentProps {
  initialName: string;
  email: string;
  role: Role;
  profileIdentifier: string | null;
}

const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  LECTURER: "Lecturer",
  STUDENT: "Student",
};

export function AccountSettingsContent({
  initialName,
  email,
  role,
  profileIdentifier,
}: AccountSettingsContentProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save changes.");

      setName(data.user.name);
      setSavedName(data.user.name);
      setSuccess(true);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = name.trim() !== savedName;
  const identifierLabel = role === "STUDENT" ? "Student ID" : "Lecturer ID";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Review your account access and update your display name.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <form onSubmit={saveProfile} className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <UserRound className="size-5 text-primary" /> Personal information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This name appears in the dashboard and attendance records.
            </p>
          </div>
          <div className="space-y-5 p-5">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="size-4" /> Changes saved successfully.
              </div>
            )}
            <label className="block space-y-2 text-sm font-medium">
              Display name
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSuccess(false);
                }}
                minLength={2}
                maxLength={80}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Email address
              <input
                value={email}
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground disabled:cursor-not-allowed"
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Email changes are disabled to protect account access.
              </span>
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !hasChanges || name.trim().length < 2}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5 text-primary" /> Access & profile
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Account role</dt>
                <dd className="mt-1 font-medium">{roleLabels[role]}</dd>
              </div>
              {role !== "ADMIN" && (
                <div>
                  <dt className="text-muted-foreground">{identifierLabel}</dt>
                  <dd className="mt-1 font-medium">
                    {profileIdentifier ?? "Profile not linked"}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Profile status</dt>
                <dd className="mt-1 font-medium">
                  {role === "ADMIN" || profileIdentifier ? "Active" : "Action required"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <LockKeyhole className="size-5 text-primary" /> Privacy & device
            </h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Camera className="mt-0.5 size-4 shrink-0 text-primary" />
                Camera access is controlled by your browser and is only requested on face-enabled screens.
              </p>
              <p>
                Live camera frames stay in browser memory. This settings page does not access biometric templates.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

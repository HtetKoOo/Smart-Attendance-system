import { KeyRound, ShieldCheck } from "lucide-react";

const accounts = [
  { role: "Admin", email: "demo.admin@kbu-attendance.example" },
  { role: "Lecturer", email: "demo.lecturer@kbu-attendance.example" },
  { role: "Student", email: "demo.student@kbu-attendance.example" },
];

export function DemoCredentials() {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <KeyRound className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Portfolio demo access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use any account below to explore the role-based workflows.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {accounts.map((account) => (
          <div
            key={account.role}
            className="flex flex-col gap-1 rounded-lg border border-border/70 bg-background/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium">{account.role}</span>
            <code className="break-all text-xs text-muted-foreground">{account.email}</code>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0 text-primary" />
        <span>Password for all demo accounts: <code className="font-semibold text-foreground">KbuDemo2026!</code></span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Demo records are fictional. No face templates or camera data are included.
      </p>
    </section>
  );
}

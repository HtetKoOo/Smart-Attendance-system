import { getUserRole } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const role = await getUserRole();

  // Redirect based on role
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (role === "LECTURER") {
    redirect("/dashboard/lecturer");
  } else if (role === "STUDENT") {
    redirect("/dashboard/student");
  }

  // Fallback to student dashboard
  redirect("/dashboard/student");
}

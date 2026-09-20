import type { Metadata } from "next";
import { AccountSettingsPage } from "@/components/settings/account-settings-page";

export const metadata: Metadata = {
  title: "Settings | KBU Smart Attendance System",
  description: "Manage your administrator account settings.",
};

export default function AdminSettingsPage() {
  return <AccountSettingsPage role="ADMIN" />;
}

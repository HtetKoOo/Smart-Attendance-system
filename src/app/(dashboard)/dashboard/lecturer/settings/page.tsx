import type { Metadata } from "next";
import { AccountSettingsPage } from "@/components/settings/account-settings-page";

export const metadata: Metadata = {
  title: "Settings | KBU Smart Attendance System",
  description: "Manage your lecturer account settings.",
};

export default function LecturerSettingsPage() {
  return <AccountSettingsPage role="LECTURER" />;
}

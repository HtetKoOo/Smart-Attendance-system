export interface DashboardHeaderLabel {
  section?: string;
  title: string;
}

const DASHBOARD_HEADER_LABELS: Record<string, DashboardHeaderLabel> = {
  "/dashboard": { title: "Dashboard" },
  "/dashboard/admin": { title: "Dashboard" },
  "/dashboard/admin/students": { section: "Academic Management", title: "Students" },
  "/dashboard/admin/lecturers": { section: "Academic Management", title: "Lecturers" },
  "/dashboard/admin/courses": { section: "Academic Management", title: "Courses" },
  "/dashboard/admin/classrooms": { section: "Academic Management", title: "Classrooms" },
  "/dashboard/admin/schedules": { section: "Academic Management", title: "Schedules" },
  "/dashboard/admin/enrollments": {
    section: "Academic Management",
    title: "Course Enrollments",
  },
  "/dashboard/admin/face-enrollment": { section: "Attendance", title: "Face Enrollment" },
  "/dashboard/admin/face-recognition-test": {
    section: "Advanced Tools",
    title: "Face Recognition Test",
  },
  "/dashboard/admin/face-calibration": {
    section: "Advanced Tools",
    title: "Recognition Calibration",
  },
  "/dashboard/admin/attendance": { section: "Attendance", title: "Attendance History" },
  "/dashboard/admin/settings": { title: "Settings" },
  "/dashboard/attendance/record": { section: "Attendance", title: "Record Attendance" },
  "/dashboard/lecturer": { title: "Dashboard" },
  "/dashboard/lecturer/enrollments": { section: "Lecturer", title: "My Course Students" },
  "/dashboard/lecturer/courses": { section: "Lecturer", title: "My Courses" },
  "/dashboard/lecturer/schedule": { section: "Lecturer", title: "My Schedule" },
  "/dashboard/lecturer/attendance": { section: "Lecturer", title: "My Attendance History" },
  "/dashboard/lecturer/settings": { title: "Settings" },
  "/dashboard/student": { title: "Dashboard" },
  "/dashboard/student/courses": { section: "Student", title: "My Courses" },
  "/dashboard/student/schedule": { section: "Student", title: "My Schedule" },
  "/dashboard/student/attendance": { section: "Student", title: "My Attendance" },
  "/dashboard/student/settings": { title: "Settings" },
};

export function getDashboardHeaderLabel(pathname: string): DashboardHeaderLabel {
  return DASHBOARD_HEADER_LABELS[pathname] ?? { title: "Dashboard" };
}

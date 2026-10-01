import { AttendanceStatus, DayOfWeek, PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "KbuDemo2026!";
const credentialIssuer = "local:credential";

type DemoAccount = {
  email: string;
  name: string;
  role: Role;
  profile?: { type: "student"; id: string } | { type: "lecturer"; id: string };
};

const demoAccounts: DemoAccount[] = [
  {
    email: "demo.admin@kbu-attendance.example",
    name: "Demo Administrator",
    role: Role.ADMIN,
  },
  {
    email: "demo.lecturer@kbu-attendance.example",
    name: "Demo Lecturer",
    role: Role.LECTURER,
    profile: { type: "lecturer", id: "DEMO-L001" },
  },
  {
    email: "demo.student@kbu-attendance.example",
    name: "Demo Student",
    role: Role.STUDENT,
    profile: { type: "student", id: "DEMO-S001" },
  },
];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayOfWeek(date: Date): DayOfWeek {
  return [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ][date.getDay()];
}

async function ensureDemoAccount(account: DemoAccount) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: account.email },
    create: {
      email: account.email,
      name: account.name,
      role: account.role,
      emailVerified: true,
    },
    update: {
      name: account.name,
      role: account.role,
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: {
      issuer_accountId: {
        issuer: credentialIssuer,
        accountId: user.id,
      },
    },
    create: {
      userId: user.id,
      providerId: "credential",
      issuer: credentialIssuer,
      accountId: user.id,
      password: passwordHash,
    },
    update: { password: passwordHash },
  });

  if (account.profile?.type === "lecturer") {
    await prisma.lecturer.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lecturerId: account.profile.id },
      update: { lecturerId: account.profile.id },
    });
  }

  if (account.profile?.type === "student") {
    await prisma.student.upsert({
      where: { userId: user.id },
      create: { userId: user.id, studentId: account.profile.id },
      update: { studentId: account.profile.id },
    });
  }

  return user;
}

async function ensureStudentProfile({
  email,
  name,
  studentId,
}: {
  email: string;
  name: string;
  studentId: string;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, role: Role.STUDENT, emailVerified: true },
    update: { name, role: Role.STUDENT, emailVerified: true },
  });

  return prisma.student.upsert({
    where: { userId: user.id },
    create: { userId: user.id, studentId },
    update: { studentId },
  });
}

async function ensureSchedule({
  courseId,
  classroomId,
  lecturerId,
  weekday,
  startTime,
  endTime,
}: {
  courseId: string;
  classroomId: string;
  lecturerId: string;
  weekday: DayOfWeek;
  startTime: string;
  endTime: string;
}) {
  const existing = await prisma.classSchedule.findFirst({
    where: { courseId, classroomId, lecturerId, dayOfWeek: weekday, startTime, endTime },
  });

  if (existing) return existing;

  return prisma.classSchedule.create({
    data: { courseId, classroomId, lecturerId, dayOfWeek: weekday, startTime, endTime },
  });
}

async function main() {
  const [admin, lecturerUser, demoStudentUser] = await Promise.all(
    demoAccounts.map(ensureDemoAccount),
  );
  const lecturer = await prisma.lecturer.findUniqueOrThrow({
    where: { userId: lecturerUser.id },
  });
  const demoStudent = await prisma.student.findUniqueOrThrow({
    where: { userId: demoStudentUser.id },
  });

  const [secondStudent, thirdStudent] = await Promise.all([
    ensureStudentProfile({
      email: "portfolio.student2@kbu-attendance.example",
      name: "Portfolio Student Two",
      studentId: "DEMO-S002",
    }),
    ensureStudentProfile({
      email: "portfolio.student3@kbu-attendance.example",
      name: "Portfolio Student Three",
      studentId: "DEMO-S003",
    }),
  ]);

  const [digitalCourse, systemsCourse, classroom] = await Promise.all([
    prisma.course.upsert({
      where: { code: "KBU101" },
      create: {
        code: "KBU101",
        name: "Digital Technology Foundations",
        description: "Sample course for the public portfolio demonstration.",
      },
      update: {
        name: "Digital Technology Foundations",
        description: "Sample course for the public portfolio demonstration.",
      },
    }),
    prisma.course.upsert({
      where: { code: "KBU205" },
      create: {
        code: "KBU205",
        name: "Information Systems Practice",
        description: "Sample course for the public portfolio demonstration.",
      },
      update: {
        name: "Information Systems Practice",
        description: "Sample course for the public portfolio demonstration.",
      },
    }),
    prisma.classroom.upsert({
      where: { name: "Portfolio Demo Room" },
      create: { name: "Portfolio Demo Room", location: "Building A · Floor 2" },
      update: { location: "Building A · Floor 2" },
    }),
  ]);

  const today = startOfToday();
  const weekday = dayOfWeek(today);
  const secondSessionDay = dayOfWeek(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  const [digitalSchedule] = await Promise.all([
    ensureSchedule({
      courseId: digitalCourse.id,
      classroomId: classroom.id,
      lecturerId: lecturer.id,
      weekday,
      startTime: "09:00",
      endTime: "11:00",
    }),
    ensureSchedule({
      courseId: systemsCourse.id,
      classroomId: classroom.id,
      lecturerId: lecturer.id,
      weekday: secondSessionDay,
      startTime: "13:00",
      endTime: "15:00",
    }),
  ]);

  const students = [demoStudent, secondStudent, thirdStudent];
  await Promise.all(
    students.flatMap((student) => [
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: digitalCourse.id } },
        create: { studentId: student.id, courseId: digitalCourse.id },
        update: {},
      }),
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: systemsCourse.id } },
        create: { studentId: student.id, courseId: systemsCourse.id },
        update: {},
      }),
    ]),
  );

  const priorWeek = new Date(today);
  priorWeek.setDate(priorWeek.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  await Promise.all([
    prisma.attendance.upsert({
      where: { studentId_classScheduleId_date: { studentId: demoStudent.id, classScheduleId: digitalSchedule.id, date: today } },
      create: { studentId: demoStudent.id, courseId: digitalCourse.id, classScheduleId: digitalSchedule.id, date: today, status: AttendanceStatus.PRESENT, recognizedAt: new Date() },
      update: { status: AttendanceStatus.PRESENT },
    }),
    prisma.attendance.upsert({
      where: { studentId_classScheduleId_date: { studentId: secondStudent.id, classScheduleId: digitalSchedule.id, date: priorWeek } },
      create: { studentId: secondStudent.id, courseId: digitalCourse.id, classScheduleId: digitalSchedule.id, date: priorWeek, status: AttendanceStatus.LATE, recognizedAt: new Date(priorWeek.getTime() + 9 * 60 * 60 * 1000 + 20 * 60 * 1000) },
      update: { status: AttendanceStatus.LATE },
    }),
    prisma.attendance.upsert({
      where: { studentId_classScheduleId_date: { studentId: thirdStudent.id, classScheduleId: digitalSchedule.id, date: twoWeeksAgo } },
      create: { studentId: thirdStudent.id, courseId: digitalCourse.id, classScheduleId: digitalSchedule.id, date: twoWeeksAgo, status: AttendanceStatus.PRESENT, recognizedAt: new Date(twoWeeksAgo.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000) },
      update: { status: AttendanceStatus.PRESENT },
    }),
  ]);

  console.log("Demo data is ready.");
  console.log(`Admin:    demo.admin@kbu-attendance.example / ${DEMO_PASSWORD}`);
  console.log(`Lecturer: demo.lecturer@kbu-attendance.example / ${DEMO_PASSWORD}`);
  console.log(`Student:  demo.student@kbu-attendance.example / ${DEMO_PASSWORD}`);
  console.log(`Created by: ${admin.name} (demo-only data, no face templates included).`);
  console.log("Run this command again at any time to restore missing demo records.");
}

main()
  .catch((error) => {
    console.error("Failed to seed demo data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

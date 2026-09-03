"use client";

import { useCallback, useEffect, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useFaceEnrollment } from "@/hooks/use-face-enrollment";
import { StudentSelector, type StudentItem } from "@/components/face/student-selector";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Trash2,
  UserCheck,
} from "lucide-react";

function useEnrolledStudents() {
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/face-enrollment");
        const data = await res.json();
        if (ignore) return;
        if (res.ok && Array.isArray(data.enrolledStudentIds)) {
          setEnrolledStudentIds(data.enrolledStudentIds);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load enrolled student IDs:", err);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return { enrolledStudentIds, refetchEnrolled: refetch };
}

export function FaceEnrollmentContent() {
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { enrolledStudentIds, refetchEnrolled } = useEnrolledStudents();

  const {
    videoRef,
    isActive: isCameraActive,
    isLoading: isCameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
  } = useCamera();

  const {
    canvasRef,
    isModelLoading,
    isModelReady,
    modelError,
    faceState,
    isCapturing,
    captureStep,
    totalSteps,
    enrollmentError,
    enrollmentSuccess,
    captureEnrollment,
    resetEnrollmentState,
  } = useFaceEnrollment(videoRef, isCameraActive);

  const handleStudentSelect = (student: StudentItem | null) => {
    setSelectedStudent(student);
    resetEnrollmentState();
    setDeleteError(null);
  };

  const handleCapture = async () => {
    if (!selectedStudent) return;
    const success = await captureEnrollment(selectedStudent.id);
    if (success) {
      refetchEnrolled();
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!selectedStudent) return;
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/admin/face-enrollment?studentId=${selectedStudent.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete enrollment data.");
      }
      setShowDeleteConfirm(false);
      resetEnrollmentState();
      refetchEnrolled();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete enrollment.",
      );
    }
  };

  const isSelectedEnrolled =
    selectedStudent && enrolledStudentIds.includes(selectedStudent.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
          <UserCheck className="size-4" />
          <span>Biometric Enrollment</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Student Face Enrollment
        </h1>
        <p className="text-muted-foreground mt-1">
          Capture high-quality biometric face templates for students. Templates are processed locally and stored without saving raw images.
        </p>
      </div>

      {/* Privacy Notice Card */}
      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            Privacy-by-Design Biometric Architecture
          </p>
          <p className="text-muted-foreground dark:text-emerald-400/80 leading-relaxed">
            Camera frames are processed entirely in browser memory to generate a 128-dimensional mathematical template. Raw photos, camera frames, and video streams are <strong>never</strong> uploaded, transmitted, or saved in the database.
          </p>
        </div>
      </div>

      {/* Student Selection Section */}
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={handleStudentSelect}
        enrolledStudentIds={enrolledStudentIds}
        disabled={isCapturing}
      />

      {/* Camera & Enrollment Viewport Card */}
      <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            <span className="font-semibold text-sm">Face Alignment Viewport</span>
          </div>

          <div className="flex items-center gap-2.5">
            {isModelLoading ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Loading Biometric Engine...
              </span>
            ) : isModelReady ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Engine Ready
              </span>
            ) : (
              <span className="text-xs text-destructive font-medium">
                {modelError || "Engine Error"}
              </span>
            )}
          </div>
        </div>

        {/* Video & Canvas Overlay */}
        <div className="relative aspect-video w-full max-w-3xl mx-auto bg-neutral-950 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isCameraActive ? "opacity-100" : "opacity-0 absolute"
            }`}
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none ${
              isCameraActive ? "block" : "hidden"
            }`}
          />

          {/* Camera Status Overlays */}
          {!isCameraActive && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              {isCameraLoading ? (
                <div className="flex flex-col items-center gap-3 text-neutral-300">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="font-medium text-sm">Accessing camera...</p>
                </div>
              ) : cameraError ? (
                <div className="flex flex-col items-center gap-3 text-destructive">
                  <AlertCircle className="size-8" />
                  <p className="font-semibold text-sm text-foreground">Camera Access Issue</p>
                  <p className="text-xs text-muted-foreground">{cameraError}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-neutral-400">
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400">
                    <Camera className="size-8" />
                  </div>
                  <p className="font-medium text-sm text-neutral-200">
                    Camera is not started
                  </p>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Start the camera, position the student within the oval guide, and click Capture Enrollment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Capture Progress Overlay */}
          {isCapturing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <Loader2 className="size-10 animate-spin text-primary mb-3" />
              <p className="font-bold text-base">Capturing Biometric Samples...</p>
              <p className="text-xs text-neutral-300 mt-1">
                Sample {captureStep} of {totalSteps} — Please hold still.
              </p>
              <div className="w-48 bg-neutral-800 rounded-full h-2 mt-4 overflow-hidden border border-neutral-700">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(captureStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Feedback Guidance Bar */}
        {isCameraActive && (
          <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  faceState.isReadyForCapture
                    ? "bg-emerald-500 animate-pulse"
                    : faceState.faceCount === 0
                      ? "bg-muted-foreground"
                      : "bg-amber-500"
                }`}
              />
              <span className="font-medium text-foreground">
                {faceState.statusMessage}
              </span>
            </div>

            {faceState.faceCount === 1 && faceState.confidence > 0 && (
              <span className="text-muted-foreground">
                Confidence: <strong className="text-foreground">{faceState.confidence}%</strong>
              </span>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                disabled={isCameraLoading}
              >
                <Play className="mr-2 size-4 fill-current" />
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                disabled={isCapturing}
              >
                <Square className="mr-2 size-4 fill-current" />
                Stop Camera
              </Button>
            )}

            {isSelectedEnrolled && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isCapturing}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Enrollment
              </Button>
            )}
          </div>

          <Button
            onClick={handleCapture}
            disabled={
              !selectedStudent ||
              !isCameraActive ||
              !faceState.isReadyForCapture ||
              isCapturing
            }
            className="w-full sm:w-auto"
          >
            {isCapturing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enrolling Face...
              </>
            ) : isSelectedEnrolled ? (
              <>
                <RotateCcw className="mr-2 size-4" />
                Re-Enroll Face Template
              </>
            ) : (
              <>
                <UserCheck className="mr-2 size-4" />
                Capture Enrollment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages / Alerts */}
      {enrollmentError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex gap-3 items-start">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Enrollment Failed</p>
            <p className="text-xs mt-0.5">{enrollmentError}</p>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex gap-3 items-start">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Deletion Failed</p>
            <p className="text-xs mt-0.5">{deleteError}</p>
          </div>
        </div>
      )}

      {enrollmentSuccess && selectedStudent && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300 flex gap-3 items-start">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Enrollment Completed Successfully</p>
            <p className="text-xs mt-0.5">
              128-dimensional biometric face template for <strong>{selectedStudent.user.name}</strong> ({selectedStudent.studentId}) is securely stored.
            </p>
          </div>
        </div>
      )}

      {/* Delete Enrollment Confirmation Dialog */}
      {showDeleteConfirm && selectedStudent && (
        <ConfirmDialog
          title="Delete Face Enrollment"
          description={`Are you sure you want to delete the biometric face template for ${selectedStudent.user.name} (${selectedStudent.studentId})? This student will no longer be recognizable during attendance.`}
          confirmText="Delete Enrollment"
          cancelText="Cancel"
          isDestructive
          onConfirm={handleDeleteEnrollment}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

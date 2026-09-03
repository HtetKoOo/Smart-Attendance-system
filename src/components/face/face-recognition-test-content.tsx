"use client";

import { useCamera } from "@/hooks/use-camera";
import {
  useFaceRecognition,
  RECOGNITION_THRESHOLD,
  type RecognitionResult,
} from "@/hooks/use-face-recognition";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  Play,
  ShieldCheck,
  Square,
  UserX,
  Users,
} from "lucide-react";

function RecognitionResultCard({ result }: { result: RecognitionResult }) {
  const { state, studentId, studentName, distance, confidenceLabel } = result;

  if (state === "idle") {
    return (
      <div className="border border-border bg-card rounded-xl p-5 shadow-sm text-center text-muted-foreground text-sm">
        <Camera className="size-8 mx-auto mb-2 opacity-40" />
        <p>Start the camera to begin face recognition.</p>
      </div>
    );
  }

  if (state === "no_templates") {
    return (
      <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">No Enrolled Students</p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              No face templates found. Please enroll students from the{" "}
              <a href="/dashboard/admin/face-enrollment" className="underline font-medium text-amber-600 dark:text-amber-400">
                Face Enrollment
              </a>{" "}
              page first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "no_face") {
    return (
      <div className="border border-border bg-card rounded-xl p-5 shadow-sm flex items-center gap-3 text-muted-foreground">
        <Eye className="size-5 shrink-0 opacity-50" />
        <p className="text-sm">No face detected. Look directly at the camera.</p>
      </div>
    );
  }

  if (state === "multiple_faces") {
    return (
      <div className="border border-destructive/40 bg-destructive/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3 text-destructive">
          <Users className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Multiple Faces Detected</p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              Recognition is paused. Only one person must be in view.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "recognizing" || (state === "no_match" && !distance)) {
    return (
      <div className="border border-border bg-card rounded-xl p-5 shadow-sm flex items-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
        <p className="text-sm">Analyzing face...</p>
      </div>
    );
  }

  if (state === "no_match") {
    return (
      <div className="border border-border bg-card rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-full">
            <UserX className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">No Match Found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No enrolled student matched this face.
            </p>
            {distance !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                Closest distance:{" "}
                <span className="font-mono font-medium text-foreground">
                  {distance.toFixed(4)}
                </span>{" "}
                <span className="opacity-60">(threshold: {RECOGNITION_THRESHOLD})</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "recognized" && studentName && studentId && distance !== undefined) {
    return (
      <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Recognized
              </span>
            </div>
            <p className="text-lg font-bold text-foreground mt-0.5 truncate">
              {studentName}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              ID: {studentId}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
              <span>
                Distance:{" "}
                <span className="font-mono font-medium text-foreground">
                  {distance.toFixed(4)}
                </span>
              </span>
              <span>
                Confidence:{" "}
                <span
                  className={`font-semibold ${
                    confidenceLabel === "Very High" || confidenceLabel === "High"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {confidenceLabel}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function FaceRecognitionTestContent() {
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
    templatesLoading,
    templateCount,
    result,
  } = useFaceRecognition(videoRef, isCameraActive);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
          <Eye className="size-4" />
          <span>Phase 6C — Recognition Test Only</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Face Recognition Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Live test of the face matching system against enrolled student templates.{" "}
          <strong>This screen does not record attendance.</strong>
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            Privacy & Biometric Data Boundary
          </p>
          <p className="text-muted-foreground dark:text-emerald-400/80 leading-relaxed">
            Enrolled numeric templates are temporarily loaded into your authorized ADMIN browser for local Euclidean matching only. Live camera frames and descriptors remain in browser memory and are never uploaded or saved. No attendance data is recorded.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Camera Status */}
        <div className="border border-border bg-card rounded-xl p-3 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Camera</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`size-2 rounded-full ${isCameraActive ? "bg-emerald-500 animate-pulse" : isCameraLoading ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className="text-sm font-semibold">
              {isCameraLoading ? "Starting..." : isCameraActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Model Status */}
        <div className="border border-border bg-card rounded-xl p-3 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Recognition Engine</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`size-2 rounded-full ${isModelReady ? "bg-emerald-500" : isModelLoading ? "bg-amber-500 animate-pulse" : "bg-destructive"}`} />
            <span className="text-sm font-semibold">
              {isModelLoading ? "Loading..." : isModelReady ? "Ready" : "Error"}
            </span>
          </div>
        </div>

        {/* Templates */}
        <div className="border border-border bg-card rounded-xl p-3 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Enrolled Templates</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-sm font-bold ${templateCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {templatesLoading ? "..." : templateCount}
            </span>
            <span className="text-xs text-muted-foreground">students</span>
          </div>
        </div>

        {/* Threshold */}
        <div className="border border-border bg-card rounded-xl p-3 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Match Threshold</p>
          <p className="text-sm font-mono font-bold mt-1">{RECOGNITION_THRESHOLD}</p>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            <span className="font-semibold text-sm">Live Recognition Viewport</span>
          </div>
          {isCameraActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE
            </div>
          )}
        </div>

        {/* Video */}
        <div className="relative aspect-video w-full max-w-3xl mx-auto bg-neutral-950 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? "opacity-100" : "opacity-0 absolute"}`}
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive ? "block" : "hidden"}`}
          />

          {!isCameraActive && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              {isCameraLoading ? (
                <div className="flex flex-col items-center gap-3 text-neutral-300">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Accessing camera...</p>
                </div>
              ) : cameraError ? (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="size-8 text-destructive" />
                  <p className="font-semibold text-sm text-foreground">Camera Access Issue</p>
                  <p className="text-xs text-muted-foreground">{cameraError}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-neutral-400">
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-full">
                    <Camera className="size-8" />
                  </div>
                  <p className="font-medium text-sm text-neutral-200">Camera is not started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live status bar */}
        {isCameraActive && (
          <div className="px-5 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                result.state === "recognized" ? "bg-emerald-500 animate-pulse" :
                result.state === "multiple_faces" ? "bg-destructive" :
                result.state === "no_match" ? "bg-amber-500" :
                "bg-muted-foreground/40"
              }`}
            />
            <span className="font-medium text-foreground">{result.statusMessage}</span>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isCameraActive
              ? "Live camera frames and descriptors stay local. Enrolled templates are loaded securely for local matching."
              : "Requires camera access."}
          </p>
          <div>
            {!isCameraActive ? (
              <Button onClick={startCamera} disabled={isCameraLoading}>
                {isCameraLoading ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Starting...</>
                ) : (
                  <><Play className="mr-2 size-4 fill-current" />Start Camera</>
                )}
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopCamera}>
                <Square className="mr-2 size-4 fill-current" />
                Stop Camera
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recognition Result */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Recognition Result</p>
        <RecognitionResultCard result={result} />
      </div>

      {/* Model Error */}
      {modelError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex gap-3 items-start">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Recognition Engine Error</p>
            <p className="text-xs mt-0.5">{modelError}</p>
          </div>
        </div>
      )}

      {/* Calibration Notice */}
      <div className="text-xs text-muted-foreground border border-border rounded-xl px-4 py-3 space-y-1">
        <p className="font-semibold text-foreground">Threshold Calibration Notice</p>
        <p>
          The current match threshold of <span className="font-mono">{RECOGNITION_THRESHOLD}</span> is a conservative default.
          It must be calibrated with real-world consented test data before use in production attendance systems.
          A lower threshold reduces false positives but may miss genuine matches; a higher threshold does the opposite.
        </p>
      </div>
    </div>
  );
}

"use client";

import { Camera, Eye, ShieldCheck, Users } from "lucide-react";

interface DetectionStatusProps {
  isCameraActive: boolean;
  isCameraLoading: boolean;
  cameraError: string | null;
  isModelReady: boolean;
  isModelLoading: boolean;
  modelError: string | null;
  detectedFacesCount: number;
  detectionStatus: string;
}

export function DetectionStatus({
  isCameraActive,
  isCameraLoading,
  cameraError,
  isModelReady,
  isModelLoading,
  modelError,
  detectedFacesCount,
  detectionStatus,
}: DetectionStatusProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Camera Status Card */}
        <div className="border border-border bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Camera Feed
            </span>
            <Camera className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2.5 rounded-full ${
                  isCameraActive
                    ? "bg-emerald-500 animate-pulse"
                    : isCameraLoading
                      ? "bg-amber-500 animate-pulse"
                      : cameraError
                        ? "bg-destructive"
                        : "bg-muted-foreground/40"
                }`}
              />
              <span className="font-semibold text-foreground text-base">
                {isCameraLoading
                  ? "Starting Camera..."
                  : isCameraActive
                    ? "Camera Active"
                    : cameraError
                      ? "Unavailable"
                      : "Camera Inactive"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isCameraActive
                ? "Video streaming locally"
                : cameraError
                  ? "Check camera permissions"
                  : "Click start camera below"}
            </p>
          </div>
        </div>

        {/* Model Engine Status Card */}
        <div className="border border-border bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Detection Engine
            </span>
            <Eye className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2.5 rounded-full ${
                  isModelReady
                    ? "bg-emerald-500"
                    : isModelLoading
                      ? "bg-amber-500 animate-pulse"
                      : modelError
                        ? "bg-destructive"
                        : "bg-muted-foreground/40"
                }`}
              />
              <span className="font-semibold text-foreground text-base">
                {isModelLoading
                  ? "Loading Model..."
                  : isModelReady
                    ? "Engine Ready"
                    : "Failed to Load"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isModelReady
                ? "Local MediaPipe WASM"
                : modelError || "Initializing detector..."}
            </p>
          </div>
        </div>

        {/* Detected Faces Count Card */}
        <div className="border border-border bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Detected Faces
            </span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  detectedFacesCount > 0 ? "text-emerald-500" : "text-foreground"
                }`}
              >
                {isCameraActive ? detectedFacesCount : "-"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isCameraActive ? detectionStatus : "Waiting for camera"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {detectedFacesCount === 1
                ? "1 person in frame"
                : detectedFacesCount > 1
                  ? `${detectedFacesCount} people in frame`
                  : "No faces currently detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs">
        <ShieldCheck className="size-4 shrink-0" />
        <span>
          <strong>Privacy by Design:</strong> Face detection is processed 100% locally in your browser memory. No camera images or video frames are stored or transmitted.
        </span>
      </div>
    </div>
  );
}

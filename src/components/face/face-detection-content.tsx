"use client";

import { useCamera } from "@/hooks/use-camera";
import { useFaceDetector } from "@/hooks/use-face-detector";
import { CameraView } from "@/components/face/camera-view";
import { DetectionStatus } from "@/components/face/detection-status";
import { CheckCircle2, ScanFace, Sparkles } from "lucide-react";

export function FaceDetectionContent() {
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
    detectedFacesCount,
    detectionStatus,
  } = useFaceDetector(videoRef, isCameraActive);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
          <ScanFace className="size-4" />
          <span>Phase 6A Foundation</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Face Detection</h1>
        <p className="text-muted-foreground mt-1">
          Test the classroom camera stream and local browser-based face detection in real time.
        </p>
      </div>

      {/* Real-time Status Metric Cards */}
      <DetectionStatus
        isCameraActive={isCameraActive}
        isCameraLoading={isCameraLoading}
        cameraError={cameraError}
        isModelReady={isModelReady}
        isModelLoading={isModelLoading}
        modelError={modelError}
        detectedFacesCount={detectedFacesCount}
        detectionStatus={detectionStatus}
      />

      {/* Live Camera and Canvas Overlay Viewport */}
      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        isActive={isCameraActive}
        isLoading={isCameraLoading}
        error={cameraError}
        detectedFacesCount={detectedFacesCount}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
      />

      {/* Guide & Technical Notes Card */}
      <div className="border border-border bg-card/60 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Sparkles className="size-4 text-primary" />
          <span>Foundation Verification Guide</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Local MediaPipe BlazeFace:</strong> WebAssembly neural network processes frames directly on your CPU/GPU.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Real-Time Tracking:</strong> Bounding boxes automatically track multiple faces simultaneously.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Resource Management:</strong> All video tracks stop immediately when stopping the camera or navigating away.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Guaranteed:</strong> No student identification, embedding generation, or database storage in this phase.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

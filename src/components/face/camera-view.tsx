"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, Loader2, Play, Square } from "lucide-react";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  detectedFacesCount: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export function CameraView({
  videoRef,
  canvasRef,
  isActive,
  isLoading,
  error,
  detectedFacesCount,
  onStartCamera,
  onStopCamera,
}: CameraViewProps) {
  return (
    <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Viewport header bar */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          <span className="font-semibold text-sm">Live Camera Viewport</span>
        </div>

        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE</span>
            </div>
          )}
          {isActive && detectedFacesCount > 0 && (
            <div className="text-xs px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary font-medium">
              {detectedFacesCount} {detectedFacesCount === 1 ? "Face" : "Faces"}
            </div>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video w-full max-w-4xl mx-auto bg-neutral-950 flex items-center justify-center overflow-hidden">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isActive ? "opacity-100" : "opacity-0 absolute"
          }`}
        />

        {/* Bounding Box Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            isActive ? "block" : "hidden"
          }`}
        />

        {/* Inactive / Loading / Error Overlay */}
        {!isActive && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-neutral-300">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="font-medium text-sm">Requesting camera access...</p>
                <p className="text-xs text-neutral-400">
                  Please allow camera permissions if prompted.
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-destructive">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertCircle className="size-8 text-destructive" />
                </div>
                <p className="font-semibold text-sm text-foreground">Camera Access Issue</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartCamera}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-neutral-400">
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400">
                  <Camera className="size-8" />
                </div>
                <p className="font-medium text-sm text-neutral-200">
                  Camera is currently inactive
                </p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Click the Start Camera button below to initialize live video stream and local face detection.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Action Bar */}
      <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {isActive
            ? "Live face detection is processing frames in browser memory."
            : "Requires web camera access."}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!isActive ? (
            <Button
              onClick={onStartCamera}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Starting Camera...
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4 fill-current" />
                  Start Camera
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={onStopCamera}
              className="w-full sm:w-auto"
            >
              <Square className="mr-2 size-4 fill-current" />
              Stop Camera
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

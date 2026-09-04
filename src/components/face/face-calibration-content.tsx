"use client";

import { useState } from "react";
import { SlidersHorizontal, Camera, Loader2, Play, Square, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RECOGNITION_THRESHOLD, useFaceRecognition } from "@/hooks/use-face-recognition";
import { AMBIGUITY_MARGIN } from "@/lib/face-matching";
import { useCamera } from "@/hooks/use-camera";

export function FaceCalibrationContent() {
  const [threshold, setThreshold] = useState(RECOGNITION_THRESHOLD);
  const {
    videoRef,
    isActive: isCameraActive,
    isLoading: isCameraLoading,
    startCamera,
    stopCamera,
  } = useCamera();
  const { canvasRef, isModelReady, templatesLoading, templateCount, result } =
    useFaceRecognition(videoRef, isCameraActive, threshold);

  const isAmbiguous = result.state === "no_match" && result.isAmbiguous;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
          <SlidersHorizontal className="size-4" />
          <span>Administrator Calibration</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Recognition Calibration</h1>
        <p className="text-muted-foreground mt-1">
          Test a temporary threshold with consented students. This page never changes attendance records or saves a threshold.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-semibold">Use this only for controlled testing.</p>
        <p className="text-muted-foreground mt-1">
          Lower values are stricter. Raising the value can reduce genuine no-matches, but can also increase the risk of identifying the wrong student. The attendance threshold remains {RECOGNITION_THRESHOLD.toFixed(2)}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2"><Camera className="size-4 text-primary" /><span className="font-semibold text-sm">Live Calibration View</span></div>
            {!isCameraActive ? (
              <Button size="sm" onClick={startCamera} disabled={isCameraLoading}>
                {isCameraLoading ? <Loader2 className="size-4 animate-spin" /> : <><Play className="mr-2 size-4 fill-current" />Start Camera</>}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={stopCamera}><Square className="mr-2 size-4 fill-current" />Stop Camera</Button>
            )}
          </div>
          <div className="relative aspect-video bg-neutral-950 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className={isCameraActive ? "w-full h-full object-cover" : "hidden"} />
            <canvas ref={canvasRef} className={isCameraActive ? "absolute inset-0 w-full h-full pointer-events-none" : "hidden"} />
            {!isCameraActive && <p className="text-sm text-neutral-400">Start the camera to begin calibration.</p>}
          </div>
          <div className="p-4 border-t text-sm font-medium">{isModelReady ? result.statusMessage : "Loading recognition engine..."}</div>
        </div>

        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between"><span className="font-semibold">Test threshold</span><span className="font-mono text-lg font-bold text-primary">{threshold.toFixed(2)}</span></div>
            <input aria-label="Test threshold" type="range" min="0.42" max="0.60" step="0.01" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Strict 0.42</span><span>Permissive 0.60</span></div>
            <p className="text-xs text-muted-foreground">Loaded templates: {templatesLoading ? "…" : templateCount}. Ambiguity margin: {AMBIGUITY_MARGIN.toFixed(3)}.</p>
          </div>

          <div className={`border rounded-xl p-5 ${isAmbiguous ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-card"}`}>
            <p className="font-semibold">Live diagnostics</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Closest student</dt><dd className="font-medium text-right">{result.studentName ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Closest distance</dt><dd className="font-mono">{result.distance?.toFixed(4) ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Second-best distance</dt><dd className="font-mono">{result.secondBestDistance?.toFixed(4) ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Decision</dt><dd className="font-medium text-right">{isAmbiguous ? "Ambiguous — do not raise threshold" : result.state.replaceAll("_", " ")}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
        <p>Live frames and descriptors stay in browser memory. Only the enrolled numeric templates are loaded through the protected ADMIN API for local comparison.</p>
      </div>
    </div>
  );
}

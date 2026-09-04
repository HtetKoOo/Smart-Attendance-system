"use client";

import { useEffect, useRef, useState } from "react";
import type * as FaceApiTypes from "@vladmandic/face-api";

/**
 * RECOGNITION_THRESHOLD: Euclidean distance below which a face is considered
 * a match. Lower = stricter. This value requires real-world calibration with
 * consented test data before production use. 0.48 is a conservative default.
 */
export const RECOGNITION_THRESHOLD = 0.48;

export interface RecognitionTemplate {
  embeddingId: string;
  studentId: string;
  studentDbId: string;
  studentName: string;
  embedding: number[];
}

export interface RecognitionResult {
  state:
    | "idle"
    | "no_templates"
    | "no_face"
    | "multiple_faces"
    | "recognizing"
    | "recognized"
    | "no_match";
  studentDbId?: string;
  studentId?: string;
  studentName?: string;
  distance?: number;
  confidenceLabel?: string;
  /** True after the same student has passed the consecutive-frame check. */
  isStable?: boolean;
  /** True when a recent stable match is being held during a brief camera jitter. */
  isLocked?: boolean;
  faceCount: number;
  statusMessage: string;
}

export interface UseAttendanceRecognitionResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isModelLoading: boolean;
  isModelReady: boolean;
  modelError: string | null;
  result: RecognitionResult;
}

function getConfidenceLabel(distance: number): string {
  if (distance < 0.3) return "Very High";
  if (distance < 0.38) return "High";
  if (distance < 0.44) return "Moderate";
  return "Low";
}

type StableMatch = Required<
  Pick<
    RecognitionResult,
    "studentDbId" | "studentId" | "studentName" | "distance" | "confidenceLabel"
  >
> & {
  expiresAt: number;
};

// Keeps a verified result visible through a very short dropped-frame or
// quality-jitter period. It is deliberately cleared for unknown/multiple faces.
const STABLE_MATCH_LOCK_MS = 1_500;
const SMOOTH_FRAMES = 4;
const MIN_FACE_HEIGHT_RATIO = 0.18;

export function useAttendanceRecognition(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
  templates: RecognitionTemplate[],
): UseAttendanceRecognitionResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceapiRef = useRef<typeof FaceApiTypes | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);

  // Smoothing: track consecutive frames identifying the same student
  const consecutiveHitRef = useRef<{ studentId: string; count: number } | null>(null);
  const stableMatchRef = useRef<StableMatch | null>(null);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [activeResult, setActiveResult] = useState<RecognitionResult>({
    state: "idle",
    faceCount: 0,
    statusMessage: "Initializing...",
  });

  // ── Load face-api models from local /public/models/face-api/ ───────────────
  useEffect(() => {
    let isCancelled = false;

    async function initModels() {
      try {
        const faceapi = await import("@vladmandic/face-api");
        if (isCancelled) return;

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models/face-api"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models/face-api"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models/face-api"),
        ]);

        if (isCancelled) return;

        faceapiRef.current = faceapi;
        setIsModelReady(true);
        setModelError(null);
      } catch (err) {
        if (isCancelled) return;
        console.error("Error loading face-api models:", err);
        setModelError(
          "Failed to load face recognition models from local storage.",
        );
      } finally {
        if (!isCancelled) setIsModelLoading(false);
      }
    }

    initModels();

    return () => {
      isCancelled = true;
    };
  }, []);


  // ── Recognition loop ───────────────────────────────────────────────────────
  useEffect(() => {
    // Reset recognition state whenever dependencies (like templates) change
    consecutiveHitRef.current = null;
    stableMatchRef.current = null;

    if (!isCameraActive || !isModelReady) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const faceapi = faceapiRef.current;

      // Target ~8 fps for recognition (every 125 ms)
      const now = performance.now();
      if (
        now - lastProcessTimeRef.current >= 125 &&
        video &&
        canvas &&
        faceapi &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        lastProcessTimeRef.current = now;

        const displayW = video.clientWidth;
        const displayH = video.clientHeight;
        if (canvas.width !== displayW || canvas.height !== displayH) {
          canvas.width = displayW;
          canvas.height = displayH;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // No enrolled templates at all
        if (templates.length === 0) {
          consecutiveHitRef.current = null;
          stableMatchRef.current = null;
          setActiveResult({
            state: "no_templates",
            faceCount: 0,
            statusMessage:
              "No enrolled students found. Enroll students on the Face Enrollment page first.",
          });
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
          return;
        }

        try {
          const allDetections = await faceapi
            .detectAllFaces(
              video,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.55 }),
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

          const count = allDetections.length;

          if (count === 0) {
            consecutiveHitRef.current = null;
            const stableMatch = stableMatchRef.current;
            if (stableMatch && stableMatch.expiresAt > now) {
              setActiveResult({
                state: "recognized",
                faceCount: 0,
                studentDbId: stableMatch.studentDbId,
                studentId: stableMatch.studentId,
                studentName: stableMatch.studentName,
                distance: stableMatch.distance,
                confidenceLabel: stableMatch.confidenceLabel,
                isStable: true,
                isLocked: true,
                statusMessage: `Stable match held briefly: ${stableMatch.studentName}. Keep your face in view.`,
              });
            } else {
              stableMatchRef.current = null;
              setActiveResult({
                state: "no_face",
                faceCount: 0,
                statusMessage: "No face detected. Look directly at the camera.",
              });
            }
          } else if (count > 1) {
            consecutiveHitRef.current = null;
            // Multiple people must always override a prior match immediately.
            stableMatchRef.current = null;
            setActiveResult({
              state: "multiple_faces",
              faceCount: count,
              statusMessage: `${count} faces detected. Recognition is paused. Only one person must be in view.`,
            });

            // Draw warning boxes for each face
            if (ctx && video.videoWidth > 0) {
              const scaleX = displayW / video.videoWidth;
              const scaleY = displayH / video.videoHeight;
              for (const d of allDetections) {
                const b = d.detection.box;
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#ef4444";
                ctx.beginPath();
                ctx.roundRect(b.x * scaleX, b.y * scaleY, b.width * scaleX, b.height * scaleY, 8);
                ctx.stroke();
              }
            }
          } else {
            // Exactly 1 face — validate quality before matching
            const detection = allDetections[0];
            const score = detection.detection.score;
            const box = detection.detection.box;

            const vw = video.videoWidth;
            const vh = video.videoHeight;

            // Per-frame quality gates (same criteria as enrollment)
            const MIN_CONFIDENCE = 0.65;
            const MAX_CENTER_OFFSET = 0.18; // 18% of video dimensions
            const MAX_FACE_HEIGHT_RATIO = 0.75;

            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const offsetX = Math.abs(faceCenterX / vw - 0.5);
            const offsetY = Math.abs(faceCenterY / vh - 0.5);
            const faceHeightRatio = box.height / vh;

            let adjustHint: string | null = null;

            if (score < MIN_CONFIDENCE) {
              adjustHint = "Improve lighting or remove obstructions.";
            } else if (offsetX > MAX_CENTER_OFFSET || offsetY > MAX_CENTER_OFFSET) {
              adjustHint = "Center your face in the frame.";
            } else if (faceHeightRatio < MIN_FACE_HEIGHT_RATIO) {
              adjustHint = "Move closer to the camera.";
            } else if (faceHeightRatio > MAX_FACE_HEIGHT_RATIO) {
              adjustHint = "Move further from the camera.";
            }

            if (adjustHint !== null) {
              // Quality gate failed — clear in-progress smoothing, skip matching.
              // A very recent verified match may stay visible for the short lock
              // period to avoid status flicker caused by a dropped camera frame.
              consecutiveHitRef.current = null;

              // Draw an amber box to give visual feedback
              if (ctx && vw > 0) {
                const scaleX = displayW / vw;
                const scaleY = displayH / vh;
                const bx = box.x * scaleX;
                const by = box.y * scaleY;
                const bw = box.width * scaleX;
                const bh = box.height * scaleY;
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#f59e0b";
                ctx.fillStyle = "rgba(245,158,11,0.10)";
                ctx.beginPath();
                ctx.roundRect(bx, by, bw, bh, 8);
                ctx.stroke();
                ctx.fill();
                const tagH = 20;
                ctx.font = "bold 12px sans-serif";
                const tw = ctx.measureText(adjustHint).width;
                const tagW = tw + 14;
                const tagX = bx;
                const tagY = by > tagH + 6 ? by - tagH - 4 : by + 4;
                ctx.fillStyle = "#f59e0b";
                ctx.beginPath();
                ctx.roundRect(tagX, tagY, tagW, tagH, 4);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.fillText(adjustHint, tagX + 7, tagY + 14);
              }

              const stableMatch = stableMatchRef.current;
              if (stableMatch && stableMatch.expiresAt > now) {
                setActiveResult({
                  state: "recognized",
                  faceCount: 1,
                  studentDbId: stableMatch.studentDbId,
                  studentId: stableMatch.studentId,
                  studentName: stableMatch.studentName,
                  distance: stableMatch.distance,
                  confidenceLabel: stableMatch.confidenceLabel,
                  isStable: true,
                  isLocked: true,
                  statusMessage: `Stable match held briefly: ${stableMatch.studentName}. ${adjustHint}`,
                });
              } else {
                stableMatchRef.current = null;
                setActiveResult({
                  state: "no_face",
                  faceCount: 1,
                  statusMessage: adjustHint,
                });
              }
            } else {
              // Quality gate passed — run Euclidean matching
              const descriptor = detection.descriptor;

              let bestDist = Infinity;
              let bestTemplate: RecognitionTemplate | null = null;

              for (const tmpl of templates) {
                const dist = faceapi.euclideanDistance(
                  descriptor,
                  tmpl.embedding as unknown as Float32Array,
                );
                if (dist < bestDist) {
                  bestDist = dist;
                  bestTemplate = tmpl;
                }
              }

              // Smoothing: require SMOOTH_FRAMES consecutive consistent results
              const isMatch = bestDist <= RECOGNITION_THRESHOLD && bestTemplate;

              if (isMatch && bestTemplate) {
                const prev = consecutiveHitRef.current;
                if (prev && prev.studentId === bestTemplate.studentDbId) {
                  consecutiveHitRef.current = {
                    studentId: bestTemplate.studentDbId,
                    count: prev.count + 1,
                  };
                } else {
                  consecutiveHitRef.current = {
                    studentId: bestTemplate.studentDbId,
                    count: 1,
                  };
                }
              } else {
                consecutiveHitRef.current = null;
              }

              const smoothedMatch =
                isMatch &&
                bestTemplate &&
                consecutiveHitRef.current &&
                consecutiveHitRef.current.count >= SMOOTH_FRAMES;

              // Draw face bounding box
              if (ctx && vw > 0) {
                const scaleX = displayW / vw;
                const scaleY = displayH / vh;
                const b = detection.detection.box;
                const bx = b.x * scaleX;
                const by = b.y * scaleY;
                const bw = b.width * scaleX;
                const bh = b.height * scaleY;

                ctx.lineWidth = 2.5;
                ctx.strokeStyle = smoothedMatch ? "#10b981" : "#f59e0b";
                ctx.fillStyle = smoothedMatch
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(245,158,11,0.12)";
                ctx.beginPath();
                ctx.roundRect(bx, by, bw, bh, 8);
                ctx.stroke();
                ctx.fill();

                // Label tag
                const label =
                  smoothedMatch && bestTemplate
                    ? `${bestTemplate.studentName}`
                    : bestDist <= RECOGNITION_THRESHOLD
                      ? "Verifying..."
                      : "No Match";
                ctx.font = "bold 12px sans-serif";
                const tw = ctx.measureText(label).width;
                const tagH = 20;
                const tagW = tw + 14;
                const tagX = bx;
                const tagY = by > tagH + 6 ? by - tagH - 4 : by + 4;
                ctx.fillStyle = smoothedMatch ? "#10b981" : "#f59e0b";
                ctx.beginPath();
                ctx.roundRect(tagX, tagY, tagW, tagH, 4);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.fillText(label, tagX + 7, tagY + 14);
              }

              if (smoothedMatch && bestTemplate) {
                stableMatchRef.current = {
                  studentDbId: bestTemplate.studentDbId,
                  studentId: bestTemplate.studentId,
                  studentName: bestTemplate.studentName,
                  distance: bestDist,
                  confidenceLabel: getConfidenceLabel(bestDist),
                  expiresAt: now + STABLE_MATCH_LOCK_MS,
                };
                setActiveResult({
                  state: "recognized",
                  faceCount: 1,
                  studentDbId: bestTemplate.studentDbId,
                  studentId: bestTemplate.studentId,
                  studentName: bestTemplate.studentName,
                  distance: bestDist,
                  confidenceLabel: getConfidenceLabel(bestDist),
                  isStable: true,
                  isLocked: false,
                  statusMessage: `Stable match: ${bestTemplate.studentName}. Ready to record.`,
                });
              } else if (isMatch && bestTemplate) {
                setActiveResult({
                  state: "recognizing",
                  faceCount: 1,
                  studentDbId: bestTemplate.studentDbId,
                  studentId: bestTemplate.studentId,
                  studentName: bestTemplate.studentName,
                  distance: bestDist,
                  confidenceLabel: getConfidenceLabel(bestDist),
                  statusMessage: "Verifying stable match...",
                });
              } else {
                // A clear but unknown face must pause recording immediately.
                stableMatchRef.current = null;
                setActiveResult({
                  state: "no_match",
                  faceCount: 1,
                  distance: bestDist,
                  statusMessage: "No enrolled student matched.",
                });
              }
            }
          }
        } catch (err) {
          console.error("Recognition frame error:", err);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, isModelReady, videoRef, templates]);

  const result: RecognitionResult = !isModelReady
    ? {
        state: "idle",
        faceCount: 0,
        statusMessage:
          modelError || (isModelLoading ? "Loading face models..." : "Model error"),
      }
    : !isCameraActive
      ? {
          state: "idle",
          faceCount: 0,
          statusMessage: "Start camera to begin recognition.",
        }
      : activeResult;

  return {
    canvasRef,
    isModelLoading,
    isModelReady,
    modelError,
    result,
  };
}

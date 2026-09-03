"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceDetector as FaceDetectorType } from "@mediapipe/tasks-vision";

export interface DetectionResult {
  originX: number;
  originY: number;
  width: number;
  height: number;
  score: number;
}

export interface UseFaceDetectorResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isModelLoading: boolean;
  isModelReady: boolean;
  modelError: string | null;
  detectedFacesCount: number;
  detectionStatus: string;
}

export function useFaceDetector(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
): UseFaceDetectorResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<FaceDetectorType | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [activeFaceCount, setActiveFaceCount] = useState<number>(0);
  const [activeStatus, setActiveStatus] = useState<string>("Detecting...");

  // Initialize MediaPipe FaceDetector using ONLY local assets
  useEffect(() => {
    let isCancelled = false;

    async function initDetector() {
      try {
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        // Load WASM from local /wasm folder (no CDN)
        const vision = await FilesetResolver.forVisionTasks("/wasm");

        if (isCancelled) return;

        // Load model from local /models folder (no CDN)
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });

        if (isCancelled) {
          // Safely dispose the freshly created detector when the effect was
          // cancelled while the async init was in flight (Strict Mode / Fast Refresh).
          try {
            detector.close();
          } catch {
            // WASM runtime may already be torn down; ignore disposal errors.
          }
          return;
        }

        detectorRef.current = detector;
        setIsModelReady(true);
        setModelError(null);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("Error initializing MediaPipe FaceDetector:", err);
        setModelError(
          "Failed to load the local face detection model. Please refresh and try again.",
        );
      } finally {
        if (!isCancelled) {
          setIsModelLoading(false);
        }
      }
    }

    initDetector();

    return () => {
      isCancelled = true;
      // Cancel any pending animation frame before disposing the detector.
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Null the ref first so a concurrent call cannot close the same instance twice.
      const detectorToClose = detectorRef.current;
      detectorRef.current = null;
      if (detectorToClose) {
        try {
          detectorToClose.close();
        } catch {
          // MediaPipe/WASM may already be disposed during Strict Mode double-invoke,
          // Fast Refresh, or page navigation. Suppress disposal-only errors.
        }
      }
    };
  }, []);

  // Run face detection loop when camera is active and model is ready
  useEffect(() => {
    if (!isCameraActive || !isModelReady) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Clear canvas overlay
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    let isRunning = true;

    const detectFaces = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (
        video &&
        canvas &&
        detector &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        const videoTime = video.currentTime;

        // Process only if video timestamp changed
        if (videoTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoTime;

          try {
            const startTimeMs = performance.now();
            const detections = detector.detectForVideo(video, startTimeMs);
            const faces = detections.detections || [];

            const count = faces.length;
            setActiveFaceCount(count);

            if (count === 0) {
              setActiveStatus("No face detected");
            } else if (count === 1) {
              setActiveStatus("1 face detected");
            } else {
              setActiveStatus(`${count} faces detected`);
            }

            // Sync canvas resolution to video display dimensions
            const displayWidth = video.clientWidth;
            const displayHeight = video.clientHeight;

            if (
              canvas.width !== displayWidth ||
              canvas.height !== displayHeight
            ) {
              canvas.width = displayWidth;
              canvas.height = displayHeight;
            }

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (video.videoWidth > 0 && video.videoHeight > 0) {
                const scaleX = displayWidth / video.videoWidth;
                const scaleY = displayHeight / video.videoHeight;

                for (let i = 0; i < faces.length; i++) {
                  const face = faces[i];
                  const box = face.boundingBox;
                  if (!box) continue;

                  const x = box.originX * scaleX;
                  const y = box.originY * scaleY;
                  const width = box.width * scaleX;
                  const height = box.height * scaleY;
                  const score = face.categories?.[0]?.score ?? 1.0;
                  const scorePercent = Math.round(score * 100);

                  // Draw styled bounding box
                  ctx.lineWidth = 2.5;
                  ctx.strokeStyle = "#10b981"; // Emerald-500
                  ctx.fillStyle = "rgba(16, 185, 129, 0.15)";

                  // Rounded rectangle for face box
                  const radius = 8;
                  ctx.beginPath();
                  ctx.roundRect(x, y, width, height, radius);
                  ctx.stroke();
                  ctx.fill();

                  // Confidence badge tag
                  const tagText = `Face #${i + 1} (${scorePercent}%)`;
                  ctx.font = "bold 11px sans-serif";
                  const textMetrics = ctx.measureText(tagText);
                  const tagHeight = 18;
                  const tagWidth = textMetrics.width + 12;
                  const tagX = x;
                  const tagY = y > tagHeight + 4 ? y - tagHeight - 4 : y + 4;

                  ctx.fillStyle = "#10b981";
                  ctx.beginPath();
                  ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 4);
                  ctx.fill();

                  ctx.fillStyle = "#ffffff";
                  ctx.fillText(tagText, tagX + 6, tagY + 13);
                }
              }
            }
          } catch (detectionErr) {
            console.error("Error during face detection frame:", detectionErr);
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(detectFaces);
    };

    animationFrameIdRef.current = requestAnimationFrame(detectFaces);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, isModelReady, videoRef]);

  // Derived statuses
  const detectedFacesCount = isCameraActive ? activeFaceCount : 0;
  const detectionStatus = !isModelReady
    ? modelError || (isModelLoading ? "Loading face detection model..." : "Model initialization failed")
    : !isCameraActive
      ? "Waiting for camera"
      : activeStatus;

  return {
    canvasRef,
    isModelLoading,
    isModelReady,
    modelError,
    detectedFacesCount,
    detectionStatus,
  };
}

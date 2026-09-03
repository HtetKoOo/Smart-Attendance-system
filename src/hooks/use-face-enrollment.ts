"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type * as FaceApiTypes from "@vladmandic/face-api";

export interface EnrollmentState {
  isReadyForCapture: boolean;
  statusMessage: string;
  faceCount: number;
  confidence: number;
  isCentered: boolean;
  isGoodSize: boolean;
}

export interface UseFaceEnrollmentResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isModelLoading: boolean;
  isModelReady: boolean;
  modelError: string | null;
  faceState: EnrollmentState;
  isCapturing: boolean;
  captureStep: number;
  totalSteps: number;
  enrollmentError: string | null;
  enrollmentSuccess: boolean;
  captureEnrollment: (studentId: string) => Promise<boolean>;
  resetEnrollmentState: () => void;
}

export function useFaceEnrollment(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
): UseFaceEnrollmentResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceapiRef = useRef<typeof FaceApiTypes | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [activeFaceState, setActiveFaceState] = useState<EnrollmentState>({
    isReadyForCapture: false,
    statusMessage: "Initializing face engine...",
    faceCount: 0,
    confidence: 0,
    isCentered: true,
    isGoodSize: true,
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const totalSteps = 4;
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  // Initialize face-api models from local /models/face-api/
  useEffect(() => {
    let isCancelled = false;

    async function initModels() {
      try {
        const faceapi = await import("@vladmandic/face-api");

        if (isCancelled) return;

        // Load models strictly from local static path
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models/face-api"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models/face-api"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models/face-api"),
        ]);

        if (isCancelled) return;

        faceapiRef.current = faceapi;
        setIsModelReady(true);
        setModelError(null);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("Error loading face-api models:", err);
        setModelError(
          "Failed to load local face recognition models. Please check your browser connection.",
        );
      } finally {
        if (!isCancelled) {
          setIsModelLoading(false);
        }
      }
    }

    initModels();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Real-time detection & alignment guidance loop
  useEffect(() => {
    if (!isCameraActive || !isModelReady || isCapturing) {
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

      const now = performance.now();
      // Throttle live preview feedback to ~15fps (every 66ms)
      if (
        now - lastProcessTimeRef.current >= 66 &&
        video &&
        canvas &&
        faceapi &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        lastProcessTimeRef.current = now;

        try {
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

            // Draw enrollment guide oval in the center
            const centerX = displayWidth / 2;
            const centerY = displayHeight / 2;
            const radiusX = displayWidth * 0.22;
            const radiusY = displayHeight * 0.35;

            // Detect all faces for validation
            const detections = await faceapi
              .detectAllFaces(
                video,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
              )
              .withFaceLandmarks();

            const count = detections.length;

            if (count === 0) {
              // Draw subtle neutral guide
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 6]);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
              ctx.stroke();
              ctx.setLineDash([]);

              setActiveFaceState({
                isReadyForCapture: false,
                statusMessage: "No face detected. Look directly at the camera.",
                faceCount: 0,
                confidence: 0,
                isCentered: false,
                isGoodSize: false,
              });
            } else if (count > 1) {
              // Highlight warning for multiple faces
              ctx.lineWidth = 3;
              ctx.strokeStyle = "#ef4444";
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
              ctx.stroke();

              setActiveFaceState({
                isReadyForCapture: false,
                statusMessage: "Multiple faces detected. Only one person must be in view.",
                faceCount: count,
                confidence: 0,
                isCentered: false,
                isGoodSize: false,
              });
            } else {
              // Exactly 1 face
              const detection = detections[0];
              const box = detection.detection.box;
              const scaleX = displayWidth / video.videoWidth;
              const scaleY = displayHeight / video.videoHeight;

              const faceBoxX = box.x * scaleX;
              const faceBoxY = box.y * scaleY;
              const faceBoxWidth = box.width * scaleX;
              const faceBoxHeight = box.height * scaleY;
              const faceCenterX = faceBoxX + faceBoxWidth / 2;
              const faceCenterY = faceBoxY + faceBoxHeight / 2;

              // Validate centering (within 20% of frame center)
              const maxOffsetX = displayWidth * 0.18;
              const maxOffsetY = displayHeight * 0.18;
              const isCentered =
                Math.abs(faceCenterX - centerX) < maxOffsetX &&
                Math.abs(faceCenterY - centerY) < maxOffsetY;

              // Validate size (face height between 25% and 75% of viewport height)
              const isGoodSize =
                faceBoxHeight >= displayHeight * 0.25 &&
                faceBoxHeight <= displayHeight * 0.75;

              const confidence = Math.round(detection.detection.score * 100);
              const isHighConfidence = detection.detection.score >= 0.7;

              const isReady = isCentered && isGoodSize && isHighConfidence;

              let msg = "Perfect! Hold still to capture.";
              if (!isHighConfidence) msg = "Low lighting or unclear face. Adjust lighting.";
              else if (!isCentered) msg = "Center your face in the oval guide.";
              else if (faceBoxHeight < displayHeight * 0.25) msg = "Move slightly closer to the camera.";
              else if (faceBoxHeight > displayHeight * 0.75) msg = "Move slightly back from the camera.";

              // Draw guide oval colored by readiness
              ctx.lineWidth = 3;
              ctx.strokeStyle = isReady ? "#10b981" : "#f59e0b"; // Emerald if ready, Amber if adjusting
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
              ctx.stroke();

              // Draw face box
              ctx.lineWidth = 2;
              ctx.strokeStyle = isReady ? "rgba(16, 185, 129, 0.7)" : "rgba(245, 158, 11, 0.7)";
              ctx.beginPath();
              ctx.roundRect(faceBoxX, faceBoxY, faceBoxWidth, faceBoxHeight, 8);
              ctx.stroke();

              setActiveFaceState({
                isReadyForCapture: isReady,
                statusMessage: msg,
                faceCount: 1,
                confidence,
                isCentered,
                isGoodSize,
              });
            }
          }
        } catch (err) {
          console.error("Frame processing error:", err);
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
  }, [isCameraActive, isModelReady, isCapturing, videoRef]);

  const resetEnrollmentState = useCallback(() => {
    setEnrollmentError(null);
    setEnrollmentSuccess(false);
    setCaptureStep(0);
  }, []);

  // Multi-sample capture and consistency verification
  const captureEnrollment = useCallback(
    async (studentId: string): Promise<boolean> => {
      const video = videoRef.current;
      const faceapi = faceapiRef.current;

      if (!video || !faceapi || !isModelReady) {
        setEnrollmentError("Face detection engine is not ready.");
        return false;
      }

      setIsCapturing(true);
      setEnrollmentError(null);
      setEnrollmentSuccess(false);
      setCaptureStep(0);

      const capturedDescriptors: Float32Array[] = [];

      try {
        for (let i = 0; i < totalSteps; i++) {
          setCaptureStep(i + 1);

          // Detect ALL faces so that a second face entering the frame during capture is caught
          const allDetections = await faceapi
            .detectAllFaces(
              video,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.65 }),
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Reject if not exactly one face in frame at capture time
          if (allDetections.length === 0) {
            throw new Error(
              `Sample ${i + 1} failed: No face detected. Look directly at the camera and hold still.`,
            );
          }
          if (allDetections.length > 1) {
            throw new Error(
              `Sample ${i + 1} failed: ${allDetections.length} faces detected. Only one person may be in view during enrollment capture.`,
            );
          }

          const detection = allDetections[0];

          // Re-validate confidence for this sample
          if (detection.detection.score < 0.65) {
            throw new Error(
              `Sample ${i + 1} failed: Low confidence (${Math.round(detection.detection.score * 100)}%). Improve lighting and hold still.`,
            );
          }

          // Re-validate centering and size
          const vidW = video.videoWidth;
          const vidH = video.videoHeight;
          if (vidW > 0 && vidH > 0) {
            const box = detection.detection.box;
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const maxOffsetX = vidW * 0.18;
            const maxOffsetY = vidH * 0.18;
            const isCentered =
              Math.abs(faceCenterX - vidW / 2) < maxOffsetX &&
              Math.abs(faceCenterY - vidH / 2) < maxOffsetY;
            const isGoodSize =
              box.height >= vidH * 0.25 && box.height <= vidH * 0.75;

            if (!isCentered) {
              throw new Error(
                `Sample ${i + 1} failed: Face is not centered. Position your face within the oval guide.`,
              );
            }
            if (!isGoodSize) {
              throw new Error(
                `Sample ${i + 1} failed: Face is too ${box.height < vidH * 0.25 ? "small (move closer)" : "large (move back)"}.`,
              );
            }
          }

          if (!detection.descriptor || detection.descriptor.length !== 128) {
            throw new Error("Invalid descriptor generated by model.");
          }

          capturedDescriptors.push(detection.descriptor);

          // Wait 200ms between sample captures
          if (i < totalSteps - 1) {
            await new Promise((res) => setTimeout(res, 200));
          }
        }

        // Validate consistency between captured descriptors (Euclidean distance < 0.45)
        for (let i = 0; i < capturedDescriptors.length; i++) {
          for (let j = i + 1; j < capturedDescriptors.length; j++) {
            const distance = faceapi.euclideanDistance(
              capturedDescriptors[i],
              capturedDescriptors[j],
            );
            if (distance > 0.45) {
              throw new Error(
                "Face samples were inconsistent. Please remain still during the capture sequence.",
              );
            }
          }
        }

        // Compute average normalized 128D embedding vector
        const averaged = new Float32Array(128);
        for (let dim = 0; dim < 128; dim++) {
          let sum = 0;
          for (let s = 0; s < capturedDescriptors.length; s++) {
            sum += capturedDescriptors[s][dim];
          }
          averaged[dim] = sum / capturedDescriptors.length;
        }

        // Normalize the averaged vector
        let norm = 0;
        for (let dim = 0; dim < 128; dim++) {
          norm += averaged[dim] * averaged[dim];
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
          for (let dim = 0; dim < 128; dim++) {
            averaged[dim] = averaged[dim] / norm;
          }
        }

        const embeddingArray = Array.from(averaged);

        // Submit numeric embedding vector to ADMIN API route
        const response = await fetch("/api/admin/face-enrollment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            embedding: embeddingArray,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to store face enrollment.");
        }

        setEnrollmentSuccess(true);
        return true;
      } catch (err: unknown) {
        console.error("Capture enrollment error:", err);
        setEnrollmentError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during enrollment capture.",
        );
        return false;
      } finally {
        setIsCapturing(false);
      }
    },
    [isModelReady, videoRef],
  );

  const faceState = !isModelReady
    ? {
        isReadyForCapture: false,
        statusMessage: modelError || "Loading biometric models...",
        faceCount: 0,
        confidence: 0,
        isCentered: false,
        isGoodSize: false,
      }
    : !isCameraActive
      ? {
          isReadyForCapture: false,
          statusMessage: "Start camera to align face",
          faceCount: 0,
          confidence: 0,
          isCentered: false,
          isGoodSize: false,
        }
      : activeFaceState;

  return {
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
  };
}

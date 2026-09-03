"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError("Camera access is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    try {
      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        };
      }

      setIsActive(true);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setError(
              "Camera permission was denied. Please allow camera access in your browser settings.",
            );
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            setError("No camera found on this device.");
            break;
          case "NotReadableError":
          case "TrackStartError":
            setError(
              "Camera is already in use by another application or unavailable.",
            );
            break;
          case "OverconstrainedError":
            setError(
              "Camera does not satisfy the requested resolution constraints.",
            );
            break;
          default:
            setError(
              "Camera is unavailable. Please check your camera connection and settings.",
            );
            break;
        }
      } else {
        setError(
          "An unexpected error occurred while attempting to start the camera.",
        );
      }
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
  };
}

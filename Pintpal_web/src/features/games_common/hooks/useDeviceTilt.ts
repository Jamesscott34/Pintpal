/**
 * useDeviceTilt.ts
 *
 * Purpose: Map device orientation / pointer drag to a 0–1 pour intensity.
 * Connects to: TiltPourGlass (tilt game + Serving Rush).
 * Notes: Desktop uses drag-to-tilt; phones can use DeviceOrientation when permitted.
 */

"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

export type TiltSource = "idle" | "orientation" | "pointer";

export type UseDeviceTiltResult = {
  /** 0 = upright (no pour), 1 = fully tilted (max pour rate). */
  tiltAmount: number;
  /** Degrees used for CSS rotate (negative = pour toward rim). */
  tiltDegrees: number;
  source: TiltSource;
  permission: "unknown" | "granted" | "denied" | "unsupported";
  requestPermission: () => Promise<void>;
  /** Attach to the glass for pointer drag fallback. */
  bindPointerTilt: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: (e: PointerEvent) => void;
  };
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Convert beta (front-back) into pour intensity when phone is tipped forward. */
function orientationToTilt(beta: number | null, gamma: number | null): number {
  if (beta == null && gamma == null) return 0;
  // Tip phone toward you / forward: beta around 25–75°.
  const b = Math.abs(beta ?? 0);
  const g = Math.abs(gamma ?? 0);
  const fromBeta = clamp01((b - 20) / 55);
  const fromGamma = clamp01((g - 15) / 50);
  return Math.max(fromBeta, fromGamma * 0.85);
}

export function useDeviceTilt(): UseDeviceTiltResult {
  const [tiltAmount, setTiltAmount] = useState(0);
  const [source, setSource] = useState<TiltSource>("idle");
  const [permission, setPermission] = useState<
    UseDeviceTiltResult["permission"]
  >("unknown");
  const pointerActive = useRef(false);
  const startY = useRef(0);
  const orientationActive = useRef(false);

  const onOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (pointerActive.current) return;
    const amount = orientationToTilt(event.beta, event.gamma);
    orientationActive.current = amount > 0.05;
    setTiltAmount(amount);
    setSource(amount > 0.02 ? "orientation" : "idle");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const DOE = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<"granted" | "denied">;
        })
      | undefined;
    if (!DOE) {
      setPermission("unsupported");
      return;
    }
    if (typeof DOE.requestPermission !== "function") {
      setPermission("granted");
      window.addEventListener("deviceorientation", onOrientation);
      return () => window.removeEventListener("deviceorientation", onOrientation);
    }
    return undefined;
  }, [onOrientation]);

  const requestPermission = useCallback(async () => {
    const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DOE.requestPermission !== "function") {
      setPermission("unsupported");
      return;
    }
    try {
      const result = await DOE.requestPermission();
      if (result === "granted") {
        setPermission("granted");
        window.addEventListener("deviceorientation", onOrientation);
      } else {
        setPermission("denied");
      }
    } catch {
      setPermission("denied");
    }
  }, [onOrientation]);

  const bindPointerTilt = {
    onPointerDown: (e: PointerEvent) => {
      pointerActive.current = true;
      startY.current = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!pointerActive.current) return;
      const dy = e.clientY - startY.current;
      const amount = clamp01(Math.abs(dy) / 140);
      setTiltAmount(amount);
      setSource(amount > 0.02 ? "pointer" : "idle");
    },
    onPointerUp: (e: PointerEvent) => {
      pointerActive.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (!orientationActive.current) {
        setTiltAmount(0);
        setSource("idle");
      }
    },
    onPointerCancel: (_e: PointerEvent) => {
      pointerActive.current = false;
      if (!orientationActive.current) {
        setTiltAmount(0);
        setSource("idle");
      }
    },
  };

  return {
    tiltAmount,
    tiltDegrees: -(tiltAmount * 42),
    source,
    permission,
    requestPermission,
    bindPointerTilt,
  };
}

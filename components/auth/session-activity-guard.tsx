"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TOUCH_INTERVAL_MS = 30_000;
const CHECK_INTERVAL_MS = 5_000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "scroll",
  "mousemove",
  "touchstart"
];

type SessionActivityGuardProps = {
  inactivityMinutes: number;
};

export function SessionActivityGuard({
  inactivityMinutes
}: SessionActivityGuardProps) {
  const router = useRouter();
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    const inactivityMs = Math.max(1, inactivityMinutes) * 60_000;
    let lastInteraction = Date.now();
    let lastServerTouch = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const logoutForInactivity = async () => {
      if (logoutTriggeredRef.current) {
        return;
      }

      logoutTriggeredRef.current = true;

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store"
        });
      } catch {
        // Local redirect still happens if upstream request fails.
      }

      router.replace("/login?reason=inactive");
      router.refresh();
    };

    const touchServerSession = async () => {
      try {
        const response = await fetch("/api/auth/activity", {
          method: "POST",
          cache: "no-store"
        });

        if (response.status === 401) {
          await logoutForInactivity();
        }
      } catch {
        // Keep local inactivity timer running even if network fails.
      }
    };

    const scheduleLogout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        void logoutForInactivity();
      }, inactivityMs);
    };

    const registerActivity = () => {
      lastInteraction = Date.now();
      scheduleLogout();

      if (lastInteraction - lastServerTouch >= TOUCH_INTERVAL_MS) {
        lastServerTouch = lastInteraction;
        void touchServerSession();
      }
    };

    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        registerActivity();
      }
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, registerActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", visibilityHandler);
    scheduleLogout();
    void touchServerSession();

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastInteraction >= inactivityMs) {
        void logoutForInactivity();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      window.clearInterval(intervalId);

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, registerActivity);
      }

      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [inactivityMinutes, router]);

  return null;
}

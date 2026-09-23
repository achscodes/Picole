"use client";

import { useEffect } from "react";
import { setWaitingWorker } from "@/lib/offline/sw-update-store";

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    let reloaded = false;

    function watchForWaiting(reg: ServiceWorkerRegistration) {
      if (reg.waiting && reg.active) {
        setWaitingWorker(reg.waiting);
      }
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // "installed" while a controller already exists means this is an
          // update sitting behind the currently-active SW, not the app's
          // very first install (which has no controller yet).
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(installing);
          }
        });
      });
    }

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        watchForWaiting(registration);
      } catch {
        // The web app remains fully usable in browsers that reject registration.
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Fires once a user-confirmed update (UpdatePrompt) takes control -
      // reload so the page picks up the new JS/CSS bundle together, rather
      // than running old code against a new SW.
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    window.addEventListener("load", register);

    function checkForUpdate() {
      if (document.visibilityState === "visible") void registration?.update();
    }
    document.addEventListener("visibilitychange", checkForUpdate);
    // A long-lived POS tab might not navigate for hours, and browsers only
    // check for SW updates on navigation by default - poll manually too.
    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

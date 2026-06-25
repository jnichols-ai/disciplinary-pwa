"use client";

import { useEffect, useState } from "react";

// Registers the service worker and watches for a new version becoming
// available. When one is found (e.g. after we ship a deploy), a small
// banner lets the manager force the update immediately instead of having
// to manually clear site data on their phone — which is what used to be
// required to see changes.
export default function RegisterSW() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;

        // A worker may already be sitting in "waiting" if this tab loaded
        // while an update from a previous visit was pending.
        if (reg.waiting) setWaitingWorker(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && reg.waiting) {
              setWaitingWorker(reg.waiting);
            }
          });
        });

        // Ask the browser to re-check for a new sw.js. Covers PWAs that
        // stay open for a long time on a phone without a fresh navigation,
        // which is the main way old code keeps getting served on mobile.
        const checkForUpdate = () => reg.update().catch(() => {});
        const onVisible = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };
        document.addEventListener("visibilitychange", onVisible);
        const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

        return () => {
          document.removeEventListener("visibilitychange", onVisible);
          clearInterval(interval);
        };
      })
      .catch(() => {
        // Non-fatal: app still works without offline support.
      });

    // Once the new worker takes control, reload so the page picks up the
    // new build's HTML/JS rather than running old JS against a new SW.
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waitingWorker) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg">
      <span>A new version of this form is available.</span>
      <button
        type="button"
        className="shrink-0 rounded-md bg-white px-3 py-1.5 font-medium text-neutral-900"
        onClick={() => waitingWorker.postMessage("SKIP_WAITING")}
      >
        Update now
      </button>
    </div>
  );
}

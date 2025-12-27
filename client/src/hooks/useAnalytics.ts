import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined;

let isInitialized = false;

function loadGAScript(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load GA script"));
    document.head.appendChild(script);
  });
}

export async function initializeGA() {
  if (!GA_ID || typeof window === "undefined" || isInitialized) return;

  try {
    await loadGAScript(GA_ID);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      page_path: window.location.pathname,
      send_page_view: false,
    });

    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Google Analytics:", error);
  }
}

export function trackPageView(path: string) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
  });
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

export function useAnalytics() {
  const [location] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initializeGA();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      trackPageView(location);
    }
  }, [location]);

  return { trackEvent, trackPageView };
}

import { useMemo } from "react";

export type Platform = "creator" | "recovery";

const RECOVERY_DOMAINS = [
  "strokerecoveryacademy.com",
  "www.strokerecoveryacademy.com",
];

const CREATOR_DOMAINS = [
  "kreaite.xyz",
  "www.kreaite.xyz",
];

export function usePlatform(): Platform {
  return useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    
    if (RECOVERY_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return "recovery";
    }
    
    return "creator";
  }, []);
}

export function isRecoveryDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return RECOVERY_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function isCreatorDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return CREATOR_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function getPlatformFromHostname(): Platform {
  const hostname = window.location.hostname.toLowerCase();
  
  if (RECOVERY_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return "recovery";
  }
  
  return "creator";
}

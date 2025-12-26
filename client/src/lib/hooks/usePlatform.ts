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

const RECOVERY_KEYWORDS = ["strokerecovery", "sasquatch"];

function isRecoveryHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  
  if (RECOVERY_DOMAINS.some(domain => lowerHostname === domain || lowerHostname.endsWith(`.${domain}`))) {
    return true;
  }
  
  if (RECOVERY_KEYWORDS.some(keyword => lowerHostname.includes(keyword))) {
    return true;
  }
  
  return false;
}

export function usePlatform(): Platform {
  return useMemo(() => {
    const hostname = window.location.hostname;
    
    if (isRecoveryHostname(hostname)) {
      return "recovery";
    }
    
    return "creator";
  }, []);
}

export function isRecoveryDomain(): boolean {
  return isRecoveryHostname(window.location.hostname);
}

export function isCreatorDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return CREATOR_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function getPlatformFromHostname(hostname?: string): Platform {
  const h = hostname || window.location.hostname;
  
  if (isRecoveryHostname(h)) {
    return "recovery";
  }
  
  return "creator";
}

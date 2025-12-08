import { supabase } from '@/integrations/supabase/client';

export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  region: string | null;
  countryName: string | null;
  permissionGranted: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  deviceType: string;
  browserName: string;
  osName: string;
  platform: string;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  userIp: string | null;
  deviceFingerprint: string;
  geoLocation: GeoLocation | null;
}

// Generate a simple hash from a string
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Generate canvas fingerprint
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    canvas.width = 200;
    canvas.height = 50;
    
    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device ID', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint', 4, 17);
    
    return simpleHash(canvas.toDataURL());
  } catch {
    return 'canvas-error';
  }
};

// Get WebGL renderer info
const getWebGLInfo = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    
    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return simpleHash(`${vendor}-${renderer}`);
  } catch {
    return 'webgl-error';
  }
};

// Generate device fingerprint from multiple signals
export const generateDeviceFingerprint = (): string => {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    (window.devicePixelRatio || 1).toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown',
    nav.deviceMemory?.toString() || 'unknown',
    navigator.platform || 'unknown',
    getCanvasFingerprint(),
    getWebGLInfo(),
    // Touch support
    ('ontouchstart' in window).toString(),
    navigator.maxTouchPoints?.toString() || '0',
  ];
  
  const combined = signals.join('|');
  return 'FP-' + simpleHash(combined);
};

// Parse user agent to extract device info
export const parseUserAgent = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Unknown';
  
  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  // Detect browser
  let browserName = 'Unknown';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browserName = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (ua.includes('Edg')) {
    browserName = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browserName = 'Opera';
  }
  
  // Detect OS
  let osName = 'Unknown';
  
  if (ua.includes('Windows')) {
    osName = 'Windows';
  } else if (ua.includes('Mac OS')) {
    osName = 'macOS';
  } else if (ua.includes('Android')) {
    osName = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    osName = 'iOS';
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
  }
  
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  return {
    userAgent: ua,
    deviceType,
    browserName,
    osName,
    platform,
    isMobile,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
};

// Fetch user IP from edge function
export const fetchUserIp = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-user-ip');
    if (error) {
      console.error('Error fetching IP:', error);
      return null;
    }
    return data?.ip || null;
  } catch (error) {
    console.error('Failed to fetch IP:', error);
    return null;
  }
};

// Request geolocation permission and get coordinates
export const requestGeolocation = (): Promise<GeoLocation> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        city: null,
        region: null,
        countryName: null,
        permissionGranted: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to reverse geocode using a free service
        let city = null;
        let region = null;
        let countryName = null;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || null;
          region = data.address?.state || data.address?.county || null;
          countryName = data.address?.country || null;
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
        
        resolve({
          latitude,
          longitude,
          city,
          region,
          countryName,
          permissionGranted: true,
        });
      },
      () => {
        // User denied or error occurred
        resolve({
          latitude: null,
          longitude: null,
          city: null,
          region: null,
          countryName: null,
          permissionGranted: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
};

// Get complete device info including IP, fingerprint, and optional geolocation
export const getDeviceInfo = async (includeGeoLocation = false): Promise<DeviceInfo> => {
  const deviceInfo = parseUserAgent();
  const userIp = await fetchUserIp();
  const deviceFingerprint = generateDeviceFingerprint();
  const geoLocation = includeGeoLocation ? await requestGeolocation() : null;
  
  return {
    ...deviceInfo,
    userIp,
    deviceFingerprint,
    geoLocation,
  };
};

import { supabase } from '@/integrations/supabase/client';

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
}

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

// Get complete device info including IP
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const deviceInfo = parseUserAgent();
  const userIp = await fetchUserIp();
  
  return {
    ...deviceInfo,
    userIp,
  };
};

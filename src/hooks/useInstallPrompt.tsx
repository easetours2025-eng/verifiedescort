import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint, fetchUserIp } from '@/lib/device-utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Parse user agent to extract device info
const parseUserAgent = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Unknown';
  
  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edg')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || '';
  }
  
  // Detect OS
  let osName = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('Windows')) {
    osName = 'Windows';
    osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Mac OS')) {
    osName = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Android')) {
    osName = 'Android';
    osVersion = ua.match(/Android (\d+(?:\.\d+)?)/)?.[1] || '';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    osName = 'iOS';
    osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
  }
  
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  return {
    userAgent: ua,
    deviceType,
    browserName,
    browserVersion,
    osName,
    osVersion,
    platform,
    isMobile,
    isTablet,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const trackInstallation = useCallback(async () => {
    try {
      const deviceInfo = parseUserAgent();
      const referralCode = localStorage.getItem('referralCode');
      
      // Fetch user IP from edge function and generate fingerprint
      const userIp = await fetchUserIp();
      const deviceFingerprint = generateDeviceFingerprint();
      
      // Get user session if available
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('app_installations').insert({
        user_ip: userIp,
        user_agent: deviceInfo.userAgent,
        device_type: deviceInfo.deviceType,
        browser_name: deviceInfo.browserName,
        browser_version: deviceInfo.browserVersion,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
        screen_width: deviceInfo.screenWidth,
        screen_height: deviceInfo.screenHeight,
        platform: deviceInfo.platform,
        language: deviceInfo.language,
        timezone: deviceInfo.timezone,
        is_mobile: deviceInfo.isMobile,
        is_tablet: deviceInfo.isTablet,
        user_id: session?.user?.id || null,
        referral_code: referralCode || null,
        device_fingerprint: deviceFingerprint,
      });
      
      console.log('App installation tracked with fingerprint:', deviceFingerprint);
    } catch (error) {
      console.error('Failed to track installation:', error);
    }
  }, []);

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      // Track the installation when app is installed
      trackInstallation();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [trackInstallation]);

  const promptInstall = async () => {
    if (!installPrompt) {
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    promptInstall,
  };
};

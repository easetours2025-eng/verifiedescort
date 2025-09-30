import { supabase } from '@/integrations/supabase/client';

export interface CelebrityProfile {
  id: string;
  user_id: string;
  stage_name: string;
  real_name?: string;
  bio?: string;
  phone_number?: string;
  email?: string;
  location?: string;
  gender?: string;
  age?: number;
  date_of_birth?: string;
  base_price: number;
  hourly_rate?: number;
  social_instagram?: string;
  social_twitter?: string;
  social_tiktok?: string;
  is_verified: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profile_picture_path?: string;
}

export interface PublicCelebrityProfile {
  id: string;
  stage_name: string;
  bio?: string;
  location?: string; // Only city/state, not full address
  gender?: string;
  age?: number;
  base_price: number;
  hourly_rate?: number;
  social_instagram?: string;
  social_twitter?: string;
  social_tiktok?: string;
  is_verified: boolean;
  is_available: boolean;
  created_at: string;
  profile_picture_path?: string;
}

export interface PrivateCelebrityProfile extends PublicCelebrityProfile {
  user_id: string;
  real_name?: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  updated_at: string;
}

/**
 * Check if the current user can access sensitive celebrity data
 */
export const canAccessSensitiveData = async (celebrityUserId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if user is the celebrity themselves
    if (user.id === celebrityUserId) {
      return true;
    }
    
    // Check if user is an admin using the database function
    const { data, error } = await supabase.rpc('is_current_user_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in canAccessSensitiveData:', error);
    return false;
  }
};

/**
 * Filter celebrity profile data based on user permissions
 * Now returns all data as public since authorization is removed
 */
export const filterCelebrityData = async (
  profile: CelebrityProfile
): Promise<PrivateCelebrityProfile> => {
  // Return all data for everyone
  return profile as PrivateCelebrityProfile;
};

/**
 * Sanitize location to only show city/state, not full address
 */
const sanitizeLocation = (location: string): string => {
  // Split by comma and take only the first two parts (city, state)
  const parts = location.split(',').map(part => part.trim());
  return parts.slice(0, 2).join(', ');
};

/**
 * Check if profile data contains sensitive information
 */
export const isPrivateProfile = (
  profile: PublicCelebrityProfile | PrivateCelebrityProfile
): profile is PrivateCelebrityProfile => {
  return 'real_name' in profile || 'phone_number' in profile || 'email' in profile;
};

/**
 * Filter array of celebrity profiles
 * Now returns all data as public
 */
export const filterCelebrityDataArray = async (
  profiles: CelebrityProfile[]
): Promise<PrivateCelebrityProfile[]> => {
  const filteredProfiles = await Promise.all(
    profiles.map(profile => filterCelebrityData(profile))
  );
  
  return filteredProfiles;
};
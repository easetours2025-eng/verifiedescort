// Subscription tier feature definitions and helpers

export interface TierFeatures {
  tier: string;
  media_upload_limit: number;
  has_advanced_analytics: boolean;
  has_analytics_dashboard: boolean;
  has_basic_analytics: boolean;
  has_profile_verification: boolean;
  has_social_media_promotion: boolean;
  has_marketing_campaigns: boolean;
  has_priority_support_24_7: boolean;
  has_priority_support_business: boolean;
  has_email_support: boolean;
  homepage_position: 'spotlight' | 'prominent' | 'standard' | 'basic';
  badge_type: 'vip_elite' | 'prime_plus' | 'basic_pro' | 'starter';
  has_featured_category: boolean;
  has_search_optimization: boolean;
  has_quality_traffic_optimization: boolean;
  profile_boost_per_week: number;
}

export const TIER_FEATURES: Record<string, TierFeatures> = {
  vip_elite: {
    tier: 'vip_elite',
    media_upload_limit: -1, // unlimited
    has_advanced_analytics: true,
    has_analytics_dashboard: true,
    has_basic_analytics: true,
    has_profile_verification: true,
    has_social_media_promotion: true,
    has_marketing_campaigns: true,
    has_priority_support_24_7: true,
    has_priority_support_business: false,
    has_email_support: true,
    homepage_position: 'spotlight',
    badge_type: 'vip_elite',
    has_featured_category: true,
    has_search_optimization: true,
    has_quality_traffic_optimization: true,
    profile_boost_per_week: -1, // unlimited
  },
  prime_plus: {
    tier: 'prime_plus',
    media_upload_limit: 10,
    has_advanced_analytics: false,
    has_analytics_dashboard: true,
    has_basic_analytics: true,
    has_profile_verification: false,
    has_social_media_promotion: true,
    has_marketing_campaigns: false,
    has_priority_support_24_7: false,
    has_priority_support_business: true,
    has_email_support: true,
    homepage_position: 'prominent',
    badge_type: 'prime_plus',
    has_featured_category: true,
    has_search_optimization: true,
    has_quality_traffic_optimization: true,
    profile_boost_per_week: 2,
  },
  basic_pro: {
    tier: 'basic_pro',
    media_upload_limit: 5,
    has_advanced_analytics: false,
    has_analytics_dashboard: false,
    has_basic_analytics: true,
    has_profile_verification: false,
    has_social_media_promotion: false,
    has_marketing_campaigns: false,
    has_priority_support_24_7: false,
    has_priority_support_business: false,
    has_email_support: true,
    homepage_position: 'standard',
    badge_type: 'basic_pro',
    has_featured_category: false,
    has_search_optimization: true,
    has_quality_traffic_optimization: false,
    profile_boost_per_week: 1,
  },
  starter: {
    tier: 'starter',
    media_upload_limit: 3,
    has_advanced_analytics: false,
    has_analytics_dashboard: false,
    has_basic_analytics: false,
    has_profile_verification: false,
    has_social_media_promotion: false,
    has_marketing_campaigns: false,
    has_priority_support_24_7: false,
    has_priority_support_business: false,
    has_email_support: true,
    homepage_position: 'basic',
    badge_type: 'starter',
    has_featured_category: false,
    has_search_optimization: false,
    has_quality_traffic_optimization: false,
    profile_boost_per_week: 0,
  },
};

export const DEFAULT_FEATURES: TierFeatures = {
  tier: 'free',
  media_upload_limit: 1,
  has_advanced_analytics: false,
  has_analytics_dashboard: false,
  has_basic_analytics: false,
  has_profile_verification: false,
  has_social_media_promotion: false,
  has_marketing_campaigns: false,
  has_priority_support_24_7: false,
  has_priority_support_business: false,
  has_email_support: false,
  homepage_position: 'basic',
  badge_type: 'starter',
  has_featured_category: false,
  has_search_optimization: false,
  has_quality_traffic_optimization: false,
  profile_boost_per_week: 0,
};

/**
 * Get features for a subscription tier
 */
export function getTierFeatures(tier: string | null | undefined): TierFeatures {
  if (!tier) return DEFAULT_FEATURES;
  return TIER_FEATURES[tier] || DEFAULT_FEATURES;
}

/**
 * Check if user can upload more media
 */
export function canUploadMedia(currentCount: number, tier: string | null | undefined): boolean {
  const features = getTierFeatures(tier);
  if (features.media_upload_limit === -1) return true; // unlimited
  return currentCount < features.media_upload_limit;
}

/**
 * Get remaining media uploads
 */
export function getRemainingUploads(currentCount: number, tier: string | null | undefined): number {
  const features = getTierFeatures(tier);
  if (features.media_upload_limit === -1) return -1; // unlimited
  return Math.max(0, features.media_upload_limit - currentCount);
}

/**
 * Get badge display info
 */
export function getBadgeInfo(tier: string | null | undefined) {
  const features = getTierFeatures(tier);
  
  const badges = {
    vip_elite: {
      label: 'VIP Elite',
      color: 'from-yellow-500 to-amber-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    prime_plus: {
      label: 'Prime Plus',
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    basic_pro: {
      label: 'Basic Pro',
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    starter: {
      label: 'Starter',
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  };

  return badges[features.badge_type];
}

/**
 * Get support type description
 */
export function getSupportType(tier: string | null | undefined): string {
  const features = getTierFeatures(tier);
  
  if (features.has_priority_support_24_7) return 'Priority Support (24/7)';
  if (features.has_priority_support_business) return 'Priority Support (Business Hours)';
  if (features.has_email_support) return 'Email Support';
  return 'No Support';
}

/**
 * Check if tier has specific feature
 */
export function hasFeature(tier: string | null | undefined, feature: keyof TierFeatures): boolean {
  const features = getTierFeatures(tier);
  return Boolean(features[feature]);
}

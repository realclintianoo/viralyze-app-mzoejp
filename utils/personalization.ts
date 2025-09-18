
import { OnboardingData } from '../types';
import { colors } from '../styles/commonStyles';

export interface PersonalizationTheme {
  primary: string;
  secondary: string;
  glow: string;
  gradient: string[];
  emoji: string;
}

export interface FollowerTier {
  id: string;
  label: string;
  min: number;
  max: number;
  badge: string;
  color: string;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  gradient: string[];
}

export const NICHE_THEMES: Record<string, PersonalizationTheme> = {
  fitness: {
    primary: colors.neonGreen,
    secondary: '#16A34A',
    glow: colors.glowNeonGreen,
    gradient: [colors.neonGreen, '#16A34A'],
    emoji: '💪',
  },
  tech: {
    primary: colors.neonBlue,
    secondary: '#2563EB',
    glow: 'rgba(0, 128, 255, 0.8)',
    gradient: [colors.neonBlue, '#2563EB'],
    emoji: '💻',
  },
  fashion: {
    primary: colors.neonPink,
    secondary: '#BE185D',
    glow: 'rgba(255, 0, 255, 0.8)',
    gradient: [colors.neonPink, colors.neonPurple],
    emoji: '👗',
  },
  music: {
    primary: '#F59E0B',
    secondary: '#D97706',
    glow: 'rgba(245, 158, 11, 0.8)',
    gradient: ['#F59E0B', '#EAB308'],
    emoji: '🎵',
  },
  food: {
    primary: '#EF4444',
    secondary: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.8)',
    gradient: ['#EF4444', '#F97316'],
    emoji: '🍕',
  },
  beauty: {
    primary: colors.neonPink,
    secondary: '#EC4899',
    glow: 'rgba(255, 0, 255, 0.8)',
    gradient: [colors.neonPink, '#EC4899'],
    emoji: '💄',
  },
  travel: {
    primary: colors.neonTeal,
    secondary: '#0891B2',
    glow: colors.glowNeonTeal,
    gradient: [colors.neonTeal, '#0891B2'],
    emoji: '✈️',
  },
  gaming: {
    primary: colors.neonPurple,
    secondary: '#7C3AED',
    glow: colors.glowNeonPurple,
    gradient: [colors.neonPurple, '#7C3AED'],
    emoji: '🎮',
  },
  business: {
    primary: colors.neonGreen,
    secondary: '#059669',
    glow: colors.glowNeonGreen,
    gradient: [colors.neonGreen, '#059669'],
    emoji: '💼',
  },
  lifestyle: {
    primary: '#F97316',
    secondary: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.8)',
    gradient: ['#F97316', '#EA580C'],
    emoji: '🌟',
  },
  comedy: {
    primary: '#FBBF24',
    secondary: '#F59E0B',
    glow: 'rgba(251, 191, 36, 0.8)',
    gradient: ['#FBBF24', '#F59E0B'],
    emoji: '😂',
  },
  default: {
    primary: colors.neonTeal,
    secondary: colors.neonGreen,
    glow: colors.glowNeonTeal,
    gradient: [colors.neonTeal, colors.neonGreen],
    emoji: '🚀',
  },
};

export const FOLLOWER_TIERS: FollowerTier[] = [
  {
    id: 'starter',
    label: 'Starter',
    min: 0,
    max: 1000,
    badge: '🌱',
    color: '#22C55E',
  },
  {
    id: 'rising',
    label: 'Rising Star',
    min: 1000,
    max: 10000,
    badge: '⭐',
    color: '#F59E0B',
  },
  {
    id: 'influencer',
    label: 'Influencer',
    min: 10000,
    max: 100000,
    badge: '🔥',
    color: '#EF4444',
  },
  {
    id: 'creator',
    label: 'Top Creator',
    min: 100000,
    max: 1000000,
    badge: '👑',
    color: '#8B5CF6',
  },
  {
    id: 'superstar',
    label: 'Superstar',
    min: 1000000,
    max: Infinity,
    badge: '💎',
    color: '#06B6D4',
  },
];

export const getPersonalizationTheme = (niche?: string): PersonalizationTheme => {
  if (!niche) return NICHE_THEMES.default;
  
  const normalizedNiche = niche.toLowerCase();
  
  // Check for exact matches first
  if (NICHE_THEMES[normalizedNiche]) {
    return NICHE_THEMES[normalizedNiche];
  }
  
  // Check for partial matches
  for (const [key, theme] of Object.entries(NICHE_THEMES)) {
    if (normalizedNiche.includes(key) || key.includes(normalizedNiche)) {
      return theme;
    }
  }
  
  return NICHE_THEMES.default;
};

export const getFollowerTier = (followers: number): FollowerTier => {
  for (const tier of FOLLOWER_TIERS) {
    if (followers >= tier.min && followers < tier.max) {
      return tier;
    }
  }
  return FOLLOWER_TIERS[FOLLOWER_TIERS.length - 1]; // Return highest tier if above all ranges
};

export const formatFollowers = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const getPersonalizedWelcomeMessage = (profile: OnboardingData | null, username?: string): string => {
  if (!profile) {
    return `Welcome back${username ? `, ${username}` : ''} 👋`;
  }
  
  const theme = getPersonalizationTheme(profile.niche);
  const displayName = username || 'Creator';
  
  return `Welcome back, ${displayName} 👋 — Your journey as a ${profile.niche || 'Content'} creator continues!`;
};

export const getPersonalizedRecommendations = (profile: OnboardingData | null): string[] => {
  if (!profile) {
    return [
      'Complete your profile to get personalized recommendations',
      'Start with our Hook Generator for engaging content',
      'Try the Script Generator for video content',
    ];
  }
  
  const niche = profile.niche?.toLowerCase() || '';
  const tier = getFollowerTier(profile.followers);
  
  const recommendations: string[] = [];
  
  // Niche-specific recommendations
  if (niche.includes('fitness')) {
    recommendations.push(
      'Create workout routine scripts for your audience',
      'Generate motivational fitness hooks',
      'Plan weekly fitness challenge content'
    );
  } else if (niche.includes('tech')) {
    recommendations.push(
      'Write tech review scripts and tutorials',
      'Create hooks about latest tech trends',
      'Plan educational tech content calendar'
    );
  } else if (niche.includes('fashion')) {
    recommendations.push(
      'Generate outfit inspiration captions',
      'Create fashion trend hooks',
      'Plan seasonal fashion content'
    );
  } else if (niche.includes('food')) {
    recommendations.push(
      'Create recipe video scripts',
      'Generate food photography captions',
      'Plan weekly cooking content'
    );
  } else if (niche.includes('music')) {
    recommendations.push(
      'Write music review and reaction scripts',
      'Create hooks about music trends',
      'Plan music discovery content'
    );
  } else if (niche.includes('comedy')) {
    recommendations.push(
      'Create Comedy content that resonates',
      'Generate hooks for Comedy audience',
      'Plan consistent Comedy content calendar'
    );
  } else {
    recommendations.push(
      `Create ${profile.niche} content that resonates`,
      `Generate hooks for ${profile.niche} audience`,
      `Plan consistent ${profile.niche} content calendar`
    );
  }
  
  // Tier-specific recommendations
  if (tier.id === 'starter') {
    recommendations.push(
      'Focus on consistent posting to grow your audience',
      'Use trending hashtags to increase visibility'
    );
  } else if (tier.id === 'rising') {
    recommendations.push(
      'Engage with your community to build loyalty',
      'Consider collaborations with similar creators'
    );
  } else if (tier.id === 'influencer') {
    recommendations.push(
      'Explore monetization opportunities',
      'Create exclusive content for your top followers'
    );
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
};

export const getPersonalizedChatContext = (profile: OnboardingData | null): string => {
  if (!profile) {
    return 'User is a content creator. Provide general social media growth advice.';
  }
  
  const tier = getFollowerTier(profile.followers);
  
  return `User is a ${profile.niche || 'content'} creator with ${formatFollowers(profile.followers)} followers (${tier.label} tier). Their goal is: ${profile.goal || 'to grow their audience'}. Tailor advice, tone, and examples to match their niche and follower level. Reference their specific niche naturally in responses and provide actionable advice appropriate for their tier.`;
};

export const getNicheEmoji = (niche?: string): string => {
  if (!niche) return '🚀';
  
  const theme = getPersonalizationTheme(niche);
  return theme.emoji;
};

export const getPersonalizedQuickActions = (profile: OnboardingData | null): QuickAction[] => {
  const baseActions: QuickAction[] = [
    { 
      id: 'hooks', 
      title: 'Hooks', 
      icon: 'fish-outline',
      gradient: [colors.neonGreen, colors.neonTeal]
    },
    { 
      id: 'ideas', 
      title: 'Ideas', 
      icon: 'bulb-outline',
      gradient: [colors.neonTeal, colors.neonPurple]
    },
    { 
      id: 'captions', 
      title: 'Captions', 
      icon: 'create-outline',
      gradient: [colors.neonPurple, colors.neonPink]
    },
  ];
  
  if (!profile) return baseActions;
  
  const niche = profile.niche?.toLowerCase() || '';
  const theme = getPersonalizationTheme(profile.niche);
  
  // Customize actions based on niche with enhanced titles
  if (niche.includes('fitness')) {
    return [
      { 
        id: 'hooks', 
        title: 'Workout Hooks', 
        icon: 'fitness-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Fitness Ideas', 
        icon: 'barbell-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Motivation', 
        icon: 'flame-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('tech')) {
    return [
      { 
        id: 'hooks', 
        title: 'Tech Hooks', 
        icon: 'laptop-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Tech Reviews', 
        icon: 'phone-portrait-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Tutorials', 
        icon: 'construct-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('food')) {
    return [
      { 
        id: 'hooks', 
        title: 'Recipe Hooks', 
        icon: 'restaurant-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Food Ideas', 
        icon: 'pizza-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Food Captions', 
        icon: 'camera-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('fashion')) {
    return [
      { 
        id: 'hooks', 
        title: 'Style Hooks', 
        icon: 'shirt-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Fashion Ideas', 
        icon: 'sparkles-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Outfit Posts', 
        icon: 'camera-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('music')) {
    return [
      { 
        id: 'hooks', 
        title: 'Music Hooks', 
        icon: 'musical-notes-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Song Reviews', 
        icon: 'headset-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Music Posts', 
        icon: 'mic-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('travel')) {
    return [
      { 
        id: 'hooks', 
        title: 'Travel Hooks', 
        icon: 'airplane-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Trip Ideas', 
        icon: 'map-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Travel Posts', 
        icon: 'location-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('business')) {
    return [
      { 
        id: 'hooks', 
        title: 'Biz Hooks', 
        icon: 'briefcase-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Growth Tips', 
        icon: 'trending-up-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Pro Content', 
        icon: 'target-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('lifestyle')) {
    return [
      { 
        id: 'hooks', 
        title: 'Life Hooks', 
        icon: 'star-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Daily Ideas', 
        icon: 'sunny-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Life Posts', 
        icon: 'sparkles-outline',
        gradient: theme.gradient
      },
    ];
  } else if (niche.includes('comedy')) {
    return [
      { 
        id: 'hooks', 
        title: 'Comedy Hooks', 
        icon: 'happy-outline',
        gradient: theme.gradient
      },
      { 
        id: 'ideas', 
        title: 'Funny Ideas', 
        icon: 'chatbubble-ellipses-outline',
        gradient: theme.gradient
      },
      { 
        id: 'captions', 
        title: 'Humor Posts', 
        icon: 'thumbs-up-outline',
        gradient: theme.gradient
      },
    ];
  }
  
  return baseActions;
};

// Gamification utilities
export const calculateUserLevel = (totalGenerated: number): { level: number; title: string; nextLevelAt: number } => {
  const levels = [
    { level: 1, title: 'Starter', min: 0, max: 10 },
    { level: 2, title: 'Rising Star', min: 10, max: 50 },
    { level: 3, title: 'Influencer', min: 50, max: 150 },
    { level: 4, title: 'Top Creator', min: 150, max: 500 },
    { level: 5, title: 'Legend', min: 500, max: Infinity },
  ];

  for (const levelData of levels) {
    if (totalGenerated >= levelData.min && totalGenerated < levelData.max) {
      return {
        level: levelData.level,
        title: levelData.title,
        nextLevelAt: levelData.max === Infinity ? levelData.min : levelData.max,
      };
    }
  }

  return levels[levels.length - 1];
};

export const getAvailableBadges = () => [
  {
    id: 'first_hook',
    title: 'Hook Master',
    description: 'Generated your first viral hook',
    icon: '🎣',
    color: colors.neonGreen,
    requirement: 'Generate 1 hook',
  },
  {
    id: 'content_creator',
    title: 'Content Creator',
    description: 'Generated 10 pieces of content',
    icon: '📝',
    color: colors.neonTeal,
    requirement: 'Generate 10 items',
  },
  {
    id: 'streak_warrior',
    title: 'Streak Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    color: colors.streakFire,
    requirement: '7-day streak',
  },
  {
    id: 'viral_master',
    title: 'Viral Master',
    description: 'Generated 100 pieces of content',
    icon: '🚀',
    color: colors.neonPurple,
    requirement: 'Generate 100 items',
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Used the app for 30 days',
    icon: '👑',
    color: colors.levelGold,
    requirement: '30 active days',
  },
];

export const checkStreakStatus = (lastActiveDate: string): { streak: number; isActive: boolean } => {
  const today = new Date();
  const lastActive = new Date(lastActiveDate);
  const diffTime = Math.abs(today.getTime() - lastActive.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    // Streak is active
    return { streak: diffDays === 0 ? 1 : diffDays, isActive: true };
  } else {
    // Streak is broken
    return { streak: 0, isActive: false };
  }
};

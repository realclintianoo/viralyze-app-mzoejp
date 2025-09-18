
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

export const NICHE_THEMES: Record<string, PersonalizationTheme> = {
  fitness: {
    primary: '#22C55E',
    secondary: '#16A34A',
    glow: 'rgba(34, 197, 94, 0.6)',
    gradient: ['#22C55E', '#16A34A'],
    emoji: '💪',
  },
  tech: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.6)',
    gradient: ['#3B82F6', '#2563EB'],
    emoji: '💻',
  },
  fashion: {
    primary: '#EC4899',
    secondary: '#BE185D',
    glow: 'rgba(236, 72, 153, 0.6)',
    gradient: ['#EC4899', '#A855F7'],
    emoji: '👗',
  },
  music: {
    primary: '#F59E0B',
    secondary: '#D97706',
    glow: 'rgba(245, 158, 11, 0.6)',
    gradient: ['#F59E0B', '#EAB308'],
    emoji: '🎵',
  },
  food: {
    primary: '#EF4444',
    secondary: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.6)',
    gradient: ['#EF4444', '#F97316'],
    emoji: '🍕',
  },
  beauty: {
    primary: '#F472B6',
    secondary: '#EC4899',
    glow: 'rgba(244, 114, 182, 0.6)',
    gradient: ['#F472B6', '#EC4899'],
    emoji: '💄',
  },
  travel: {
    primary: '#06B6D4',
    secondary: '#0891B2',
    glow: 'rgba(6, 182, 212, 0.6)',
    gradient: ['#06B6D4', '#0891B2'],
    emoji: '✈️',
  },
  gaming: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.6)',
    gradient: ['#8B5CF6', '#7C3AED'],
    emoji: '🎮',
  },
  business: {
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.6)',
    gradient: ['#10B981', '#059669'],
    emoji: '💼',
  },
  lifestyle: {
    primary: '#F97316',
    secondary: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.6)',
    gradient: ['#F97316', '#EA580C'],
    emoji: '🌟',
  },
  default: {
    primary: colors.accent,
    secondary: colors.gradientEnd,
    glow: colors.glowTeal,
    gradient: [colors.gradientStart, colors.gradientEnd],
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

export const getPersonalizedQuickActions = (profile: OnboardingData | null) => {
  const baseActions = [
    { id: 'hooks', title: 'Hooks', icon: '🎣' },
    { id: 'ideas', title: 'Ideas', icon: '💡' },
    { id: 'captions', title: 'Captions', icon: '✍️' },
  ];
  
  if (!profile) return baseActions;
  
  const niche = profile.niche?.toLowerCase() || '';
  
  // Customize actions based on niche
  if (niche.includes('fitness')) {
    return [
      { id: 'hooks', title: 'Workout Hooks', icon: '💪' },
      { id: 'ideas', title: 'Fitness Ideas', icon: '🏋️' },
      { id: 'captions', title: 'Motivation', icon: '🔥' },
    ];
  } else if (niche.includes('tech')) {
    return [
      { id: 'hooks', title: 'Tech Hooks', icon: '💻' },
      { id: 'ideas', title: 'Tech Reviews', icon: '📱' },
      { id: 'captions', title: 'Tutorials', icon: '🛠️' },
    ];
  } else if (niche.includes('food')) {
    return [
      { id: 'hooks', title: 'Recipe Hooks', icon: '🍳' },
      { id: 'ideas', title: 'Food Ideas', icon: '🍕' },
      { id: 'captions', title: 'Food Captions', icon: '📸' },
    ];
  } else if (niche.includes('fashion')) {
    return [
      { id: 'hooks', title: 'Style Hooks', icon: '👗' },
      { id: 'ideas', title: 'Fashion Ideas', icon: '✨' },
      { id: 'captions', title: 'Outfit Posts', icon: '📷' },
    ];
  } else if (niche.includes('music')) {
    return [
      { id: 'hooks', title: 'Music Hooks', icon: '🎵' },
      { id: 'ideas', title: 'Song Reviews', icon: '🎧' },
      { id: 'captions', title: 'Music Posts', icon: '🎤' },
    ];
  } else if (niche.includes('travel')) {
    return [
      { id: 'hooks', title: 'Travel Hooks', icon: '✈️' },
      { id: 'ideas', title: 'Trip Ideas', icon: '🗺️' },
      { id: 'captions', title: 'Travel Posts', icon: '📍' },
    ];
  } else if (niche.includes('business')) {
    return [
      { id: 'hooks', title: 'Biz Hooks', icon: '💼' },
      { id: 'ideas', title: 'Growth Tips', icon: '📈' },
      { id: 'captions', title: 'Pro Content', icon: '🎯' },
    ];
  } else if (niche.includes('lifestyle')) {
    return [
      { id: 'hooks', title: 'Life Hooks', icon: '🌟' },
      { id: 'ideas', title: 'Daily Ideas', icon: '☀️' },
      { id: 'captions', title: 'Life Posts', icon: '💫' },
    ];
  }
  
  return baseActions;
};

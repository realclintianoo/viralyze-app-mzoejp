
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  background: '#0B0F14',
  backgroundSecondary: '#151B23',
  backgroundTertiary: '#1A1F26',
  text: '#E6EAF0',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  
  // Premium gradient colors - Enhanced with teal/cyan
  primary: '#22C55E',
  accent: '#22C55E',
  gradientStart: '#22C55E',
  gradientEnd: '#06B6D4', // Teal accent
  gradientAccent: '#0891B2',
  
  // Premium teal variants
  tealPrimary: '#06B6D4',
  tealSecondary: '#0891B2',
  tealTertiary: '#0E7490',
  
  // Enhanced glass colors
  card: '#1A1F26',
  cardGlass: 'rgba(26, 31, 38, 0.6)',
  border: '#2A2F36',
  borderGlow: 'rgba(34, 197, 94, 0.3)',
  
  grey: '#6B7280',
  lightGrey: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  
  // Premium tool-specific gradients with teal accents
  hookGradient: ['#F59E0B', '#06B6D4'], // Orange to teal
  captionGradient: ['#8B5CF6', '#06B6D4'], // Purple to teal
  calendarGradient: ['#06B6D4', '#22C55E'], // Teal to green
  rewriterGradient: ['#EC4899', '#06B6D4'], // Pink to teal
  scriptGradient: ['#22C55E', '#0891B2'], // Green to teal
  guardianGradient: ['#EF4444', '#F59E0B'], // Red to orange
  imageGradient: ['#10B981', '#06B6D4'], // Emerald to teal
  
  // Enhanced glassmorphism colors
  glassBackground: 'rgba(26, 31, 38, 0.4)',
  glassBackgroundStrong: 'rgba(26, 31, 38, 0.7)',
  glassBackgroundUltra: 'rgba(26, 31, 38, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.12)',
  glassBorderUltra: 'rgba(255, 255, 255, 0.16)',
  
  // Premium neumorphism colors
  neuLight: '#2A2F36',
  neuDark: '#0F1419',
  neuHighlight: 'rgba(255, 255, 255, 0.03)',
  neuShadow: 'rgba(0, 0, 0, 0.4)',
  
  // Enhanced glow effects
  glowPrimary: 'rgba(34, 197, 94, 0.5)',
  glowSecondary: 'rgba(6, 182, 212, 0.4)',
  glowTertiary: 'rgba(34, 197, 94, 0.2)',
  glowTeal: 'rgba(6, 182, 212, 0.6)',
  
  // Status colors
  statusOnline: '#22C55E',
  statusWarning: '#F59E0B',
  statusError: '#EF4444',
  statusInfo: '#06B6D4',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Premium Typography
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.2,
    textShadowColor: colors.glowTeal,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontWeight: '500',
  },
  textBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  textLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  textSmall: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Premium Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Premium Cards and containers
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  
  glassCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: 28,
    padding: 24,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
  },
  
  premiumCard: {
    backgroundColor: colors.glassBackgroundStrong,
    borderRadius: 28,
    padding: 28,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 24,
  },
  
  ultraCard: {
    backgroundColor: colors.glassBackgroundUltra,
    borderRadius: 32,
    padding: 32,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorderUltra,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 28,
  },
  
  neuCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 28,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 16,
  },
  
  // Premium Buttons
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  
  premiumButton: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glowTeal,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 2,
    borderColor: colors.glassBorderUltra,
  },
  
  secondaryButton: {
    backgroundColor: colors.glassBackgroundStrong,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  
  // Premium Input
  input: {
    backgroundColor: colors.glassBackgroundStrong,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    fontWeight: '500',
  },
  
  premiumInput: {
    backgroundColor: colors.glassBackgroundUltra,
    borderWidth: 2,
    borderColor: colors.glassBorderUltra,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 20,
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
    fontWeight: '600',
  },
  
  // Premium Chips
  chip: {
    backgroundColor: colors.glassBackgroundStrong,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 32,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  chipSelected: {
    backgroundColor: 'transparent',
    borderColor: colors.glassBorderUltra,
    borderWidth: 2,
    shadowColor: colors.glowTeal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  
  // Premium effects
  glowEffect: {
    shadowColor: colors.glowTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 20,
  },
  
  strongGlowEffect: {
    shadowColor: colors.glowTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 32,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  // Premium tool card styles
  toolCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  
  toolCardContent: {
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    position: 'relative',
  },
  
  // Status indicators
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Premium animations
  scaleAnimation: {
    transform: [{ scale: 1 }],
  },
  
  // Grid layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  
  gridItem: {
    width: '48%',
    marginBottom: 20,
  },
  
  // Persistent card styles
  persistentCard: {
    backgroundColor: colors.glassBackgroundUltra,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorderUltra,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 24,
    minHeight: 160,
  },
  
  // Usage counter styles
  usageCounter: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: colors.glowTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  
  usageCounterText: {
    color: colors.tealPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

// Enhanced animation configurations
export const animations = {
  // Timing durations
  ultraFast: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  ultraSlow: 600,
  
  // Premium spring animation configs
  spring: {
    tension: 350,
    friction: 18,
  },
  
  bounce: {
    tension: 450,
    friction: 6,
  },
  
  gentle: {
    tension: 250,
    friction: 28,
  },
  
  snappy: {
    tension: 550,
    friction: 12,
  },
  
  premium: {
    tension: 400,
    friction: 15,
  },
  
  // Enhanced spring configs (stiffness/damping based)
  springStiffness: {
    stiffness: 350,
    damping: 18,
    mass: 0.8,
  },
  
  bounceStiffness: {
    stiffness: 450,
    damping: 6,
    mass: 0.6,
  },
  
  gentleStiffness: {
    stiffness: 250,
    damping: 28,
    mass: 1.2,
  },
  
  premiumStiffness: {
    stiffness: 400,
    damping: 15,
    mass: 0.9,
  },
  
  // Easing curves for timing animations
  easeInOut: 'easeInOut',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  
  // Premium timing functions
  premiumEaseOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  premiumEaseIn: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
  premiumEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
};

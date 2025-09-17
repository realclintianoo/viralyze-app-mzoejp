
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  background: '#0B0F14',
  backgroundSecondary: '#151B23',
  backgroundTertiary: '#1A1F26',
  text: '#E6EAF0',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  primary: '#22C55E',
  accent: '#22C55E',
  card: '#1A1F26',
  cardGlass: 'rgba(26, 31, 38, 0.8)',
  border: '#2A2F36',
  borderGlow: 'rgba(34, 197, 94, 0.3)',
  grey: '#6B7280',
  lightGrey: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  
  // Premium gradient colors
  gradientStart: '#22C55E',
  gradientEnd: '#16A34A',
  gradientAccent: '#059669',
  
  // Tool-specific gradients
  hookGradient: ['#F59E0B', '#D97706'],
  captionGradient: ['#8B5CF6', '#7C3AED'],
  calendarGradient: ['#06B6D4', '#0891B2'],
  rewriterGradient: ['#EC4899', '#DB2777'],
  scriptGradient: ['#22C55E', '#16A34A'],
  guardianGradient: ['#EF4444', '#DC2626'],
  imageGradient: ['#10B981', '#059669'],
  
  // Glassmorphism colors
  glassBackground: 'rgba(26, 31, 38, 0.6)',
  glassBackgroundStrong: 'rgba(26, 31, 38, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.15)',
  
  // Neumorphism colors
  neuLight: '#2A2F36',
  neuDark: '#0F1419',
  neuHighlight: 'rgba(255, 255, 255, 0.05)',
  neuShadow: 'rgba(0, 0, 0, 0.3)',
  
  // Glow effects
  glowPrimary: 'rgba(34, 197, 94, 0.4)',
  glowSecondary: 'rgba(34, 197, 94, 0.2)',
  glowTertiary: 'rgba(34, 197, 94, 0.1)',
  
  // Status colors
  statusOnline: '#22C55E',
  statusWarning: '#F59E0B',
  statusError: '#EF4444',
  statusInfo: '#3B82F6',
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
  
  // Typography - Premium
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.8,
    textShadowColor: colors.glowPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
    letterSpacing: -0.2,
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
  
  // Header - Premium
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Cards and containers - Premium
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  
  glassCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  
  premiumCard: {
    backgroundColor: colors.glassBackgroundStrong,
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  
  neuCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  
  // Buttons - Premium
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  premiumButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 2,
    borderColor: colors.glassBorderStrong,
  },
  
  secondaryButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Input - Premium
  input: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    fontWeight: '500',
  },
  
  premiumInput: {
    backgroundColor: colors.glassBackgroundStrong,
    borderWidth: 2,
    borderColor: colors.glassBorderStrong,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    fontWeight: '600',
  },
  
  // Chips - Premium
  chip: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  
  // Premium effects
  glowEffect: {
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
  },
  
  strongGlowEffect: {
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 24,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  // Tool card specific styles
  toolCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  
  toolCardContent: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    position: 'relative',
  },
  
  // Status indicators
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
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
    marginBottom: 16,
  },
  
  // Persistent card styles
  persistentCard: {
    backgroundColor: colors.glassBackgroundStrong,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    shadowColor: colors.neuDark,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    minHeight: 140,
  },
  
  // Usage counter styles
  usageCounter: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  
  usageCounterText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// Animation configurations
export const animations = {
  // Spring animation config
  spring: {
    tension: 300,
    friction: 20,
    mass: 1,
  },
  
  // Timing durations
  fast: 150,
  normal: 250,
  slow: 400,
  
  // Easing curves
  easeInOut: 'easeInOut',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  
  // Common animation presets
  bounce: {
    tension: 400,
    friction: 8,
    mass: 1,
  },
  
  gentle: {
    tension: 200,
    friction: 25,
    mass: 1,
  },
  
  snappy: {
    tension: 500,
    friction: 15,
    mass: 0.8,
  },
};


import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  background: '#0B0F14',
  backgroundSecondary: '#151B23',
  text: '#E6EAF0',
  textSecondary: '#9CA3AF',
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
  
  // Glassmorphism colors
  glassBackground: 'rgba(26, 31, 38, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Neumorphism colors
  neuLight: '#2A2F36',
  neuDark: '#0F1419',
  
  // Glow effects
  glowPrimary: 'rgba(34, 197, 94, 0.4)',
  glowSecondary: 'rgba(34, 197, 94, 0.2)',
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
  
  // Typography
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  textBold: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  textLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 26,
  },
  textSmall: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  smallText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Cards and containers
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  glassCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  
  neuCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    shadowColor: colors.neuDark,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Buttons
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Input
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
  },
  
  // Chips
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Premium effects
  glowEffect: {
    shadowColor: colors.glowPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  
  gradientBackground: {
    flex: 1,
  },
});


import { useConversations } from '../../contexts/ConversationsContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  interpolate,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPersonalizedQuickActions } from '../../utils/personalization';
import { LinearGradient } from 'expo-linear-gradient';
import { aiComplete, checkOpenAIConfig } from '../../lib/ai';
import { router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { ChatMessage, QuotaUsage, OnboardingData, InputMode, PresetPrompt } from '../../types';
import { quickHealthCheck } from '../../utils/systemCheck';
import PremiumSidebar from '../../components/PremiumSidebar';

interface PremiumSuggestionTileProps {
  action: any;
  index: number;
  onPress: () => void;
  disabled: boolean;
}

interface PremiumQuotaPillProps {
  remaining: number;
  total: number;
}

interface WelcomeBlockProps {
  visible: boolean;
  profile: OnboardingData | null;
  welcomeMessage: string;
  recommendations: string[];
}

interface SuggestionTilesProps {
  visible: boolean;
  actions: any[];
  onActionPress: (actionId: string) => void;
  disabled: boolean;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface InputModeToggleProps {
  modes: InputMode[];
  activeMode: 'text' | 'image';
  onModeChange: (mode: 'text' | 'image') => void;
}

interface PresetPromptsProps {
  visible: boolean;
  prompts: PresetPrompt[];
  onPromptSelect: (prompt: string) => void;
}

const InputModeToggle: React.FC<InputModeToggleProps> = ({ modes, activeMode, onModeChange }) => {
  const slideAnim = useSharedValue(0);
  
  useEffect(() => {
    slideAnim.value = withSpring(activeMode === 'text' ? 0 : 1, { tension: 300, friction: 8 });
  }, [activeMode]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slideAnim.value, [0, 1], [0, 50]) }],
  }));

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.glassBackgroundStrong,
      borderRadius: 16,
      padding: 4,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.glassBorderStrong,
    }}>
      <Animated.View style={[
        {
          position: 'absolute',
          top: 4,
          left: 4,
          width: 46,
          height: 32,
          backgroundColor: colors.neonGreen,
          borderRadius: 12,
          shadowColor: colors.glowNeonGreen,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 12,
          elevation: 8,
        },
        animatedStyle
      ]} />
      
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            zIndex: 1,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onModeChange(mode.id);
          }}
        >
          <Text style={{ fontSize: 16 }}>{mode.icon}</Text>
          <Text style={[
            commonStyles.textBold,
            { 
              fontSize: 10, 
              color: activeMode === mode.id ? colors.background : colors.text,
              marginTop: 2
            }
          ]}>
            {mode.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const PresetPrompts: React.FC<PresetPromptsProps> = ({ visible, prompts, onPromptSelect }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);
  
  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(20, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        paddingHorizontal: 16,
        marginBottom: 12,
      },
      animatedStyle
    ]}>
      <Text style={[
        commonStyles.textBold,
        { 
          fontSize: 12, 
          color: colors.neonTeal, 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 1
        }
      ]}>
        Quick Start
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={prompt.id}
            style={{
              backgroundColor: colors.glassBackground,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              shadowColor: colors.glowNeonTeal,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              minWidth: 140,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPromptSelect(prompt.prompt);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, marginRight: 6 }}>{prompt.icon}</Text>
              <Text style={[
                commonStyles.textBold,
                { fontSize: 11, color: colors.neonTeal }
              ]}>
                {prompt.title}
              </Text>
            </View>
            <Text style={[
              commonStyles.textSmall,
              { fontSize: 9, color: colors.textSecondary, lineHeight: 12 }
            ]} numberOfLines={2}>
              {prompt.prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-50);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(-50, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const notifications = [
    {
      id: '1',
      title: 'Welcome to VIRALYZE!',
      message: 'Start creating viral content with AI assistance',
      time: '2m ago',
      type: 'welcome',
      unread: true,
    },
    {
      id: '2',
      title: 'Daily Quota Reset',
      message: 'Your free AI requests have been refreshed',
      time: '1h ago',
      type: 'quota',
      unread: false,
    },
    {
      id: '3',
      title: 'Pro Tip',
      message: 'Try using specific keywords in your prompts for better results',
      time: '1d ago',
      type: 'tip',
      unread: false,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome': return 'hand-right-outline';
      case 'quota': return 'refresh-outline';
      case 'tip': return 'bulb-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'welcome': return colors.accent;
      case 'quota': return colors.warning;
      case 'tip': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'flex-start',
          paddingTop: 100,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[
          {
            marginHorizontal: 16,
            backgroundColor: colors.glassBackgroundStrong,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.glassBorderStrong,
            maxHeight: 400,
          },
          animatedStyle
        ]}>
          <BlurView intensity={20} style={{
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            <View style={{ padding: 20 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <Text style={[commonStyles.subtitle, { fontSize: 18 }]}>
                  Notifications
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.glassBackgroundStrong,
                    borderRadius: 12,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                  }}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((notification, index) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={{
                      backgroundColor: notification.unread 
                        ? colors.glassBackground 
                        : 'transparent',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                      borderWidth: notification.unread ? 1 : 0,
                      borderColor: notification.unread 
                        ? colors.glassBorder 
                        : 'transparent',
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Handle notification tap
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{
                        backgroundColor: getNotificationColor(notification.type) + '20',
                        borderRadius: 12,
                        padding: 8,
                        marginRight: 12,
                      }}>
                        <Ionicons 
                          name={getNotificationIcon(notification.type) as any} 
                          size={16} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}>
                          <Text style={[
                            commonStyles.textBold,
                            { 
                              flex: 1,
                              fontSize: 14,
                              color: notification.unread ? colors.text : colors.textSecondary,
                            }
                          ]}>
                            {notification.title}
                          </Text>
                          {notification.unread && (
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.accent,
                            }} />
                          )}
                        </View>
                        
                        <Text style={[
                          commonStyles.textSmall,
                          { 
                            marginBottom: 4,
                            color: notification.unread ? colors.textSecondary : colors.textTertiary,
                          }
                        ]}>
                          {notification.message}
                        </Text>
                        
                        <Text style={[
                          commonStyles.textSmall,
                          { 
                            fontSize: 11,
                            color: colors.textTertiary,
                          }
                        ]}>
                          {notification.time}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {notifications.length === 0 && (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSmall, { marginTop: 16, textAlign: 'center' }]}>
                    No notifications yet
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const ProfileMenu: React.FC<ProfileMenuProps> = ({ visible, onClose }) => {
  const slideAnim = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    } else {
      slideAnim.value = withTiming(100, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  const menuItems = [
    { 
      icon: 'person-outline', 
      title: 'Edit Profile', 
      subtitle: 'Update your niche and goals',
      onPress: () => {
        onClose();
        router.push('/profile/edit');
      }
    },
    { 
      icon: 'settings-outline', 
      title: 'Settings', 
      subtitle: 'Manage your account',
      onPress: () => {
        onClose();
        router.push('/tabs/settings');
      }
    },
    { 
      icon: 'diamond-outline', 
      title: 'Upgrade to Pro', 
      subtitle: 'Unlock unlimited features',
      onPress: () => {
        onClose();
        router.push('/paywall');
      }
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[animatedStyle]}>
          <BlurView intensity={20} style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={['rgba(26, 31, 38, 0.95)', 'rgba(11, 15, 20, 0.95)']}
              style={{ padding: 24, paddingBottom: 40 }}
            >
              <View style={{
                alignItems: 'center',
                marginBottom: 24,
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.textSecondary,
                  marginBottom: 20,
                }} />
                <Text style={[commonStyles.subtitle, { fontSize: 18 }]}>
                  Quick Actions
                </Text>
              </View>

              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    commonStyles.glassCard,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 20,
                      marginVertical: 6,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    item.onPress();
                  }}
                >
                  <View style={{
                    backgroundColor: colors.glowTeal + '20',
                    borderRadius: 16,
                    padding: 12,
                    marginRight: 16,
                  }}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={colors.tealPrimary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.textBold, { marginBottom: 2 }]}>
                      {item.title}
                    </Text>
                    <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const PremiumQuotaPill: React.FC<PremiumQuotaPillProps> = ({ remaining, total }) => {
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glowAnim.value * 0.6,
    shadowRadius: 12 + glowAnim.value * 8,
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
    
    if (remaining <= 2) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [remaining]);

  const getColor = () => {
    const percentage = remaining / total;
    if (percentage > 0.6) return colors.neonGreen;
    if (percentage > 0.3) return colors.warning;
    return colors.error;
  };

  const getGlowColor = () => {
    const percentage = remaining / total;
    if (percentage > 0.6) return colors.glowNeonGreen;
    if (percentage > 0.3) return 'rgba(245, 158, 11, 0.8)';
    return 'rgba(239, 68, 68, 0.8)';
  };

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        top: 60,
        right: 16,
        zIndex: 1000,
        backgroundColor: colors.glassBackgroundUltra,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: getColor() + '40',
        shadowColor: getGlowColor(),
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={[getColor() + '20', getColor() + '10']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
        }}
      />
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getColor(),
          marginRight: 8,
          shadowColor: getGlowColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 6,
        }} />
        
        <Text style={[
          commonStyles.textBold,
          { 
            color: getColor(), 
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }
        ]}>
          {remaining}/{total} Free Left Today
        </Text>
      </View>
    </Animated.View>
  );
};

const WelcomeBlock: React.FC<WelcomeBlockProps> = ({ 
  visible, 
  profile, 
  welcomeMessage, 
  recommendations 
}) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-20);
  const glowAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
    shadowRadius: 20 + glowAnim.value * 10,
  }));

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 600 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0, { duration: 3000 })
        ),
        -1,
        true
      );
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(-20, { duration: 300 });
    }
  }, [visible]);

  const getNicheEmoji = () => {
    if (!profile?.niche) return '👋';
    const niche = profile.niche.toLowerCase();
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      beauty: '💄',
      travel: '✈️',
      gaming: '🎮',
      business: '💼',
      lifestyle: '🌟',
      comedy: '😂',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (niche.includes(key)) return emoji;
    }
    return '🚀';
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        margin: 16,
        marginTop: 100,
        padding: 24,
        backgroundColor: colors.glassBackgroundUltra,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.glassBorderUltra,
        shadowColor: colors.glowNeonTeal,
        shadowOffset: { width: 0, height: 0 },
        elevation: 16,
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={[colors.neonTeal + '10', colors.neonGreen + '10']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 28,
        }}
      />
      
      <BlurView intensity={30} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 28,
      }} />
      
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.glassBackgroundStrong,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.neonTeal + '40',
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 16,
          elevation: 12,
        }}>
          <Text style={{ fontSize: 24 }}>
            {getNicheEmoji()}
          </Text>
        </View>
        
        <Text style={[
          commonStyles.title, 
          { 
            textAlign: 'center', 
            fontSize: 20, 
            lineHeight: 26,
            color: colors.neonTeal,
            textShadowColor: colors.glowNeonTeal,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }
        ]}>
          {welcomeMessage}
        </Text>
      </View>
      
      {recommendations.length > 0 && (
        <View>
          <Text style={[
            commonStyles.textBold, 
            { 
              marginBottom: 16, 
              color: colors.neonGreen, 
              fontSize: 14,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1
            }
          ]}>
            ✨ Personalized for you
          </Text>
          
          <View style={{ gap: 8 }}>
            {recommendations.slice(0, 3).map((rec, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.glassBackground,
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.neonGreen,
                  marginRight: 12,
                  shadowColor: colors.glowNeonGreen,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                  elevation: 4,
                }} />
                
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.text, fontSize: 13, lineHeight: 18, flex: 1 }
                ]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const PremiumSuggestionTile: React.FC<PremiumSuggestionTileProps> = ({ 
  action, 
  index, 
  onPress, 
  disabled 
}) => {
  const scaleAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const shimmerAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
    shadowOpacity: 0.3 + glowAnim.value * 0.5,
    shadowRadius: 12 + glowAnim.value * 8,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-100, 100]) }],
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(index * 150, withTiming(1, { duration: 600 }));
    
    // Continuous glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
    
    // Shimmer effect
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false
    );
  }, [index]);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Bounce animation on press
      scaleAnim.value = withSequence(
        withTiming(0.88, { duration: 100 }),
        withSpring(1, { tension: 400, friction: 6 })
      );
      
      onPress();
    }
  };

  // Map action IDs to proper Ionicons
  const getIconName = (actionId: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      hooks: 'fish-outline',
      ideas: 'bulb-outline',
      captions: 'create-outline',
      calendar: 'calendar-outline',
      rewriter: 'refresh-outline',
    };
    return iconMap[actionId] || 'star-outline';
  };

  const getGlowColor = () => {
    const colorMap: Record<string, string> = {
      hooks: colors.glowNeonGreen,
      ideas: colors.glowNeonTeal,
      captions: colors.glowNeonPurple,
      calendar: 'rgba(245, 158, 11, 0.8)',
      rewriter: 'rgba(236, 72, 153, 0.8)',
    };
    return colorMap[action.id] || colors.glowNeonTeal;
  };

  const getAccentColor = () => {
    const colorMap: Record<string, string> = {
      hooks: colors.neonGreen,
      ideas: colors.neonTeal,
      captions: colors.neonPurple,
      calendar: colors.warning,
      rewriter: '#EC4899',
    };
    return colorMap[action.id] || colors.neonTeal;
  };

  return (
    <Animated.View style={[{ flex: 1, margin: 4 }, animatedStyle]}>
      <TouchableOpacity
        style={[
          {
            backgroundColor: disabled ? colors.backgroundSecondary : colors.glassBackgroundUltra,
            borderRadius: 20,
            padding: 16,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: disabled ? colors.backgroundTertiary : getAccentColor() + '30',
            opacity: disabled ? 0.5 : 1,
            minHeight: 90,
            justifyContent: 'center',
            shadowColor: disabled ? colors.neuDark : getGlowColor(),
            shadowOffset: { width: 0, height: 0 },
            elevation: 12,
            overflow: 'hidden',
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={disabled 
            ? [colors.backgroundSecondary, colors.backgroundSecondary] 
            : [getAccentColor() + '15', getAccentColor() + '05']
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
          }}
        />
        
        {/* Shimmer effect */}
        {!disabled && (
          <Animated.View style={[
            {
              position: 'absolute',
              top: 0,
              left: -50,
              width: 50,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: [{ skewX: '-20deg' }],
            },
            shimmerStyle
          ]} />
        )}
        
        {/* Icon container */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: disabled ? colors.backgroundTertiary : getAccentColor() + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 1,
          borderColor: disabled ? colors.backgroundTertiary : getAccentColor() + '40',
          shadowColor: disabled ? 'transparent' : getGlowColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <Ionicons 
            name={getIconName(action.id)} 
            size={20} 
            color={disabled ? colors.textTertiary : getAccentColor()} 
          />
        </View>
        
        <Text style={[
          commonStyles.textBold,
          { 
            fontSize: 12, 
            textAlign: 'center',
            color: disabled ? colors.textTertiary : colors.text,
            lineHeight: 16,
            letterSpacing: 0.3,
          }
        ]}>
          {action.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SuggestionTiles: React.FC<SuggestionTilesProps> = ({ 
  visible, 
  actions, 
  onActionPress, 
  disabled 
}) => {
  const slideAnim = useSharedValue(30);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      fadeAnim.value = withTiming(1, { duration: 600 });
    } else {
      slideAnim.value = withTiming(30, { duration: 300 });
      fadeAnim.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
      },
      animatedStyle
    ]}>
      {actions.slice(0, 3).map((action, index) => (
        <PremiumSuggestionTile
          key={action.id}
          action={action}
          index={index}
          onPress={() => onActionPress(action.id)}
          disabled={disabled}
        />
      ))}
    </Animated.View>
  );
};

export default function ChatScreen() {
  console.log('💬 Chat screen rendered');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showPresetPrompts, setShowPresetPrompts] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState<'text' | 'image'>('text');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const fadeAnim = useSharedValue(0);
  
  const { profile, welcomeMessage, recommendations, chatContext } = usePersonalization();
  const { currentConversation, messages: conversationMessages, addMessage } = useConversations();

  // Input modes for toggle
  const inputModes: InputMode[] = [
    { id: 'text', title: 'Text', icon: '💬', active: activeInputMode === 'text' },
    { id: 'image', title: 'Image', icon: '🎨', active: activeInputMode === 'image' },
  ];

  // Preset prompts based on user's niche
  const getPresetPrompts = (): PresetPrompt[] => {
    const basePrompts = [
      {
        id: 'brainstorm',
        title: 'Brainstorm Content',
        prompt: 'Help me brainstorm 5 viral content ideas for my audience',
        category: 'ideas',
        icon: '💡',
      },
      {
        id: 'captions',
        title: 'Write Captions',
        prompt: 'Write 3 engaging captions for my latest post',
        category: 'captions',
        icon: '✍️',
      },
      {
        id: 'weekly',
        title: 'Plan Weekly Posts',
        prompt: 'Create a 7-day content calendar with posting schedule',
        category: 'planning',
        icon: '📅',
      },
    ];

    // Customize based on niche
    if (profile?.niche) {
      const niche = profile.niche.toLowerCase();
      if (niche.includes('fitness')) {
        basePrompts.push({
          id: 'workout',
          title: 'Workout Ideas',
          prompt: 'Generate 5 fitness content ideas for beginners',
          category: 'fitness',
          icon: '💪',
        });
      } else if (niche.includes('food')) {
        basePrompts.push({
          id: 'recipes',
          title: 'Recipe Content',
          prompt: 'Create engaging food content ideas for social media',
          category: 'food',
          icon: '🍳',
        });
      } else if (niche.includes('tech')) {
        basePrompts.push({
          id: 'tech',
          title: 'Tech Reviews',
          prompt: 'Help me create tech review content that goes viral',
          category: 'tech',
          icon: '📱',
        });
      }
    }

    return basePrompts;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadInitialData();
    checkSystemHealth();
  }, []);

  useEffect(() => {
    if (currentConversation && conversationMessages.length > 0) {
      setMessages(conversationMessages);
      setShowWelcome(false);
      setShowSuggestions(false);
    }
  }, [currentConversation, conversationMessages.length]);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    setShowWelcome(false);
    setShowSuggestions(false);
    setShowPresetPrompts(false);
    
    idleTimerRef.current = setTimeout(() => {
      if (messages.length === 0) {
        setShowWelcome(true);
        setShowSuggestions(true);
        setShowPresetPrompts(true);
      }
    }, 300000); // 5 minutes
  };

  const loadInitialData = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      await quickHealthCheck();
    } catch (error) {
      console.error('System health check failed:', error);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const actionPrompts: Record<string, string> = {
      hooks: `Generate 5 viral hooks for ${profile?.niche || 'general'} content that will stop the scroll`,
      ideas: `Give me 3 trending content ideas for ${profile?.niche || 'general'} creators with ${profile?.followers || 0} followers`,
      captions: `Write 3 engaging captions for ${profile?.niche || 'general'} posts that drive engagement`,
      calendar: `Create a 7-day content calendar for ${profile?.niche || 'general'} with optimal posting times`,
      rewriter: `Help me adapt my content for TikTok, Instagram, YouTube, and LinkedIn`,
    };

    const prompt = actionPrompts[actionId];
    if (prompt) {
      setInputText(prompt);
      sendMessage(prompt);
    }
  };

  const handlePresetPromptSelect = (prompt: string) => {
    setInputText(prompt);
    sendMessage(prompt);
  };

  const handleInputModeChange = (mode: 'text' | 'image') => {
    setActiveInputMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (mode === 'image') {
      // Show image generation info
      Alert.alert(
        'Image Generation',
        'AI Image generation is coming soon! For now, you can describe the image you want and I\'ll help you create detailed prompts.',
        [{ text: 'Got it!' }]
      );
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check quota - Updated to use 10 instead of 2
    if (quota.text >= 10) {
      showUpgradeModal();
      return;
    }

    // Check OpenAI configuration
    const configCheck = await checkOpenAIConfig();
    if (!configCheck.isValid) {
      showConfigurationError();
      return;
    }

    resetIdleTimer();
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Add message to conversation
      await addMessage(userMessage);

      // Generate AI response with personalized context
      const aiResponse = await aiComplete('chat', profile, text, chatContext);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      await addMessage(assistantMessage);

      // Update quota
      const newQuota = await storage.updateQuotaUsage(1, 0);
      setQuota(newQuota);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showConfigurationError = () => {
    Alert.alert(
      'Configuration Error',
      'AI features are not properly configured. Please check your OpenAI settings.',
      [{ text: 'OK' }]
    );
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Daily Limit Reached',
      'You\'ve used all 10 of your free AI requests today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    try {
      // In a real app, you'd use Clipboard API
      console.log('Copying message:', content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error copying message:', error);
    }
  };

  const saveMessage = async (messageContent: string) => {
    try {
      const savedItem = {
        id: Date.now().toString(),
        type: 'chat' as const,
        title: messageContent.slice(0, 50) + '...',
        payload: { content: messageContent },
        created_at: new Date().toISOString(),
      };
      
      await storage.addSavedItem(savedItem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationModalVisible(true);
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileMenuVisible(true);
  };

  const getNicheEmoji = () => {
    if (!profile?.niche) return '🤖';
    const niche = profile.niche.toLowerCase();
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      beauty: '💄',
      travel: '✈️',
      gaming: '🎮',
      business: '💼',
      lifestyle: '🌟',
      comedy: '😂',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (niche.includes(key)) return emoji;
    }
    return '🚀';
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          {
            flexDirection: 'row',
            marginVertical: 12,
            marginHorizontal: 16,
            alignItems: 'flex-end',
          },
          isUser && { justifyContent: 'flex-end' }
        ]}
      >
        {!isUser && (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glassBackgroundUltra,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            borderWidth: 2,
            borderColor: colors.neonTeal + '40',
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 16 }}>{getNicheEmoji()}</Text>
          </View>
        )}
        
        <View style={[
          {
            maxWidth: '78%',
            borderRadius: 20,
            padding: 16,
            borderWidth: 2,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          },
          isUser ? {
            backgroundColor: colors.glassBackgroundUltra,
            borderColor: colors.neonGreen + '60',
            borderTopRightRadius: 6,
            shadowColor: colors.glowNeonGreen,
          } : {
            backgroundColor: colors.glassBackgroundUltra,
            borderColor: colors.glassBorderUltra,
            borderTopLeftRadius: 6,
            shadowColor: colors.glowNeonTeal,
          }
        ]}>
          {/* Message background gradient */}
          <LinearGradient
            colors={isUser 
              ? [colors.neonGreen + '15', colors.neonGreen + '05']
              : [colors.neonTeal + '10', colors.neonTeal + '05']
            }
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
            }}
          />
          
          <Text style={[
            {
              fontSize: 15,
              lineHeight: 22,
              color: colors.text,
              fontWeight: '500',
            }
          ]}>
            {message.content}
          </Text>
          
          {/* Message timestamp */}
          <Text style={[
            commonStyles.textSmall,
            {
              fontSize: 11,
              color: colors.textTertiary,
              marginTop: 8,
              textAlign: isUser ? 'right' : 'left',
            }
          ]}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          
          {/* AI message actions */}
          {!isUser && (
            <View style={{
              flexDirection: 'row',
              marginTop: 12,
              justifyContent: 'flex-end',
              gap: 8,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  borderRadius: 12,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.glowNeonTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
                onPress={() => copyMessage(message.content)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.neonTeal} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  borderRadius: 12,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.glowNeonGreen,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
                onPress={() => saveMessage(message.content)}
              >
                <Ionicons name="bookmark-outline" size={16} color={colors.neonGreen} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  borderRadius: 12,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.glowNeonPurple,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
                onPress={() => {
                  // Refine/regenerate message
                  setInputText(`Please refine this response: "${message.content}"`);
                }}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.neonPurple} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const quickActions = getPersonalizedQuickActions(profile);
  const remainingQuota = 10 - quota.text; // Updated to use 10 instead of 2
  const isQuotaExceeded = quota.text >= 10; // Updated to use 10 instead of 2

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Premium Header */}
        <View style={[
          commonStyles.header,
          {
            backgroundColor: colors.glassBackgroundUltra,
            borderBottomWidth: 1,
            borderBottomColor: colors.glassBorderStrong,
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}>
          <TouchableOpacity
            style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: colors.glassBackgroundStrong,
              borderWidth: 2,
              borderColor: colors.glassBorderStrong,
              shadowColor: colors.glowNeonTeal,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="menu" size={20} color={colors.neonTeal} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={[
              commonStyles.headerTitle, 
              { 
                fontSize: 28,
                color: colors.neonTeal,
                textShadowColor: colors.glowNeonTeal,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              }
            ]}>
              VIRALYZE
            </Text>
            <Text style={[
              commonStyles.textSmall,
              { 
                color: colors.neonGreen, 
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginTop: -4
              }
            ]}>
              AI Coach
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={{
                padding: 12,
                borderRadius: 16,
                backgroundColor: colors.glassBackgroundStrong,
                borderWidth: 2,
                borderColor: colors.glassBorderStrong,
                shadowColor: colors.glowNeonGreen,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.neonGreen} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                padding: 12,
                borderRadius: 16,
                backgroundColor: colors.glassBackgroundStrong,
                borderWidth: 2,
                borderColor: colors.glassBorderStrong,
                shadowColor: colors.glowNeonPurple,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={handleProfilePress}
            >
              <Ionicons name="person-circle-outline" size={20} color={colors.neonPurple} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Quota Pill */}
        <PremiumQuotaPill remaining={remainingQuota} total={10} />

        {/* Chat Content */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome Block */}
            <WelcomeBlock
              visible={showWelcome}
              profile={profile}
              welcomeMessage={welcomeMessage}
              recommendations={recommendations}
            />

            {/* Preset Prompts */}
            <PresetPrompts
              visible={showPresetPrompts}
              prompts={getPresetPrompts()}
              onPromptSelect={handlePresetPromptSelect}
            />

            {/* Messages */}
            {messages.map(renderMessage)}

            {/* Premium Loading Indicator */}
            {isLoading && (
              <View style={{
                flexDirection: 'row',
                marginVertical: 12,
                marginHorizontal: 16,
                alignItems: 'flex-end',
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.glassBackgroundUltra,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  borderWidth: 2,
                  borderColor: colors.neonTeal + '40',
                  shadowColor: colors.glowNeonTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  elevation: 8,
                }}>
                  <Text style={{ fontSize: 16 }}>{getNicheEmoji()}</Text>
                </View>
                
                <View style={{
                  backgroundColor: colors.glassBackgroundUltra,
                  borderRadius: 20,
                  borderTopLeftRadius: 6,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: colors.glassBorderStrong,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: colors.glowNeonTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}>
                  <ActivityIndicator size="small" color={colors.neonTeal} />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 15,
                    color: colors.neonTeal,
                    fontWeight: '600',
                  }}>
                    Crafting your response...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Premium Suggestion Tiles */}
          <SuggestionTiles
            visible={showSuggestions}
            actions={quickActions}
            onActionPress={handleQuickAction}
            disabled={isQuotaExceeded}
          />

          {/* Premium Input Area */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: colors.background,
          }}>
            {/* Input Mode Toggle */}
            <InputModeToggle
              modes={inputModes}
              activeMode={activeInputMode}
              onModeChange={handleInputModeChange}
            />
            
            {/* Input Field */}
            <View style={{
              backgroundColor: colors.glassBackgroundUltra,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.glassBorderUltra,
              paddingHorizontal: 20,
              paddingVertical: 16,
              shadowColor: colors.glowNeonTeal,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            }}>
              <LinearGradient
                colors={[colors.neonTeal + '08', colors.neonGreen + '08']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                }}
              />
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    maxHeight: 120,
                    paddingVertical: 0,
                    fontWeight: '500',
                  }}
                  placeholder={activeInputMode === 'text' 
                    ? `Ask me anything about ${profile?.niche || 'content creation'}...`
                    : 'Describe the image you want to create...'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  onFocus={resetIdleTimer}
                />
                
                <TouchableOpacity
                  style={{
                    marginLeft: 16,
                    opacity: (!inputText.trim() || isLoading || isQuotaExceeded) ? 0.5 : 1,
                  }}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading || isQuotaExceeded}
                >
                  <LinearGradient
                    colors={[colors.neonGreen, colors.neonTeal]}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: colors.glowNeonGreen,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <Ionicons 
                      name={activeInputMode === 'text' ? 'arrow-up' : 'camera'} 
                      size={20} 
                      color={colors.background} 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Premium Sidebar */}
        <PremiumSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />

        {/* Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />

        {/* Profile Menu */}
        <ProfileMenu
          visible={profileMenuVisible}
          onClose={() => setProfileMenuVisible(false)}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

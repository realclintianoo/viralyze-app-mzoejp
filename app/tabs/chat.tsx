
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../contexts/ConversationsContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { supabase } from '../../lib/supabase';
import { aiComplete, checkOpenAIConfig } from '../../lib/ai';
import { storage } from '../../utils/storage';
import { quickHealthCheck } from '../../utils/systemCheck';
import { getPersonalizedQuickActions } from '../../utils/personalization';
import { commonStyles, colors } from '../../styles/commonStyles';
import { ChatMessage, QuotaUsage, OnboardingData, InputMode, PresetPrompt } from '../../types';
import FloatingQuotaAlert from '../../components/FloatingQuotaAlert';
import PremiumSidebar from '../../components/PremiumSidebar';

const { width, height } = Dimensions.get('window');

interface PremiumSuggestionTileProps {
  action: any;
  index: number;
  onPress: () => void;
  disabled: boolean;
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
  onSeeMore?: () => void;
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

interface StreakPopupProps {
  visible: boolean;
  streakCount: number;
  onSave: () => void;
  onMaybeLater: () => void;
}

interface StreakData {
  current_streak: number;
  is_new_day: boolean;
  show_popup: boolean;
}

const InputModeToggle: React.FC<InputModeToggleProps> = ({ modes, activeMode, onModeChange }) => {
  const slideAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    slideAnim.value = withSpring(activeMode === 'image' ? 1 : 0);
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [activeMode, slideAnim, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slideAnim.value, [0, 1], [0, 60]) }],
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
  }));

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.glassBackground,
      borderRadius: 25,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      marginBottom: 16,
    }}>
      <Animated.View style={[
        {
          position: 'absolute',
          top: 4,
          left: 4,
          width: 60,
          height: 32,
          backgroundColor: colors.neonTeal,
          borderRadius: 20,
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
          elevation: 4,
        },
        animatedStyle
      ]} />
      
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            zIndex: 1,
          }}
          onPress={() => onModeChange(mode.id as 'text' | 'image')}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: activeMode === mode.id ? colors.background : colors.text,
          }}>
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const PresetPrompts: React.FC<PresetPromptsProps> = ({ visible, prompts, onPromptSelect }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      slideAnim.value = withSpring(0);
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(50, { duration: 200 });
    }
  }, [visible, fadeAnim, slideAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
        zIndex: 100,
      },
      animatedStyle
    ]}>
      <BlurView intensity={40} style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {prompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: colors.glassBackground,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                minWidth: 120,
              }}
              onPress={() => onPromptSelect(prompt.text)}
            >
              <Text style={{
                fontSize: 12,
                color: colors.text,
                textAlign: 'center',
                fontWeight: '500',
              }}>
                {prompt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BlurView>
    </Animated.View>
  );
};

const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      slideAnim.value = withSpring(0);
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(-100, { duration: 200 });
    }
  }, [visible, fadeAnim, slideAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return colors.neonGreen;
      case 'warning': return colors.neonYellow;
      case 'error': return colors.neonRed;
      default: return colors.neonTeal;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      },
      animatedStyle
    ]}>
      <BlurView intensity={40} style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <View style={{
          backgroundColor: colors.glassBackground + 'F0',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons 
            name={getNotificationIcon('info') as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color={getNotificationColor('info')} 
          />
          <Text style={[
            commonStyles.text,
            { color: colors.text, marginLeft: 12, flex: 1 }
          ]}>
            System notification
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const StreakPopup: React.FC<StreakPopupProps> = ({ visible, streakCount, onSave, onMaybeLater }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
      
      // Trigger confetti
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current.start();
        }
      }, 500);
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, fadeAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const getStreakEmoji = (count: number): string => {
    if (count >= 30) return '🏆';
    if (count >= 14) return '💎';
    if (count >= 7) return '⭐';
    if (count >= 3) return '🔥';
    return '✨';
  };

  const getStreakMessage = (count: number): string => {
    if (count >= 30) return 'Incredible! You\'re a content creation legend!';
    if (count >= 14) return 'Amazing! Two weeks of consistent creation!';
    if (count >= 7) return 'Fantastic! One week streak achieved!';
    if (count >= 3) return 'Great job! Keep the momentum going!';
    return 'Nice start! Building great habits!';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: width / 2, y: height / 3 }}
          autoStart={false}
        />
        
        <Animated.View style={[
          {
            width: width * 0.85,
            maxWidth: 400,
          },
          animatedStyle
        ]}>
          <BlurView intensity={40} style={{
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: colors.glassBorderUltra,
          }}>
            <LinearGradient
              colors={[
                colors.glassBackgroundUltra + 'F0',
                colors.background + 'E6',
              ]}
              style={{
                padding: 32,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 64, marginBottom: 16 }}>
                {getStreakEmoji(streakCount)}
              </Text>
              
              <Text style={[
                commonStyles.headerTitle,
                {
                  fontSize: 28,
                  textAlign: 'center',
                  marginBottom: 8,
                  color: colors.neonTeal,
                }
              ]}>
                Day {streakCount} Streak!
              </Text>
              
              <Text style={[
                commonStyles.text,
                {
                  textAlign: 'center',
                  color: colors.textSecondary,
                  marginBottom: 32,
                  lineHeight: 22,
                }
              ]}>
                {getStreakMessage(streakCount)}
              </Text>
              
              <TouchableOpacity
                style={[
                  commonStyles.primaryButton,
                  {
                    backgroundColor: colors.neonTeal,
                    width: '100%',
                    marginBottom: 16,
                  }
                ]}
                onPress={onSave}
              >
                <Text style={[
                  commonStyles.primaryButtonText,
                  { color: colors.background, fontWeight: '700' }
                ]}>
                  Save My Streak 🔥
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onMaybeLater}>
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.textSecondary }
                ]}>
                  Maybe later
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
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
  }, [visible, slideAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  if (!visible) return null;

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
          <BlurView intensity={40} style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
          }}>
            <View style={{
              backgroundColor: colors.glassBackground + 'F0',
              padding: 24,
              paddingBottom: 40,
            }}>
              <Text style={[
                commonStyles.subtitle,
                { color: colors.text, marginBottom: 20, textAlign: 'center' }
              ]}>
                Profile Menu
              </Text>
              
              <TouchableOpacity
                style={[commonStyles.menuItem, { marginBottom: 16 }]}
                onPress={() => {
                  onClose();
                  router.push('/profile/edit');
                }}
              >
                <Ionicons name="person-outline" size={20} color={colors.text} />
                <Text style={[commonStyles.menuItemText, { marginLeft: 12 }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[commonStyles.menuItem]}
                onPress={() => {
                  onClose();
                  router.push('/paywall');
                }}
              >
                <Ionicons name="diamond-outline" size={20} color={colors.neonTeal} />
                <Text style={[commonStyles.menuItemText, { marginLeft: 12 }]}>
                  Upgrade to Pro
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const WelcomeBlock: React.FC<WelcomeBlockProps> = ({ visible, profile, welcomeMessage, recommendations }) => {
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      slideAnim.value = withSpring(0);
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(-20, { duration: 300 });
    }
  }, [visible, fadeAnim, slideAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const getNicheEmoji = (): string => {
    const niche = profile?.niche?.toLowerCase() || '';
    if (niche.includes('business') || niche.includes('finance')) return '💼';
    if (niche.includes('health') || niche.includes('fitness')) return '💪';
    if (niche.includes('technology') || niche.includes('tech')) return '💻';
    if (niche.includes('lifestyle')) return '✨';
    if (niche.includes('education')) return '📚';
    if (niche.includes('entertainment')) return '🎬';
    if (niche.includes('travel')) return '✈️';
    if (niche.includes('food') || niche.includes('cooking')) return '🍳';
    if (niche.includes('fashion') || niche.includes('beauty')) return '👗';
    if (niche.includes('gaming')) return '🎮';
    if (niche.includes('sports')) return '⚽';
    if (niche.includes('music')) return '🎵';
    return '🚀';
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        marginHorizontal: 16,
        marginBottom: 20,
      },
      animatedStyle
    ]}>
      <BlurView intensity={30} style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <LinearGradient
          colors={[
            colors.glassBackground + 'F0',
            colors.background + 'E6',
          ]}
          style={{
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {getNicheEmoji()}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[
                commonStyles.subtitle,
                {
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 4,
                }
              ]}>
                {welcomeMessage}
              </Text>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                }
              ]}>
                Personalized for you
              </Text>
            </View>
          </View>
          
          {recommendations.length > 0 && (
            <View>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontSize: 12,
                }
              ]}>
                Today&apos;s recommendations:
              </Text>
              {recommendations.slice(0, 2).map((rec, index) => (
                <Text key={index} style={[
                  commonStyles.textSmall,
                  {
                    color: colors.text,
                    fontSize: 13,
                    marginBottom: 4,
                  }
                ]}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const PremiumSuggestionTile: React.FC<PremiumSuggestionTileProps> = ({ action, index, onPress, disabled }) => {
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    glowAnim.value = withDelay(index * 200, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    ));
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.95, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [index, fadeAnim, glowAnim, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: pulseAnim.value }],
    shadowOpacity: disabled ? 0.1 : 0.3 + glowAnim.value * 0.4,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      onPress();
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  const getIconName = (actionId: string): keyof typeof Ionicons.glyphMap => {
    switch (actionId) {
      case 'hooks': return 'fish';
      case 'ideas': return 'bulb';
      case 'captions': return 'text';
      case 'calendar': return 'calendar';
      case 'rewriter': return 'refresh';
      default: return 'flash';
    }
  };

  const getGlowColor = () => {
    return disabled ? colors.textSecondary : colors.glowNeonTeal;
  };

  const getAccentColor = () => {
    return disabled ? colors.textSecondary : colors.neonTeal;
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        {
          width: 90,
          height: 90,
          marginHorizontal: 8,
          shadowColor: getGlowColor(),
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 8,
        },
        animatedStyle
      ]}>
        <BlurView intensity={30} style={{
          flex: 1,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: disabled ? colors.glassBorder : colors.neonTeal + '40',
        }}>
          <LinearGradient
            colors={disabled 
              ? [colors.glassBackground, colors.backgroundSecondary]
              : [colors.neonTeal + '20', colors.neonTeal + '10']
            }
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 12,
            }}
          >
            <Ionicons 
              name={getIconName(action.id)} 
              size={24} 
              color={getAccentColor()} 
              style={{ marginBottom: 8 }}
            />
            <Text style={[
              commonStyles.textSmall,
              {
                color: disabled ? colors.textSecondary : colors.text,
                fontSize: 11,
                fontWeight: '600',
                textAlign: 'center',
                lineHeight: 14,
              }
            ]}>
              {action.label}
            </Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SuggestionTiles: React.FC<SuggestionTilesProps> = ({ visible, actions, onActionPress, disabled, onSeeMore }) => {
  const slideAnim = useSharedValue(50);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      fadeAnim.value = withTiming(1, { duration: 600 });
    } else {
      slideAnim.value = withTiming(50, { duration: 300 });
      fadeAnim.value = withTiming(0, { duration: 300 });
    }
  }, [visible, slideAnim, fadeAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        marginHorizontal: 16,
        marginBottom: 20,
      },
      animatedStyle
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[
          commonStyles.subtitle,
          {
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
          }
        ]}>
          Quick Start
        </Text>
        {onSeeMore && (
          <TouchableOpacity onPress={onSeeMore}>
            <Text style={[
              commonStyles.textSmall,
              {
                color: colors.neonTeal,
                fontSize: 12,
                fontWeight: '600',
              }
            ]}>
              See More
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {actions.slice(0, 5).map((action, index) => (
          <PremiumSuggestionTile
            key={action.id}
            action={action}
            index={index}
            onPress={() => onActionPress(action.id)}
            disabled={disabled}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { user } = useAuth();
  const { currentConversation, messages: conversationMessages, addMessage, loadMessages } = useConversations();
  const { profile } = usePersonalization();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showQuotaAlert, setShowQuotaAlert] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 10, image: 1, used_text: 0, used_image: 0 });
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [showPresetPrompts, setShowPresetPrompts] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const fadeAnim = useSharedValue(1);

  const checkDailyStreak = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking streak:', error);
        return;
      }

      const today = new Date().toDateString();
      const lastVisit = data?.last_visit_date ? new Date(data.last_visit_date).toDateString() : null;

      if (lastVisit !== today) {
        // New day visit
        const streakData: StreakData = {
          current_streak: (data?.current_streak || 0) + 1,
          is_new_day: true,
          show_popup: true,
        };

        setCurrentStreak(streakData.current_streak);
        setShowStreakPopup(true);

        // Update database
        await supabase
          .from('user_streaks')
          .upsert({
            user_id: user.id,
            current_streak: streakData.current_streak,
            last_visit_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      } else if (data) {
        setCurrentStreak(data.current_streak);
      }
    } catch (error) {
      console.error('Error in checkDailyStreak:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkDailyStreak();
    }
  }, [user, checkDailyStreak, fadeAnim]);

  useEffect(() => {
    if (currentConversation && conversationMessages) {
      const chatMessages: ChatMessage[] = conversationMessages.map(msg => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
      }));
      setMessages(chatMessages);
    }
  }, [currentConversation, conversationMessages]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      if (messages.length > 0) {
        setShowWelcome(true);
        setShowSuggestions(true);
      }
    }, 300000); // 5 minutes
  }, [messages.length]);

  const loadInitialData = useCallback(async () => {
    try {
      const savedQuota = await storage.getQuota();
      if (savedQuota) {
        setQuota(savedQuota);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, []);

  const checkSystemHealth = useCallback(async () => {
    try {
      const isHealthy = await quickHealthCheck();
      if (!isHealthy) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('System health check failed:', error);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    checkSystemHealth();
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [loadInitialData, checkSystemHealth, resetIdleTimer]);

  const getPresetPrompts = (): PresetPrompt[] => {
    return [
      { label: 'Hook Ideas', text: 'Give me 5 viral hook ideas for my niche' },
      { label: 'Content Plan', text: 'Create a 7-day content calendar for me' },
      { label: 'Trending Topics', text: 'What are trending topics in my niche right now?' },
      { label: 'Engagement Tips', text: 'How can I increase engagement on my posts?' },
    ];
  };

  const handleQuickAction = (actionId: string) => {
    const actionPrompts: Record<string, string> = {
      hooks: 'Generate 10 viral hooks for my content',
      ideas: 'Give me 5 content ideas for this week',
      captions: 'Write 3 engaging captions for my latest post',
      calendar: 'Create a 7-day content calendar',
      rewriter: 'Help me rewrite my content for different platforms',
    };

    const prompt = actionPrompts[actionId];
    if (prompt) {
      setInputText(prompt);
      sendMessage(prompt);
    }
  };

  const handlePresetPromptSelect = (prompt: string) => {
    setShowPresetPrompts(false);
    setInputText(prompt);
    sendMessage(prompt);
  };

  const handleInputModeChange = (mode: 'text' | 'image') => {
    setInputMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check quota
    if (quota.used_text >= quota.text) {
      setShowQuotaAlert(true);
      return;
    }

    setIsLoading(true);
    setShowWelcome(false);
    setShowSuggestions(false);
    resetIdleTimer();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Check OpenAI configuration
      const configCheck = await checkOpenAIConfig();
      if (!configCheck.isConfigured) {
        showConfigurationError();
        return;
      }

      // Add user message to conversation
      if (currentConversation) {
        await addMessage(currentConversation.id, text.trim(), 'user');
      }

      // Get AI response
      const response = await aiComplete('chat', profile, text.trim());
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Add AI message to conversation
      if (currentConversation) {
        await addMessage(currentConversation.id, response, 'assistant');
      }

      // Update quota
      const newQuota = {
        ...quota,
        used_text: quota.used_text + 1,
      };
      setQuota(newQuota);
      await storage.saveQuota(newQuota);

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
      'Configuration Required',
      'AI services need to be configured. Please check your settings.',
      [{ text: 'OK' }]
    );
  };

  const copyMessage = async (content: string) => {
    // Copy to clipboard logic would go here
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const saveMessage = async (messageContent: string) => {
    try {
      // Save message logic would go here
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Saved', 'Message saved to your collection');
    } catch (error) {
      console.error('Error saving message:', error);
      Alert.alert('Error', 'Failed to save message');
    }
  };

  const handleNotificationPress = () => {
    setShowNotification(false);
  };

  const handleProfilePress = () => {
    setShowProfileMenu(true);
  };

  const handleStreakSave = () => {
    setShowStreakPopup(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStreakMaybeLater = () => {
    setShowStreakPopup(false);
  };

  const getNicheEmoji = (): string => {
    const niche = profile?.niche?.toLowerCase() || '';
    if (niche.includes('business') || niche.includes('finance')) return '💼';
    if (niche.includes('health') || niche.includes('fitness')) return '💪';
    if (niche.includes('technology') || niche.includes('tech')) return '💻';
    if (niche.includes('lifestyle')) return '✨';
    if (niche.includes('education')) return '📚';
    if (niche.includes('entertainment')) return '🎬';
    if (niche.includes('travel')) return '✈️';
    if (niche.includes('food') || niche.includes('cooking')) return '🍳';
    if (niche.includes('fashion') || niche.includes('beauty')) return '👗';
    if (niche.includes('gaming')) return '🎮';
    if (niche.includes('sports')) return '⚽';
    if (niche.includes('music')) return '🎵';
    return '🚀';
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <View
        key={message.id}
        style={{
          flexDirection: message.isUser ? 'row-reverse' : 'row',
          marginBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            backgroundColor: message.isUser 
              ? colors.neonTeal 
              : colors.glassBackground,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: message.isUser 
              ? colors.neonTeal + '40' 
              : colors.glassBorder,
          }}
        >
          <Text
            style={{
              color: message.isUser ? colors.background : colors.text,
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {message.text}
          </Text>
          
          {!message.isUser && (
            <View style={{
              flexDirection: 'row',
              marginTop: 12,
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 16,
                }}
                onPress={() => copyMessage(message.text)}
              >
                <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginLeft: 4,
                }}>
                  Copy
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 16,
                }}
                onPress={() => saveMessage(message.text)}
              >
                <Ionicons name="bookmark-outline" size={14} color={colors.textSecondary} />
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginLeft: 4,
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const quickActions = getPersonalizedQuickActions(profile);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary + '40',
          colors.background,
        ]}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.glassBorder,
        }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.glassBackground,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image
              source={require('../../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.glassBackground,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.neonTeal + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleProfilePress}
            >
              <Text style={{ fontSize: 16 }}>{getNicheEmoji()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Usage Counter */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          paddingVertical: 8,
        }}>
          <View style={{
            backgroundColor: colors.glassBackground,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
            }}>
              {quota.text - quota.used_text} free left today
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Welcome Block */}
          <WelcomeBlock
            visible={showWelcome && messages.length === 0}
            profile={profile}
            welcomeMessage={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!`}
            recommendations={[
              'Try creating viral hooks for your niche',
              'Plan your content calendar for the week',
            ]}
          />

          {/* Suggestion Tiles */}
          <SuggestionTiles
            visible={showSuggestions && messages.length === 0}
            actions={quickActions}
            onActionPress={handleQuickAction}
            disabled={quota.used_text >= quota.text}
            onSeeMore={() => router.push('/tabs/tools')}
          />

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            
            {isLoading && (
              <View style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                marginBottom: 16,
              }}>
                <View style={{
                  maxWidth: '80%',
                  backgroundColor: colors.glassBackground,
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                }}>
                  <ActivityIndicator color={colors.neonTeal} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: Platform.OS === 'ios' ? 16 : 32,
            borderTopWidth: 1,
            borderTopColor: colors.glassBorder,
          }}
        >
          {/* Input Mode Toggle */}
          <InputModeToggle
            modes={[
              { id: 'text', label: 'Text' },
              { id: 'image', label: 'Image' },
            ]}
            activeMode={inputMode}
            onModeChange={handleInputModeChange}
          />

          {/* Input Field */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: colors.glassBackground,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.backgroundSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
              onPress={() => setShowPresetPrompts(!showPresetPrompts)}
            >
              <Ionicons name="apps" size={16} color={colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 16,
                maxHeight: 100,
                paddingVertical: 4,
              }}
              placeholder={inputMode === 'text' ? 'Ask me anything...' : 'Describe the image you want...'}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onFocus={() => {
                setShowWelcome(false);
                setShowSuggestions(false);
              }}
            />
            
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: inputText.trim() ? colors.neonTeal : colors.backgroundSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 12,
              }}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={inputText.trim() ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Preset Prompts */}
        <PresetPrompts
          visible={showPresetPrompts}
          prompts={getPresetPrompts()}
          onPromptSelect={handlePresetPromptSelect}
        />

        {/* Modals and Overlays */}
        <NotificationModal
          visible={showNotification}
          onClose={() => setShowNotification(false)}
        />

        <ProfileMenu
          visible={showProfileMenu}
          onClose={() => setShowProfileMenu(false)}
        />

        <StreakPopup
          visible={showStreakPopup}
          streakCount={currentStreak}
          onSave={handleStreakSave}
          onMaybeLater={handleStreakMaybeLater}
        />

        <FloatingQuotaAlert
          visible={showQuotaAlert}
          onUpgrade={() => {
            setShowQuotaAlert(false);
            router.push('/paywall');
          }}
          onDismiss={() => setShowQuotaAlert(false)}
        />

        <PremiumSidebar
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

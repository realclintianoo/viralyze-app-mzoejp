
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { commonStyles, colors, animations } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useConversations, Conversation } from '../contexts/ConversationsContext';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.85;

interface PremiumSidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

interface UserProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onAccountSettings: () => void;
  onSubscription: () => void;
  onLogout: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, animations.premiumStiffness);
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Animated.View style={[animatedStyle]}>
          <BlurView intensity={20} style={{
            borderRadius: 28,
            overflow: 'hidden',
            width: screenWidth * 0.9,
          }}>
            <LinearGradient
              colors={['rgba(11, 15, 20, 0.95)', 'rgba(26, 31, 38, 0.95)']}
              style={{ padding: 32 }}
            >
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{
                  backgroundColor: colors.glowTeal + '20',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <Ionicons name="add-circle" size={32} color={colors.tealPrimary} />
                </View>
                <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
                  Start a New AI Project
                </Text>
                <Text style={[commonStyles.textSmall, { textAlign: 'center' }]}>
                  Give your project a memorable name
                </Text>
              </View>

              <TextInput
                style={[commonStyles.premiumInput, { marginBottom: 24 }]}
                placeholder="e.g., TikTok Growth Strategy, Brand Campaign..."
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                autoFocus
                onSubmitEditing={handleSubmit}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[commonStyles.secondaryButton, { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    commonStyles.premiumButton,
                    { 
                      flex: 1,
                      opacity: title.trim() ? 1 : 0.5,
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={!title.trim()}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 22,
                    }}
                  />
                  <Text style={[commonStyles.buttonText, { fontSize: 16 }]}>
                    Create Project
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  visible,
  onClose,
  onAccountSettings,
  onSubscription,
  onLogout,
}) => {
  const slideAnim = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, animations.premiumStiffness);
    } else {
      slideAnim.value = withTiming(100, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  const menuItems = [
    { icon: 'settings-outline', title: 'Account Settings', onPress: onAccountSettings },
    { icon: 'diamond-outline', title: 'Subscription Status', onPress: onSubscription },
    { icon: 'log-out-outline', title: 'Logout', onPress: onLogout, isDestructive: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
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
                      borderColor: item.isDestructive 
                        ? colors.error + '40' 
                        : colors.glassBorderStrong,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    item.onPress();
                    onClose();
                  }}
                >
                  <View style={{
                    backgroundColor: item.isDestructive 
                      ? colors.error + '20' 
                      : colors.glowTeal + '20',
                    borderRadius: 16,
                    padding: 12,
                    marginRight: 16,
                  }}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={item.isDestructive ? colors.error : colors.tealPrimary} 
                    />
                  </View>
                  <Text style={[
                    commonStyles.textBold,
                    { 
                      flex: 1,
                      color: item.isDestructive ? colors.error : colors.text,
                    }
                  ]}>
                    {item.title}
                  </Text>
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

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({
  visible,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { user } = useAuth();
  const { profile } = usePersonalization();
  const { 
    conversations, 
    currentConversation, 
    isLoading, 
    createConversation, 
    selectConversation,
    deleteConversation,
  } = useConversations();

  const slideAnim = useSharedValue(-SIDEBAR_WIDTH);
  const overlayAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, animations.premiumStiffness);
      overlayAnim.value = withTiming(1, { duration: 300 });
    } else {
      slideAnim.value = withTiming(-SIDEBAR_WIDTH, { duration: 250 });
      overlayAnim.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayAnim.value,
  }));

  const getNicheEmoji = (niche?: string): string => {
    if (!niche) return '💬';
    const nicheEmojis: Record<string, string> = {
      'fitness': '💪',
      'tech': '💻',
      'music': '🎶',
      'food': '🍳',
      'fashion': '👗',
      'travel': '✈️',
      'business': '💼',
      'lifestyle': '✨',
    };
    return nicheEmojis[niche.toLowerCase()] || '💬';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleNewProject = async (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const emoji = getNicheEmoji(profile?.niche);
    await createConversation(title, emoji);
    onClose();
  };

  const handleConversationPress = async (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await selectConversation(conversation.id);
    onClose();
  };

  const handleConversationDelete = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(conversationId);
          },
        },
      ]
    );
  };

  const handleProfilePress = () => {
    setShowProfileMenu(true);
  };

  const handleAccountSettings = () => {
    router.push('/profile/edit');
  };

  const handleSubscription = () => {
    router.push('/paywall');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Handle logout logic here
            console.log('Logout pressed');
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Overlay */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
          overlayAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
          },
          sidebarAnimatedStyle,
        ]}
      >
        <BlurView intensity={30} style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              'rgba(11, 15, 20, 0.98)',
              'rgba(6, 182, 212, 0.05)',
              'rgba(0, 0, 0, 0.98)',
            ]}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Header */}
              <View style={{ padding: 24, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={[commonStyles.headerTitle, { flex: 1, fontSize: 28 }]}>
                    VIRALYZE
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.glassBackgroundStrong,
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.glassBorderStrong,
                    }}
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[
                      commonStyles.premiumInput,
                      {
                        paddingLeft: 50,
                        marginVertical: 0,
                        borderColor: colors.glowTeal + '40',
                        shadowColor: colors.glowTeal,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 8,
                      }
                    ]}
                    placeholder="Search chats & projects…"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View style={{
                    position: 'absolute',
                    left: 18,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="search-outline" size={20} color={colors.tealPrimary} />
                  </View>
                </View>

                {/* Divider */}
                <View style={{
                  height: 1,
                  backgroundColor: colors.glassBorderStrong,
                  marginTop: 20,
                  shadowColor: colors.glowTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }} />
              </View>

              {/* New Project Button */}
              <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[
                    commonStyles.premiumButton,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 16,
                    }
                  ]}
                  onPress={() => setShowNewProjectModal(true)}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 22,
                    }}
                  />
                  <Ionicons name="add-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={[commonStyles.buttonText, { fontSize: 16 }]}>
                    New Project
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Conversations List */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {isLoading ? (
                  <View style={{ alignItems: 'center', padding: 40 }}>
                    <Text style={commonStyles.textSmall}>Loading conversations...</Text>
                  </View>
                ) : filteredConversations.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 40 }}>
                    <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                    <Text style={[commonStyles.textSmall, { marginTop: 16, textAlign: 'center' }]}>
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </Text>
                  </View>
                ) : (
                  filteredConversations.map((conversation, index) => (
                    <TouchableOpacity
                      key={conversation.id}
                      style={[
                        commonStyles.glassCard,
                        {
                          marginVertical: 6,
                          padding: 20,
                          borderColor: conversation.is_active 
                            ? colors.glowTeal + '60' 
                            : colors.glassBorderStrong,
                          shadowColor: conversation.is_active 
                            ? colors.glowTeal 
                            : colors.neuDark,
                          shadowOpacity: conversation.is_active ? 0.6 : 0.2,
                          position: 'relative',
                        }
                      ]}
                      onPress={() => handleConversationPress(conversation)}
                      onLongPress={() => handleConversationDelete(conversation.id)}
                    >
                      {conversation.is_active && (
                        <LinearGradient
                          colors={['rgba(6, 182, 212, 0.1)', 'rgba(34, 197, 94, 0.1)']}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 26,
                          }}
                        />
                      )}

                      {conversation.is_active && (
                        <View style={{
                          position: 'absolute',
                          left: -2,
                          top: 20,
                          bottom: 20,
                          width: 4,
                          backgroundColor: colors.tealPrimary,
                          borderRadius: 2,
                          shadowColor: colors.glowTeal,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 1,
                          shadowRadius: 8,
                          elevation: 8,
                        }} />
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{
                          backgroundColor: colors.glowTeal + '20',
                          borderRadius: 16,
                          padding: 12,
                          marginRight: 16,
                        }}>
                          <Text style={{ fontSize: 20 }}>{conversation.emoji}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[
                            commonStyles.textBold,
                            { 
                              marginBottom: 4,
                              color: conversation.is_active ? colors.white : colors.text,
                            }
                          ]}>
                            {conversation.title}
                          </Text>
                          
                          {conversation.description && (
                            <Text style={[
                              commonStyles.textSmall,
                              { 
                                marginBottom: 8,
                                color: conversation.is_active 
                                  ? colors.textSecondary 
                                  : colors.textTertiary,
                              }
                            ]}>
                              {conversation.description}
                            </Text>
                          )}

                          <Text style={[
                            commonStyles.textSmall,
                            { 
                              fontSize: 12,
                              color: conversation.is_active 
                                ? colors.tealPrimary 
                                : colors.textTertiary,
                            }
                          ]}>
                            {formatTimeAgo(conversation.last_message_at)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* User Profile */}
              <View style={{ padding: 24, paddingTop: 16 }}>
                <TouchableOpacity
                  style={[
                    commonStyles.glassCard,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 20,
                      marginVertical: 0,
                      borderColor: colors.glassBorderUltra,
                    }
                  ]}
                  onPress={handleProfilePress}
                >
                  <View style={{ position: 'relative', marginRight: 16 }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.gradientStart,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: colors.glassBorderUltra,
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.white }}>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    
                    {/* Status dot */}
                    <View style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.statusOnline,
                      borderWidth: 2,
                      borderColor: colors.background,
                      shadowColor: colors.statusOnline,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                      elevation: 4,
                    }} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.textBold, { marginBottom: 2 }]}>
                      {profile?.niche ? `${profile.niche} Creator` : 'Creator'}
                    </Text>
                    <Text style={[commonStyles.textSmall, { fontSize: 12 }]}>
                      @{user?.email?.split('@')[0] || 'user'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Modals */}
      <NewProjectModal
        visible={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleNewProject}
      />

      <UserProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onAccountSettings={handleAccountSettings}
        onSubscription={handleSubscription}
        onLogout={handleLogout}
      />
    </Modal>
  );
};

export default PremiumSidebar;

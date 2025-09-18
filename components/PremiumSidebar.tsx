
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
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useConversations, Conversation } from '../contexts/ConversationsContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { commonStyles, colors, animations } from '../styles/commonStyles';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;

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
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, fadeAnim, scaleAnim]);

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
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <Animated.View style={[
          {
            width: width * 0.85,
            maxWidth: 400,
          },
          animatedStyle
        ]}>
          <BlurView intensity={40} style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: colors.glassBorderUltra,
          }}>
            <LinearGradient
              colors={[
                colors.glassBackgroundUltra + 'F0',
                colors.background + 'E6',
              ]}
              style={{ padding: 24 }}
            >
              <Text style={[commonStyles.subtitle, { 
                fontSize: 20,
                marginBottom: 16,
                textAlign: 'center',
                color: colors.text,
              }]}>
                New Conversation
              </Text>
              
              <TextInput
                style={[commonStyles.input, {
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.glassBorder,
                  marginBottom: 20,
                }]}
                placeholder="Enter conversation title..."
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[commonStyles.secondaryButton, { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[commonStyles.primaryButton, { flex: 1 }]}
                  onPress={handleSubmit}
                >
                  <Text style={commonStyles.primaryButtonText}>Create</Text>
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
  onLogout 
}) => {
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
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: colors.glassBorderUltra,
          }}>
            <LinearGradient
              colors={[
                colors.glassBackgroundUltra + 'F0',
                colors.background + 'E6',
              ]}
              style={{ padding: 24, paddingBottom: 40 }}
            >
              <TouchableOpacity
                style={[commonStyles.menuItem, { marginBottom: 12 }]}
                onPress={onAccountSettings}
              >
                <Ionicons name="person-outline" size={20} color={colors.text} />
                <Text style={[commonStyles.menuItemText, { marginLeft: 12 }]}>
                  Account Settings
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[commonStyles.menuItem, { marginBottom: 12 }]}
                onPress={onSubscription}
              >
                <Ionicons name="diamond-outline" size={20} color={colors.neonTeal} />
                <Text style={[commonStyles.menuItemText, { marginLeft: 12 }]}>
                  Subscription
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[commonStyles.menuItem]}
                onPress={onLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.neonRed} />
                <Text style={[commonStyles.menuItemText, { marginLeft: 12, color: colors.neonRed }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function PremiumSidebar({ visible, onClose }: PremiumSidebarProps) {
  const { user } = useAuth();
  const { conversations, createConversation, selectConversation, deleteConversation } = useConversations();
  const { profile } = usePersonalization();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const overlayAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-SIDEBAR_WIDTH);

  useEffect(() => {
    if (visible) {
      overlayAnim.value = withTiming(1, { duration: 300 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    } else {
      overlayAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(-SIDEBAR_WIDTH, { duration: 200 });
    }
  }, [visible, overlayAnim, slideAnim]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayAnim.value,
  }));

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const getNicheEmoji = () => {
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

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const handleNewProject = async (title: string) => {
    try {
      await createConversation(title, getNicheEmoji());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create new conversation');
    }
  };

  const handleConversationPress = async (conversation: Conversation) => {
    try {
      await selectConversation(conversation.id);
      onClose();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
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
            try {
              await deleteConversation(conversationId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          }
        }
      ]
    );
  };

  const handleProfilePress = () => {
    setShowProfileMenu(true);
  };

  const handleAccountSettings = () => {
    setShowProfileMenu(false);
    onClose();
    router.push('/profile/edit');
  };

  const handleSubscription = () => {
    setShowProfileMenu(false);
    onClose();
    router.push('/paywall');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    // Handle logout logic here
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => {
        // Implement logout
      }}
    ]);
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Overlay */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          >
            <Animated.View style={[
              {
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              },
              overlayAnimatedStyle
            ]} />
          </TouchableOpacity>

          {/* Sidebar */}
          <Animated.View style={[
            {
              width: SIDEBAR_WIDTH,
              backgroundColor: colors.background,
            },
            sidebarAnimatedStyle
          ]}>
            <BlurView intensity={40} style={{ flex: 1 }}>
              <LinearGradient
                colors={[
                  colors.glassBackgroundUltra + 'F0',
                  colors.background + 'E6',
                ]}
                style={{ flex: 1 }}
              >
                <SafeAreaView style={{ flex: 1 }}>
                  {/* Header */}
                  <View style={{
                    padding: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.glassBorder,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <TouchableOpacity
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: colors.neonTeal + '20',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}
                        onPress={handleProfilePress}
                      >
                        <Text style={{ fontSize: 20 }}>{getNicheEmoji()}</Text>
                      </TouchableOpacity>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={[commonStyles.subtitle, { 
                          color: colors.text,
                          fontSize: 16,
                          marginBottom: 2,
                        }]}>
                          {user?.email?.split('@')[0] || 'User'}
                        </Text>
                        <Text style={[commonStyles.textSmall, { 
                          color: colors.textSecondary,
                        }]}>
                          {profile?.niche || 'Creator'}
                        </Text>
                      </View>
                      
                      <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* New Project Button */}
                    <TouchableOpacity
                      style={[commonStyles.primaryButton, {
                        backgroundColor: colors.neonTeal,
                        shadowColor: colors.glowNeonTeal,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 6,
                      }]}
                      onPress={() => setShowNewProject(true)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="add" size={20} color={colors.background} />
                        <Text style={[commonStyles.primaryButtonText, { 
                          marginLeft: 8,
                          color: colors.background,
                        }]}>
                          New Conversation
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Conversations List */}
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                    {conversations.length === 0 ? (
                      <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 40,
                      }}>
                        <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                        <Text style={[commonStyles.text, {
                          color: colors.textSecondary,
                          textAlign: 'center',
                          marginTop: 16,
                        }]}>
                          No conversations yet.{'\n'}Start a new one to begin!
                        </Text>
                      </View>
                    ) : (
                      conversations.map((conversation) => (
                        <TouchableOpacity
                          key={conversation.id}
                          style={{
                            backgroundColor: conversation.is_active 
                              ? colors.neonTeal + '20' 
                              : colors.glassBackground,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 12,
                            borderWidth: conversation.is_active ? 2 : 1,
                            borderColor: conversation.is_active 
                              ? colors.neonTeal + '40' 
                              : colors.glassBorder,
                          }}
                          onPress={() => handleConversationPress(conversation)}
                          onLongPress={() => handleConversationDelete(conversation.id)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, marginRight: 12 }}>
                              {conversation.emoji}
                            </Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[commonStyles.subtitle, {
                                color: conversation.is_active ? colors.neonTeal : colors.text,
                                fontSize: 16,
                                marginBottom: 4,
                              }]}>
                                {conversation.title}
                              </Text>
                              <Text style={[commonStyles.textSmall, {
                                color: colors.textSecondary,
                              }]}>
                                {formatTimeAgo(conversation.last_message_at)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </SafeAreaView>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>

      {/* New Project Modal */}
      <NewProjectModal
        visible={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={handleNewProject}
      />

      {/* Profile Menu */}
      <UserProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onAccountSettings={handleAccountSettings}
        onSubscription={handleSubscription}
        onLogout={handleLogout}
      />
    </>
  );
}


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../hooks/useQuota';
import { storage } from '../utils/storage';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface VerificationChecklistProps {
  visible: boolean;
  onClose: () => void;
}

const VerificationChecklist: React.FC<VerificationChecklistProps> = ({ visible, onClose }) => {
  const { user, isGuest } = useAuth();
  const { quota } = useQuota();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const generateChecklist = useCallback(async () => {
    const savedItems = await storage.getSavedItems();
    
    const items: ChecklistItem[] = [
      {
        id: 'auth',
        title: 'Authentication',
        description: 'Can sign up/login/logout',
        completed: !isGuest,
      },
      {
        id: 'profile',
        title: 'Profile Setup',
        description: 'Complete onboarding profile',
        completed: !!(await storage.getOnboardingData()),
      },
      {
        id: 'generate_content',
        title: 'Generate Content',
        description: 'Generate Hook/Script/Caption',
        completed: quota.textRequests > 0,
      },
      {
        id: 'save_content',
        title: 'Save Content',
        description: 'Save generated content',
        completed: savedItems.length > 0,
      },
      {
        id: 'view_saved',
        title: 'View Saved Items',
        description: 'See saved items in Saved tab',
        completed: savedItems.length > 0,
      },
      {
        id: 'quota_system',
        title: 'Quota System',
        description: 'Quota decreases with usage',
        completed: quota.textRequests > 0 || quota.imageRequests > 0,
      },
      {
        id: 'upgrade_modal',
        title: 'Upgrade Modal',
        description: 'Upgrade modal triggers when limit reached',
        completed: quota.textRequests >= quota.maxTextRequests || quota.imageRequests >= quota.maxImageRequests,
      },
      {
        id: 'image_tool',
        title: 'Image Generation',
        description: 'Image tool respects limit',
        completed: quota.imageRequests > 0,
      },
      {
        id: 'export_data',
        title: 'Export Data',
        description: 'Export/download functionality works',
        completed: false, // This would need to be tracked separately
      },
      {
        id: 'guest_mode',
        title: 'Guest Mode',
        description: 'Guest mode saves locally, merges after login',
        completed: isGuest ? savedItems.length > 0 : true,
      },
    ];

    setChecklist(items);
  }, [isGuest, quota]);

  useEffect(() => {
    if (visible) {
      generateChecklist();
    }
  }, [visible, generateChecklist]);

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Verification Checklist</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.grey} />
            </TouchableOpacity>
          </View>

          <View style={styles.progress}>
            <Text style={styles.progressText}>
              {completedCount} of {totalCount} completed ({Math.round(completionPercentage)}%)
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
            </View>
          </View>

          <ScrollView style={styles.checklistContainer}>
            {checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistItem,
                  item.completed && styles.checklistItemCompleted,
                ]}
                onPress={item.action}
                disabled={!item.action}
              >
                <View style={styles.checklistLeft}>
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={item.completed ? colors.success : colors.grey}
                  />
                  <View style={styles.checklistText}>
                    <Text style={[
                      styles.checklistTitle,
                      item.completed && styles.checklistTitleCompleted,
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.checklistDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                {item.action && (
                  <Ionicons name="chevron-forward" size={20} color={colors.grey} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Complete all items to ensure full app functionality
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  progress: {
    padding: 20,
  },
  progressText: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  checklistContainer: {
    flex: 1,
    padding: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  checklistItemCompleted: {
    backgroundColor: colors.success + '10',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checklistText: {
    marginLeft: 12,
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  checklistTitleCompleted: {
    color: colors.success,
  },
  checklistDescription: {
    fontSize: 14,
    color: colors.grey,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
});

export default VerificationChecklist;

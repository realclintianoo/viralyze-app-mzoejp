
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, commonStyles } from '../styles/commonStyles';
import AnimatedButton from './AnimatedButton';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'text' | 'image';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose, type }) => {
  const handleUpgrade = () => {
    // TODO: Implement actual upgrade flow
    console.log('Upgrade to Pro');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.grey} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons 
              name={type === 'text' ? 'document-text' : 'image'} 
              size={48} 
              color={colors.accent} 
            />
          </View>

          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            You've reached your daily limit for {type === 'text' ? 'AI text generation' : 'AI image generation'}
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Unlimited AI text generation</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Unlimited AI image creation</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Guideline Guardian tool</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>

          <AnimatedButton
            title="Upgrade to Pro - $9.99/month"
            onPress={handleUpgrade}
            style={styles.upgradeButton}
          />

          <TouchableOpacity onPress={onClose} style={styles.laterButton}>
            <Text style={styles.laterText}>Maybe later</Text>
          </TouchableOpacity>
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 16,
  },
  laterButton: {
    padding: 8,
  },
  laterText: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
  },
});

export default UpgradeModal;


import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import AnimatedButton from './AnimatedButton';

interface SetupGuideProps {
  visible: boolean;
  onClose: () => void;
}

export default function SetupGuide({ visible, onClose }: SetupGuideProps) {
  const openOpenAILink = () => {
    Linking.openURL('https://platform.openai.com/api-keys');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Setup Guide</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Get OpenAI API Key</Text>
            </View>
            <Text style={styles.stepDescription}>
              Visit OpenAI's platform to create an API key for your account.
            </Text>
            <AnimatedButton
              title="Open OpenAI Platform"
              onPress={openOpenAILink}
              variant="secondary"
              style={styles.linkButton}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Create .env File</Text>
            </View>
            <Text style={styles.stepDescription}>
              In your project root directory, create a file named .env with the following content:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {`# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://vcgqzbqyknxaekniddfl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here`}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Replace API Key</Text>
            </View>
            <Text style={styles.stepDescription}>
              Replace "your_openai_api_key_here" with your actual OpenAI API key from step 1.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Restart App</Text>
            </View>
            <Text style={styles.stepDescription}>
              Stop the development server and restart it for the environment variables to take effect.
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {`# Stop the server (Ctrl+C)
# Then restart with:
npm run dev`}
              </Text>
            </View>
          </View>

          <View style={styles.warningSection}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Important Security Note</Text>
              <Text style={styles.warningText}>
                Never commit your .env file to version control. Add it to your .gitignore file to keep your API keys secure.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedButton
            title="Got it!"
            onPress={onClose}
            style={styles.doneButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.grey,
    lineHeight: 22,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  codeText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    width: '100%',
  },
});

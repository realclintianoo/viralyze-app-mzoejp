
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import VerificationChecklist from './VerificationChecklist';

const FloatingVerificationButton: React.FC = () => {
  const [showChecklist, setShowChecklist] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowChecklist(true)}
      >
        <Ionicons name="checkmark-done" size={24} color={colors.white} />
      </TouchableOpacity>

      <VerificationChecklist
        visible={showChecklist}
        onClose={() => setShowChecklist(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});

export default FloatingVerificationButton;

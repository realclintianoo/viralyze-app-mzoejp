
import React, { createContext, useContext, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const getToastColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'warning': return colors.warning;
      default: return colors.accent;
    }
  };

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            style={[
              styles.toast,
              { borderLeftColor: getToastColor(toast.type) }
            ]}
          >
            <Ionicons
              name={getToastIcon(toast.type)}
              size={20}
              color={getToastColor(toast.type)}
              style={styles.toastIcon}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
});

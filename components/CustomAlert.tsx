import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable, 
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type CustomAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  icon?: string;
};

export default function CustomAlert({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  icon
}: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <BlurView intensity={30} style={styles.overlay} tint="dark">
        <View style={styles.centeredView}>
          <LinearGradient
            colors={['#092121', '#153434']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalView}
          >
            {/* Icon if provided */}
            {icon && (
              <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={22} color="#85c3c0" />
              </View>
            )}
            
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Message */}
            <Text style={styles.message}>{message}</Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.button, 
                  isDestructive ? styles.destructiveButton : styles.confirmButton,
                  loading && styles.disabledButton
                ]}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                )}
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  centeredView: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalView: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  iconContainer: {
    marginBottom: 16,
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: 'rgba(67, 124, 121, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#CDEDEC',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  confirmButton: {
    backgroundColor: '#437C79',
  },
  destructiveButton: {
    backgroundColor: '#A83232',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
}); 
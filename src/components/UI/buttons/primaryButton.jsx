import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

export default function PrimaryButton({
  text,
  onPress,
  loading = false,
  disabled = false,
  iconName = 'arrow-forward',
  style,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.submitButton,
        disabled && { opacity: 0.7 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <>
          <Text style={styles.submitButtonText}>{text}</Text>
          {iconName && (
            <Ionicons
              name={iconName}
              size={20}
              color="#ffffff"
              style={styles.buttonArrow}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: theme.colors.primary, 
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3c7330',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
  },
  buttonArrow: {
    marginLeft: 8,
  },
});

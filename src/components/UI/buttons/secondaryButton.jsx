import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../../styles/theme';

export default function SecondaryButton({ text, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.secondaryButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: theme.fontFamily.semiBold,
  },
});

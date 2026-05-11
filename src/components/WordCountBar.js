import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function WordCountBar({ content }) {
  const { colors } = useTheme();
  
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  
  return (
    <View style={[styles.container, { borderTopColor: colors.cardBorder, backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.subtext }]}>{words} words</Text>
      <Text style={[styles.text, { color: colors.subtext }]}>{chars} chars</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 12, borderTopWidth: 1, justifyContent: 'space-around' },
  text: { fontSize: 12, fontWeight: '500' },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = [
  '#FFFFFF', '#FFD6D6', '#FFE8CC', '#FFFACC',
  '#D6FFD6', '#CCF0FF', '#E8CCFF', '#FFD6F0'
];

export function ColorPicker({ selected, onChange }) {
  return (
    <View style={styles.container}>
      {COLORS.map(c => (
        <TouchableOpacity
          key={c}
          style={[styles.colorBubble, { backgroundColor: c }, selected === c && styles.selected]}
          onPress={() => onChange(c)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  colorBubble: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#0002' },
  selected: { borderWidth: 3, borderColor: '#6C63FF' },
});

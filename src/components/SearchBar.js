import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export function SearchBar({ value, onChangeText }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
      <Ionicons name="search" size={20} color={colors.subtext} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder="Search notes..."
        placeholderTextColor={colors.subtext}
        value={value}
        onChangeText={onChangeText}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={colors.subtext} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  clearBtn: { padding: 4 },
});

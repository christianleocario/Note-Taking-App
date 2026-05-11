import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, themeMode, changeTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontSize: 16 }}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>THEME</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {['light', 'dark', 'system'].map((mode, i) => (
            <TouchableOpacity key={mode} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.cardBorder }]} onPress={() => changeTheme(mode)}>
              <Text style={[styles.modeText, { color: colors.text, textTransform: 'capitalize' }]}>{mode}</Text>
              {themeMode === mode && <Text style={{ color: colors.accent, fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  modeText: { fontSize: 16 },
});

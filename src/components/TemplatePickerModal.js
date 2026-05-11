import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export const TEMPLATES = [
  { key: 'blank', label: 'Blank Note', content: '' },
  { key: 'daily_journal', label: 'Daily Journal', content: '# How was your day?\n\n# Highlights\n- \n\n# Lowlights\n- ' },
  { key: 'meeting_notes', label: 'Meeting Notes', content: '# Attendees\n- \n\n# Agenda\n1. \n\n# Action Items\n- [ ] ' },
  { key: 'shopping_list', label: 'Checklist', content: 'Groceries' },
  { key: 'study_note', label: 'Study Note', content: '# Topic\n\n## Key Concepts\n- \n\n## Summary\n' },
];

export function TemplatePickerModal({ visible, onSelect, onClose }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const renderPreview = (key) => {
    const lineBg = isDark ? '#ffffff20' : '#00000020';
    const borderBg = isDark ? '#ffffff40' : '#00000040';

    switch(key) {
      case 'blank':
        return <View style={styles.previewLines} />;
      case 'daily_journal':
        return (
          <View style={styles.previewLines}>
            <View style={[styles.previewLine, { width: '60%', height: 6, backgroundColor: colors.accent, marginBottom: 8 }]} />
            <View style={[styles.previewLine, { backgroundColor: lineBg }]} />
            <View style={[styles.previewLine, { backgroundColor: lineBg }]} />
          </View>
        );
      case 'meeting_notes':
        return (
          <View style={styles.previewLines}>
            <View style={[styles.previewLine, { width: '40%', height: 6, backgroundColor: colors.text, marginBottom: 8 }]} />
            <View style={[styles.previewLine, { width: '80%', marginLeft: 8, backgroundColor: lineBg }]} />
            <View style={[styles.previewLine, { width: '80%', marginLeft: 8, backgroundColor: lineBg }]} />
          </View>
        );
      case 'shopping_list':
        return (
          <View style={styles.previewLines}>
            <View style={styles.previewCheckboxRow}><View style={[styles.previewCheckbox, { borderColor: borderBg }]} /><View style={[styles.previewLine, { backgroundColor: lineBg, flex: 1, marginBottom: 0 }]} /></View>
            <View style={styles.previewCheckboxRow}><View style={[styles.previewCheckbox, { borderColor: borderBg }]} /><View style={[styles.previewLine, { backgroundColor: lineBg, flex: 1, marginBottom: 0 }]} /></View>
          </View>
        );
      case 'study_note':
        return (
          <View style={styles.previewLines}>
            <View style={[styles.previewLine, { width: '50%', height: 8, backgroundColor: '#fcd34d', marginBottom: 8 }]} />
            <View style={[styles.previewLine, { backgroundColor: lineBg }]} />
            <View style={[styles.previewLine, { backgroundColor: lineBg }]} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Choose Template</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {TEMPLATES.map(t => (
              <TouchableOpacity 
                key={t.key} 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} 
                onPress={() => onSelect(t)}
                activeOpacity={0.8}
              >
                <View style={[styles.previewContainer, { backgroundColor: colors.bg, borderBottomColor: colors.cardBorder }]}>
                  {renderPreview(t.key)}
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '47%', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  previewContainer: { height: 120, padding: 12, borderBottomWidth: 1 },
  label: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
  
  // Preview Elements
  previewLines: { flex: 1 },
  previewLine: { height: 4, borderRadius: 2, marginBottom: 6, width: '100%' },
  previewCheckboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  previewCheckbox: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
});

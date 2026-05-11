import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CustomDatePickerModal } from './CustomDatePickerModal';

export function ChecklistItemRow({ item, onToggle, onChangeText, onDelete, onSetDueDate }) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggle} style={[styles.checkbox, { borderColor: colors.accent, backgroundColor: item.checked ? colors.accent : 'transparent' }]}>
        {item.checked && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
      <TextInput
        style={[styles.input, { color: item.checked ? colors.subtext : colors.text, textDecorationLine: item.checked ? 'line-through' : 'none' }]}
        value={item.text}
        onChangeText={onChangeText}
        placeholder="Item..."
        placeholderTextColor={colors.subtext}
      />
      
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBtn}>
        <Text style={{ fontSize: 12, color: item.dueDate ? colors.accent : colors.subtext }}>
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '📅'}
        </Text>
      </TouchableOpacity>

      <CustomDatePickerModal
        visible={showPicker}
        value={item.dueDate ? new Date(item.dueDate) : new Date()}
        onChange={(date) => { setShowPicker(false); if (date) onSetDueDate(date); }}
        onClose={() => setShowPicker(false)}
        mode="date"
      />

      <TouchableOpacity onPress={onDelete} style={styles.delBtn}>
        <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkIcon: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  input: { flex: 1, fontSize: 16 },
  dateBtn: { padding: 4 },
  delBtn: { padding: 4 },
});

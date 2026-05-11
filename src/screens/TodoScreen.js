import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Modal, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useSelection } from '../context/SelectionContext';
import { SearchBar } from '../components/SearchBar';
import { SelectionActionBar } from '../components/SelectionActionBar';
import { CustomDatePickerModal } from '../components/CustomDatePickerModal';

// ─── To-do row card ──────────────────────────────────────────────────────────
function TodoRow({ note, colors, onPress, onLongPress, isSelected, isSelectMode, onSelect, onToggleCheck }) {
  const allDone = note.checklistItems?.length > 0 && note.checklistItems.every(i => i.checked);

  return (
    <TouchableOpacity
      onPress={isSelectMode ? onSelect : onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={[
        styles.todoRow,
        { backgroundColor: colors.card, borderColor: isSelected ? '#FFD700' : colors.cardBorder },
        isSelected && { borderWidth: 2 },
      ]}
    >
      {/* Title row */}
      <View style={styles.todoTitleRow}>
        <TouchableOpacity
          onPress={onToggleCheck}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.todoCheckbox, allDone && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            {allDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <Text
          style={[
            styles.todoTitle,
            { color: colors.text },
            allDone && { textDecorationLine: 'line-through', color: colors.subtext },
          ]}
          numberOfLines={1}
        >
          {note.title || note.content || 'Untitled'}
        </Text>

        {/* Reminder badge */}
        {note.reminder && (
          <View style={styles.todoTimeBadge}>
            <Ionicons name="time-outline" size={12} color={colors.subtext} />
            <Text style={[styles.todoTime, { color: colors.subtext }]}>
              {new Date(note.reminder).toLocaleDateString([], { month: '2-digit', day: '2-digit' })} {new Date(note.reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {/* Select checkbox */}
        {isSelectMode && (
          <View style={[styles.selBox, isSelected && styles.selBoxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── To-do Edit/Create Bottom Sheet ──────────────────────────────────────────
function TodoSheet({ visible, onClose, onSave, colors, isDark, editingNote }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [reminder, setReminder] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const sheetBg = isDark ? '#1C2431' : '#F3F4F6';

  const isEditing = !!editingNote;

  // Pre-fill when editing
  useEffect(() => {
    if (visible && editingNote) {
      setText(editingNote.title || editingNote.content || '');
      setReminder(editingNote.reminder ? new Date(editingNote.reminder) : null);
    } else if (visible) {
      setText('');
      setReminder(null);
    }
  }, [visible, editingNote]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), reminder, editingNote?.id || null);
      setText('');
      setReminder(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: sheetBg, paddingBottom: insets.bottom + 12 }]}>
          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {isEditing ? 'Edit To-do' : 'New To-do'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Input */}
          <View style={[styles.sheetInput, { backgroundColor: isDark ? '#2A3447' : '#E5E7EB' }]}>
            <TextInput
              autoFocus
              placeholder="Add a To-do item"
              placeholderTextColor={colors.subtext}
              style={[styles.inputText, { color: colors.text }]}
              value={text}
              onChangeText={setText}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Set alerts + Save */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: isDark ? '#2A3447' : '#E5E7EB' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="time-outline" size={15} color={reminder ? colors.accent : colors.subtext} />
              <Text style={[styles.alertText, { color: reminder ? colors.accent : colors.subtext }]}>
                {reminder
                  ? `${reminder.toLocaleDateString([], { month: '2-digit', day: '2-digit' })} ${reminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Set alerts'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: text.trim() ? colors.accent : colors.subtext }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomDatePickerModal
        visible={showDatePicker}
        value={reminder || new Date()}
        onChange={(d) => setReminder(d)}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}

// ─── Collapsible Section Header ──────────────────────────────────────────────
function SectionHeader({ title, count, isCollapsed, onToggle, colors }) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
        {title}
      </Text>
      <Ionicons
        name={isCollapsed ? 'chevron-down' : 'chevron-up'}
        size={18}
        color={colors.subtext}
      />
    </TouchableOpacity>
  );
}

// ─── Main TodoScreen ─────────────────────────────────────────────────────────
export function TodoScreen() {
  const navigation = useNavigation();
  const { notes, addNote, updateNote, toggleFavorite, togglePin, bulkDelete, bulkPin, bulkFavorite, toggleChecked } = useNotes();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { setIsSelecting } = useSelection();
  const [search, setSearch] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());
  const [showTodoSheet, setShowTodoSheet] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [activeCollapsed, setActiveCollapsed] = useState(false);
  const isSelectMode = selectedNoteIds.size > 0;

  const todoNotes = useMemo(() => {
    const q = search.toLowerCase();
    return notes.filter(
      n => n.isChecklist && !n.isDeleted && (q === '' || (n.title + n.content).toLowerCase().includes(q))
    );
  }, [notes, search]);

  const completed = todoNotes.filter(n => n.checklistItems?.every(i => i.checked) && n.checklistItems?.length > 0);
  const active = todoNotes.filter(n => !completed.includes(n));

  const toggleSelection = (id) => {
    const s = new Set(selectedNoteIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedNoteIds(s);
    setIsSelecting(s.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === todoNotes.length) {
      setSelectedNoteIds(new Set());
      setIsSelecting(false);
    } else {
      setSelectedNoteIds(new Set(todoNotes.map(n => n.id)));
      setIsSelecting(true);
    }
  };

  const clearSelection = () => {
    setSelectedNoteIds(new Set());
    setIsSelecting(false);
  };

  // Open sheet for editing an existing to-do
  const handleTodoPress = (note) => {
    setEditingNote(note);
    setShowTodoSheet(true);
  };

  // Open sheet for creating a new to-do
  const handleNewTodo = () => {
    setEditingNote(null);
    setShowTodoSheet(true);
  };

  const handleSaveTodo = (text, reminder, existingId) => {
    if (existingId) {
      // Update existing
      updateNote(existingId, {
        title: text,
        reminder: reminder ? reminder.toISOString() : undefined,
      });
    } else {
      // Create new
      addNote({
        title: text,
        content: '',
        isChecklist: true,
        checklistItems: [{ id: Date.now().toString(), text, checked: false }],
        reminder: reminder ? reminder.toISOString() : undefined,
      });
    }
  };

  const handleToggleCheck = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note?.checklistItems?.length > 0) {
      toggleChecked(noteId, note.checklistItems[0].id);
    }
  };

  // Build flat list data with section headers
  const listData = useMemo(() => {
    const data = [];

    // Not Completed section
    if (active.length > 0) {
      data.push({ _type: 'section', title: 'Not Completed', key: 'active', collapsed: activeCollapsed });
      if (!activeCollapsed) {
        active.forEach(n => data.push({ _type: 'todo', ...n }));
      }
    }

    // Completed section
    if (completed.length > 0) {
      data.push({ _type: 'section', title: 'Completed', key: 'completed', collapsed: completedCollapsed });
      if (!completedCollapsed) {
        completed.forEach(n => data.push({ _type: 'todo', ...n }));
      }
    }

    return data;
  }, [active, completed, activeCollapsed, completedCollapsed]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>To-do</Text>
      </View>

      <View style={{ paddingTop: 8 }}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) => item._type === 'section' ? `section-${item.key}` : item.id}
        renderItem={({ item }) => {
          if (item._type === 'section') {
            return (
              <SectionHeader
                title={item.title}
                isCollapsed={item.collapsed}
                onToggle={() => {
                  if (item.key === 'active') setActiveCollapsed(!activeCollapsed);
                  else setCompletedCollapsed(!completedCollapsed);
                }}
                colors={colors}
              />
            );
          }

          return (
            <TodoRow
              note={item}
              colors={colors}
              isSelected={selectedNoteIds.has(item.id)}
              isSelectMode={isSelectMode}
              onSelect={() => toggleSelection(item.id)}
              onPress={() => handleTodoPress(item)}
              onLongPress={() => !isSelectMode && toggleSelection(item.id)}
              onToggleCheck={() => handleToggleCheck(item.id)}
            />
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={52} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No to-dos yet. Tap + to create one!</Text>
          </View>
        }
      />

      {/* FAB */}
      {!isSelectMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={handleNewTodo}
        >
          <Ionicons name="add" size={32} color="#000" />
        </TouchableOpacity>
      )}

      {/* Selection mode */}
      {isSelectMode && (
        <SelectionActionBar
          selectedCount={selectedNoteIds.size}
          onSelectAll={handleSelectAll}
          onDelete={() => { bulkDelete(Array.from(selectedNoteIds)); setSelectedNoteIds(new Set()); }}
          onPin={() => { bulkPin(Array.from(selectedNoteIds)); setSelectedNoteIds(new Set()); }}
          onFavorite={() => { bulkFavorite(Array.from(selectedNoteIds)); setSelectedNoteIds(new Set()); }}
          onClose={() => setSelectedNoteIds(new Set())}
        />
      )}

      {/* To-do create/edit bottom sheet */}
      <TodoSheet
        visible={showTodoSheet}
        onClose={() => { setShowTodoSheet(false); setEditingNote(null); }}
        onSave={handleSaveTodo}
        colors={colors}
        isDark={isDark}
        editingNote={editingNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800' },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600' },

  // ── TodoRow ──
  todoRow: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  todoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  todoTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  todoTime: { fontSize: 11 },
  selBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selBoxSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },

  // ── TodoSheet ──
  sheetOverlay: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  sheetInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  inputText: { fontSize: 15 },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  alertText: { fontSize: 14, fontWeight: '500' },
  saveText: { fontSize: 16, fontWeight: '700' },
});

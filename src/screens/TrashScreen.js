import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { NoteCard } from '../components/NoteCard';

export function TrashScreen() {
  const navigation = useNavigation();
  const { notes, updateNote, saveNotes } = useNotes();
  const { colors } = useTheme();

  const trashNotes = notes.filter(n => n.isDeleted);

  const handleRestore = (id) => updateNote(id, { isDeleted: false, deletedAt: undefined });
  
  const handlePermanentDelete = (id) => {
    Alert.alert('Permanent Delete', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveNotes(notes.filter(n => n.id !== id)) },
    ]);
  };

  const handleEmptyTrash = () => {
    Alert.alert('Empty Trash', 'Permanently delete all notes in trash?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Empty', style: 'destructive', onPress: () => saveNotes(notes.filter(n => !n.isDeleted)) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontSize: 16 }}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Trash</Text>
        <TouchableOpacity onPress={handleEmptyTrash} disabled={trashNotes.length === 0}>
          <Text style={{ color: trashNotes.length === 0 ? colors.subtext : colors.danger, fontSize: 16 }}>Empty</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={trashNotes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View>
            <NoteCard note={item} onPress={() => {}} />
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accentLight }]} onPress={() => handleRestore(item.id)}>
                <Text style={{ color: colors.accent }}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.dangerLight }]} onPress={() => handlePermanentDelete(item.id)}>
                <Text style={{ color: colors.danger }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗑</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>Trash is empty.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: -8, marginBottom: 16, paddingHorizontal: 8 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});

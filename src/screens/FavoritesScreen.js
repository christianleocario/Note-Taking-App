import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { NoteCard } from '../components/NoteCard';
import { SearchBar } from '../components/SearchBar';

export function FavoritesScreen() {
  const navigation = useNavigation();
  const { notes, toggleFavorite, togglePin } = useNotes();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const favoriteNotes = useMemo(() => {
    const q = search.toLowerCase();
    return notes.filter(n => n.isFavorite && !n.isDeleted && (q === '' || n.title.toLowerCase().includes(q)));
  }, [notes, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
      </View>
      <View style={{ paddingTop: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={favoriteNotes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NoteCard 
            note={item} 
            onPress={() => navigation.navigate(item.isLocked ? 'PINScreen' : 'NoteEditor', { noteId: item.id, mode: 'unlock' })}
            onFavorite={() => toggleFavorite(item.id)} 
            onPin={() => togglePin(item.id)} 
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No favorites yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});

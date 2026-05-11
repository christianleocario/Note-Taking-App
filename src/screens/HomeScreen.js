import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useSelection } from '../context/SelectionContext';
import { NoteCard } from '../components/NoteCard';
import { SearchBar } from '../components/SearchBar';
import { TemplatePickerModal } from '../components/TemplatePickerModal';
import { CalendarStrip } from '../components/CalendarStrip';
import { SelectionActionBar } from '../components/SelectionActionBar';

export function HomeScreen() {
  const navigation = useNavigation();
  const { notes, addNote, toggleFavorite, togglePin, deleteNote, bulkDelete, bulkPin, bulkFavorite } = useNotes();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { setIsSelecting } = useSelection();
  
  const [search, setSearch] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [isGrid, setIsGrid] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());

  const scrollY = useRef(new Animated.Value(0)).current;
  const isSelectMode = selectedNoteIds.size > 0;

  const activeNotes = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = notes.filter(n => {
      if (n.isDeleted) return false;
      if (q !== '' && !n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
      if (selectedDateFilter && n.reminder) {
        const rDate = new Date(n.reminder);
        if (rDate.toDateString() !== selectedDateFilter.toDateString()) return false;
      }
      return true;
    });
    const pinned = filtered.filter(n => n.isPinned);
    const unpinned = filtered.filter(n => !n.isPinned);
    return [...pinned, ...unpinned];
  }, [notes, search, selectedDateFilter]);

  const handleTemplateSelect = (template) => {
    setShowTemplate(false);
    const isChecklist = template.key === 'shopping_list';
    const note = addNote({ template: template.key, content: template.content, isChecklist });
    navigation.navigate('NoteEditor', { noteId: note.id });
  };

  const handlePress = (note) => {
    if (note.isLocked) {
      navigation.navigate('PINScreen', { noteId: note.id, mode: 'unlock' });
    } else {
      navigation.navigate('NoteEditor', { noteId: note.id });
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedNoteIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedNoteIds(newSet);
    setIsSelecting(newSet.size > 0);
  };

  const handleLongPress = (note) => {
    if (!isSelectMode) {
      const newSet = new Set(selectedNoteIds);
      newSet.add(note.id);
      setSelectedNoteIds(newSet);
      setIsSelecting(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === activeNotes.length) {
      setSelectedNoteIds(new Set());
      setIsSelecting(false);
    } else {
      setSelectedNoteIds(new Set(activeNotes.map(n => n.id)));
      setIsSelecting(true);
    }
  };

  const clearSelection = () => {
    setSelectedNoteIds(new Set());
    setIsSelecting(false);
  };

  const renderNote = ({ item }) => (
    <NoteCard 
      note={item} 
      isGrid={isGrid}
      isSelected={selectedNoteIds.has(item.id)}
      isSelectMode={isSelectMode}
      onSelect={() => toggleSelection(item.id)}
      onPress={() => handlePress(item)} 
      onLongPress={() => handleLongPress(item)} 
      onFavorite={() => toggleFavorite(item.id)} 
      onPin={() => togglePin(item.id)} 
    />
  );

  const headerTitleSize = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [32, 20],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      
      <Animated.View style={[styles.header, { backgroundColor: colors.bg, paddingTop: insets.top + 16 }]}>
        <Animated.Text style={[styles.title, { color: colors.text, fontSize: headerTitleSize }]}>
          Notie
        </Animated.Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsGrid(!isGrid)} style={styles.iconBtn}>
            <Ionicons name={isGrid ? "list" : "grid"} size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Trash')} style={styles.iconBtn}>
            <Ionicons name="trash" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconBtn}>
            <Ionicons name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.FlatList
        key={isGrid ? 'grid' : 'list'}
        data={activeNotes}
        keyExtractor={item => item.id}
        numColumns={isGrid ? 2 : 1}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            <SearchBar value={search} onChangeText={setSearch} />
            <CalendarStrip onSelectDate={(date) => {
              setSelectedDateFilter(prev => prev?.toDateString() === date.toDateString() ? null : date);
            }} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {search || selectedDateFilter ? 'No notes match your criteria.' : 'No notes yet. Tap + to create one!'}
            </Text>
          </View>
        }
      />

      {!isSelectMode && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.text }]} onPress={() => setShowTemplate(true)}>
          <Ionicons name="add" size={32} color={colors.bg} />
        </TouchableOpacity>
      )}

      {isSelectMode && (
        <SelectionActionBar
          selectedCount={selectedNoteIds.size}
          onSelectAll={handleSelectAll}
          onDelete={() => { bulkDelete(Array.from(selectedNoteIds)); clearSelection(); }}
          onPin={() => { bulkPin(Array.from(selectedNoteIds)); clearSelection(); }}
          onFavorite={() => { bulkFavorite(Array.from(selectedNoteIds)); clearSelection(); }}
          onClose={clearSelection}
        />
      )}

      <TemplatePickerModal visible={showTemplate} onSelect={handleTemplateSelect} onClose={() => setShowTemplate(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 12, 
    zIndex: 10 
  },
  title: { fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  listHeaderContainer: { marginBottom: 10 },
  list: { padding: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
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
    shadowRadius: 6 
  },
});

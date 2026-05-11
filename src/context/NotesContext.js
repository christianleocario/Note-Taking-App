import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = '@app_notes';
const NotesContext = createContext();

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY).then(val => {
      if (val) setNotes(JSON.parse(val));
    });
  }, []);

  const saveNotes = async (newNotes) => {
    setNotes(newNotes);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
  };

  const addNote = (overrides = {}) => {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      color: '#FFFFFF',
      isFavorite: false,
      isPinned: false,
      isLocked: false,
      isDeleted: false,
      isChecklist: false,
      checklistItems: [],
      images: [],
      voiceNotes: [],
      template: 'blank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
    saveNotes([newNote, ...notes]);
    return newNote;
  };

  const updateNote = (id, changes) => {
    saveNotes(
      notes.map(n =>
        n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const deleteNote = (id) => {
    updateNote(id, { isDeleted: true, deletedAt: new Date().toISOString() });
  };

  const toggleFavorite = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) updateNote(id, { isFavorite: !note.isFavorite });
  };

  const togglePin = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) updateNote(id, { isPinned: !note.isPinned });
  };

  const bulkDelete = (ids) => {
    saveNotes(notes.map(n => ids.includes(n.id) ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n));
  };

  const bulkPin = (ids) => {
    const targets = notes.filter(n => ids.includes(n.id));
    const shouldPin = targets.some(n => !n.isPinned);
    saveNotes(notes.map(n => ids.includes(n.id) ? { ...n, isPinned: shouldPin, updatedAt: new Date().toISOString() } : n));
  };

  const bulkFavorite = (ids) => {
    const targets = notes.filter(n => ids.includes(n.id));
    const shouldFav = targets.some(n => !n.isFavorite);
    saveNotes(notes.map(n => ids.includes(n.id) ? { ...n, isFavorite: shouldFav, updatedAt: new Date().toISOString() } : n));
  };

  const addChecklistItem = (noteId, item) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { checklistItems: [...note.checklistItems, item] });
    }
  };

  const removeChecklistItem = (noteId, itemId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, {
        checklistItems: note.checklistItems.filter(i => i.id !== itemId),
      });
    }
  };

  const toggleChecked = (noteId, itemId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, {
        checklistItems: note.checklistItems.map(i =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        ),
      });
    }
  };

  return (
    <NotesContext.Provider value={{
      notes, addNote, updateNote, deleteNote, toggleFavorite, togglePin,
      bulkDelete, bulkPin, bulkFavorite,
      addChecklistItem, removeChecklistItem, toggleChecked, saveNotes
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const formatPreview = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
};

// Custom pin icon that matches the reference design (upright thumbtack style)
function PinIcon({ size = 16, color }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pin head (circle) */}
      <View style={{
        width: size * 0.55,
        height: size * 0.55,
        borderRadius: size * 0.275,
        backgroundColor: color,
        position: 'absolute',
        top: 0,
      }} />
      {/* Pin body (thin line) */}
      <View style={{
        width: 2,
        height: size * 0.6,
        backgroundColor: color,
        position: 'absolute',
        bottom: 0,
        borderRadius: 1,
      }} />
    </View>
  );
}

export function NoteCard({ note, isGrid = false, isSelected = false, isSelectMode = false, onSelect, onPress, onLongPress, onFavorite, onPin }) {
  const { colors, isDark } = useTheme();

  const bgColor = note.color === '#FFFFFF' ? colors.card : note.color;
  // Determine if we're on a light card — use dark text
  const isLightCard = note.color !== '#FFFFFF' || !isDark;
  const textColor = isLightCard && note.color !== '#FFFFFF' ? '#111827' : colors.text;
  const subtextColor = isLightCard && note.color !== '#FFFFFF' ? '#4B5563' : colors.subtext;

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { backgroundColor: bgColor, borderColor: isSelected ? '#F59E0B' : colors.cardBorder }, 
        isGrid && styles.cardGrid,
        isSelected && styles.cardSelected,
      ]}
      onPress={isSelectMode ? onSelect : onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {note.isLocked ? 'Locked Note' : (note.title || 'Untitled Note')}
          </Text>
          <View style={styles.actions}>
            {isSelectMode ? (
              // Clean square checkbox — no icon overlay
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            ) : (
              <>
                {note.isLocked && <Ionicons name="lock-closed" size={15} color={textColor} style={styles.iconMargin} />}
                {note.isPinned && <PinIcon size={15} color={textColor} />}
                {onFavorite && (
                  <TouchableOpacity onPress={onFavorite} style={styles.actionBtn}>
                    <Ionicons
                      name={note.isFavorite ? 'heart' : 'heart-outline'}
                      size={15}
                      color={note.isFavorite ? '#EF4444' : textColor}
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {!note.isLocked && (
          <>
            <Text style={[styles.preview, { color: subtextColor }]} numberOfLines={isGrid ? 5 : 2}>
              {note.isChecklist ? 'Checklist items...' : formatPreview(note.content || 'No content')}
            </Text>
            {note.images && note.images.length > 0 && (
              <View style={styles.imagePreview}>
                {note.images.slice(0, 3).map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.thumbnail} />
                ))}
              </View>
            )}
            <View style={styles.footer}>
              <Text style={[styles.date, { color: subtextColor }]}>
                Created: {new Date(note.createdAt).toLocaleDateString()}{'\n'}
                {note.updatedAt !== note.createdAt ? `Modified: ${new Date(note.updatedAt).toLocaleDateString()}` : ''}
              </Text>
              <View style={styles.badges}>
                {note.reminder && <Ionicons name="alarm" size={13} color={subtextColor} />}
                {note.voiceNotes && note.voiceNotes.length > 0 && <Ionicons name="mic" size={13} color={subtextColor} />}
              </View>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardGrid: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#FFD700', // Vibrant Gold
  },
  content: { padding: 14, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: { padding: 2 },
  iconMargin: { marginRight: 2 },
  preview: { fontSize: 14, lineHeight: 20, marginBottom: 12, flex: 1 },
  imagePreview: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  thumbnail: { width: 40, height: 40, borderRadius: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  date: { fontSize: 10, lineHeight: 14 },
  badges: { flexDirection: 'row', gap: 4 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  }
});

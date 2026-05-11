import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Redesigned SelectionActionBar:
 * - Top header row: [X] [Count] [Select All Checkbox]
 * - Bottom action row: [Pin] [Favorite] [Delete]
 * Matches reference: "The selection modal (Pin, Favorite, Delete) i dont want it in the top"
 */
export function SelectionActionBar({ selectedCount, onSelectAll, onDelete, onPin, onFavorite, onClose }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const borderColor = isDark ? '#ffffff18' : '#00000018';

  return (
    <>
      {/* Top row: [X]  {N} Item(s) Selected  [select-all checkbox] */}
      <View style={[styles.topContainer, {
        backgroundColor: isDark ? '#111827' : '#F9FAFB',
        paddingTop: insets.top + 4,
        borderBottomColor: borderColor,
      }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.countText, { color: colors.text }]}>
            {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'} Selected
          </Text>

          <TouchableOpacity onPress={onSelectAll} style={styles.selectAllBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <View style={[styles.selectAllBox, { borderColor: colors.text }]}>
               {selectedCount > 0 && <Ionicons name="checkmark" size={15} color={colors.text} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: [Pin] | [Favorite] | [Delete] */}
      <View style={[styles.bottomContainer, {
        backgroundColor: isDark ? '#111827' : '#F9FAFB',
        paddingBottom: insets.bottom + 8,
        borderTopColor: borderColor,
      }]}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionItem} onPress={onPin}>
            <Ionicons name="pin" size={22} color={colors.text} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Pin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onFavorite}>
            <Ionicons name="heart-outline" size={22} color={colors.text} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onDelete}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
            <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBtn: { padding: 4 },
  countText: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    marginLeft: 12,
  },
  selectAllBtn: { padding: 4 },
  selectAllBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },
  actionItem: {
    alignItems: 'center',
    gap: 5,
    minWidth: 60,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { CustomDatePickerModal } from './CustomDatePickerModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_WIDTH = 58; // item width + horizontal margins

function buildDayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3); // 3 months back
  const end = new Date(today);
  end.setMonth(end.getMonth() + 9); // 9 months forward

  const arr = [];
  const cur = new Date(start);
  while (cur <= end) {
    arr.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return arr;
}

const ALL_DAYS = buildDayRange();

export function CalendarStrip({ onSelectDate }) {
  const { colors } = useTheme();
  const { notes } = useNotes();

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(todayMidnight);
  const [visibleMonthLabel, setVisibleMonthLabel] = useState(todayMidnight);
  const [showPicker, setShowPicker] = useState(false);
  const listRef = useRef(null);

  const todayIndex = ALL_DAYS.findIndex(d => d.getTime() === todayMidnight.getTime());

  // Scroll to today on mount
  useEffect(() => {
    const idx = todayIndex >= 0 ? todayIndex : 0;
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.3 });
    }, 100);
  }, []);

  const hasNoteOnDate = useCallback((date) => {
    return notes.some(n => {
      if (!n.reminder || n.isDeleted) return false;
      const r = new Date(n.reminder);
      return r.getDate() === date.getDate() &&
             r.getMonth() === date.getMonth() &&
             r.getFullYear() === date.getFullYear();
    });
  }, [notes]);

  const handleDayPress = (item) => {
    setSelectedDate(item);
    if (onSelectDate) onSelectDate(item);
  };

  const handlePickerChange = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setVisibleMonthLabel(d);
    if (onSelectDate) onSelectDate(d);
    // Scroll to the selected date
    const idx = ALL_DAYS.findIndex(x => x.getTime() === d.getTime());
    if (idx >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
      }, 150);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const mid = viewableItems[Math.floor(viewableItems.length / 2)];
      if (mid?.item) setVisibleMonthLabel(mid.item);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderDay = ({ item }) => {
    const isSel = item.getTime() === selectedDate.getTime();
    const hasNote = hasNoteOnDate(item);

    return (
      <TouchableOpacity
        style={[styles.dayCell, isSel && { backgroundColor: colors.text }]}
        onPress={() => handleDayPress(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayLabel, { color: isSel ? colors.bg : colors.subtext }]}>
          {DAYS[item.getDay()]}
        </Text>
        <Text style={[styles.dayNum, { color: isSel ? colors.bg : colors.text }]}>
          {item.getDate()}
        </Text>
        {hasNote && (
          <View style={[styles.dot, { backgroundColor: isSel ? colors.bg : colors.accent }]} />
        )}
      </TouchableOpacity>
    );
  };

  const monthLabel = `${visibleMonthLabel.toLocaleString('default', { month: 'long' })}, ${visibleMonthLabel.getFullYear()}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.monthBtn}>
        <Text style={[styles.monthText, { color: colors.text }]}>{monthLabel} ▾</Text>
      </TouchableOpacity>

      <CustomDatePickerModal
        visible={showPicker}
        value={selectedDate}
        onChange={handlePickerChange}
        onClose={() => setShowPicker(false)}
        mode="date"
      />

      <FlatList
        ref={listRef}
        data={ALL_DAYS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.getTime().toString()}
        renderItem={renderDay}
        getItemLayout={(_, index) => ({ length: DAY_WIDTH, offset: DAY_WIDTH * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
        initialNumToRender={40}
        maxToRenderPerBatch={30}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  monthBtn: { paddingHorizontal: 16, marginBottom: 8 },
  monthText: { fontSize: 16, fontWeight: '600' },
  listContent: { paddingHorizontal: 8 },
  dayCell: {
    width: 50,
    height: 64,
    marginHorizontal: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  dayNum: { fontSize: 17, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
});

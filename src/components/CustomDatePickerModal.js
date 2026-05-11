import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// ─── Generate data arrays ────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MONTH_ITEMS = MONTHS_SHORT.map((m, i) => ({ label: m, value: i }));

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function generateDayItems(month, year) {
  const count = getDaysInMonth(month, year);
  return Array.from({ length: count }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
}

function generateYearItems() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { label: `${y}`, value: y };
  });
}

// For datetime mode: month+day combined column
function generateDateItems(year) {
  const items = [];
  for (let m = 0; m < 12; m++) {
    const days = getDaysInMonth(m, year);
    for (let d = 1; d <= days; d++) {
      items.push({ label: `${MONTHS_SHORT[m]} ${d}`, month: m, day: d });
    }
  }
  return items;
}

const HOURS = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ label: `${i}`.padStart(2, '0'), value: i }));
const AMPM = [{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }];

// ─── Scroll Wheel Column ─────────────────────────────────────────────────────
function WheelColumn({ data, selectedIndex, onSelect, width, colors }) {
  const listRef = useRef(null);
  const scrolling = useRef(false);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0 && !scrolling.current) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [selectedIndex]);

  const handleMomentumEnd = useCallback((e) => {
    scrolling.current = false;
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    onSelect(clampedIndex);
  }, [data.length, onSelect]);

  const handleScrollBegin = useCallback(() => {
    scrolling.current = true;
  }, []);

  const renderItem = useCallback(({ item, index }) => {
    const isSelected = index === selectedIndex;
    return (
      <View style={[styles.wheelItem, { width }]}>
        <Text style={[
          styles.wheelText,
          { color: isSelected ? colors.text : colors.subtext },
          isSelected && styles.wheelTextSelected,
        ]}>
          {item.label}
        </Text>
      </View>
    );
  }, [selectedIndex, colors, width]);

  const padCount = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={[styles.wheelContainer, { width, height: PICKER_HEIGHT }]}>
      <View style={[styles.highlightBar, { top: padCount * ITEM_HEIGHT }]} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollBeginDrag={handleScrollBegin}
        contentContainerStyle={{
          paddingTop: padCount * ITEM_HEIGHT,
          paddingBottom: padCount * ITEM_HEIGHT,
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={7}
      />
    </View>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
/**
 * @param {string} mode - 'date' for Month/Day/Year only, 'datetime' for date+time
 */
export function CustomDatePickerModal({ visible, value, onChange, onClose, mode = 'datetime' }) {
  const { colors, isDark } = useTheme();
  const initDate = value || new Date();
  const isDateOnly = mode === 'date';

  // ── Year items ──
  const yearItems = useMemo(() => generateYearItems(), []);

  // ── State for DATE-ONLY mode (3 columns: Month, Day, Year) ──
  const [monthIdx, setMonthIdx] = useState(initDate.getMonth());
  const [yearIdx, setYearIdx] = useState(() => {
    const yItems = generateYearItems();
    const idx = yItems.findIndex(y => y.value === initDate.getFullYear());
    return idx >= 0 ? idx : 2;
  });

  const selectedYear = yearItems[yearIdx]?.value || initDate.getFullYear();
  const dayItems = useMemo(() => generateDayItems(monthIdx, selectedYear), [monthIdx, selectedYear]);
  const [dayIdx, setDayIdx] = useState(Math.min(initDate.getDate() - 1, dayItems.length - 1));

  // Clamp day when month/year changes
  useEffect(() => {
    if (dayIdx >= dayItems.length) {
      setDayIdx(dayItems.length - 1);
    }
  }, [dayItems.length]);

  // ── State for DATETIME mode (4 columns: DateCombo, Hour, Minute, AM/PM) ──
  const dateItems = useMemo(() => generateDateItems(selectedYear), [selectedYear]);
  const initDateComboIdx = dateItems.findIndex(
    d => d.month === initDate.getMonth() && d.day === initDate.getDate()
  );
  const [dateComboIdx, setDateComboIdx] = useState(Math.max(0, initDateComboIdx));

  const initHourRaw = initDate.getHours();
  const initAmPm = initHourRaw >= 12 ? 'PM' : 'AM';
  const initHour12 = initHourRaw % 12 === 0 ? 12 : initHourRaw % 12;
  const [hourIdx, setHourIdx] = useState(initHour12 - 1);
  const [minuteIdx, setMinuteIdx] = useState(initDate.getMinutes());
  const [ampmIdx, setAmpmIdx] = useState(initAmPm === 'PM' ? 1 : 0);

  // ── Build header text ──
  const getHeaderText = () => {
    if (isDateOnly) {
      const d = new Date(selectedYear, monthIdx, (dayItems[dayIdx]?.value || 1));
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      const combo = dateItems[dateComboIdx] || dateItems[0];
      const h = HOURS[hourIdx]?.value || 12;
      const m = MINUTES[minuteIdx]?.value ?? 0;
      const ap = AMPM[ampmIdx]?.value || 'AM';
      const d = new Date(selectedYear, combo.month, combo.day);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      return `${dayName}, ${monthName} ${combo.day}, ${selectedYear} at ${h}:${String(m).padStart(2, '0')} ${ap}`;
    }
  };

  const handleDone = () => {
    let result;
    if (isDateOnly) {
      result = new Date(selectedYear, monthIdx, dayItems[dayIdx]?.value || 1);
    } else {
      const combo = dateItems[dateComboIdx] || dateItems[0];
      let hours24 = HOURS[hourIdx]?.value || 12;
      const ap = AMPM[ampmIdx]?.value || 'AM';
      if (ap === 'AM' && hours24 === 12) hours24 = 0;
      else if (ap === 'PM' && hours24 !== 12) hours24 += 12;
      result = new Date(selectedYear, combo.month, combo.day, hours24, MINUTES[minuteIdx]?.value ?? 0);
    }
    onChange(result);
    onClose();
  };

  if (!visible) return null;

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const divider = isDark ? '#38383A' : '#E5E7EB';
  const screenWidth = Dimensions.get('window').width - 48;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bg }]}>
          {/* Header */}
          <Text style={[styles.headerText, { color: colors.text }]}>{getHeaderText()}</Text>

          {/* Scroll wheels */}
          <View style={styles.wheelsRow}>
            {isDateOnly ? (
              <>
                {/* Month / Day / Year */}
                <WheelColumn
                  data={MONTH_ITEMS}
                  selectedIndex={monthIdx}
                  onSelect={setMonthIdx}
                  width={screenWidth * 0.33}
                  colors={colors}
                />
                <WheelColumn
                  data={dayItems}
                  selectedIndex={dayIdx}
                  onSelect={setDayIdx}
                  width={screenWidth * 0.22}
                  colors={colors}
                />
                <WheelColumn
                  data={yearItems}
                  selectedIndex={yearIdx}
                  onSelect={setYearIdx}
                  width={screenWidth * 0.30}
                  colors={colors}
                />
              </>
            ) : (
              <>
                {/* Date combo / Hour / Minute / AM-PM */}
                <WheelColumn
                  data={dateItems}
                  selectedIndex={dateComboIdx}
                  onSelect={setDateComboIdx}
                  width={screenWidth * 0.35}
                  colors={colors}
                />
                <WheelColumn
                  data={HOURS}
                  selectedIndex={hourIdx}
                  onSelect={setHourIdx}
                  width={screenWidth * 0.15}
                  colors={colors}
                />
                <WheelColumn
                  data={MINUTES}
                  selectedIndex={minuteIdx}
                  onSelect={setMinuteIdx}
                  width={screenWidth * 0.18}
                  colors={colors}
                />
                <WheelColumn
                  data={AMPM}
                  selectedIndex={ampmIdx}
                  onSelect={setAmpmIdx}
                  width={screenWidth * 0.18}
                  colors={colors}
                />
              </>
            )}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: divider }]}>
            <TouchableOpacity style={styles.footerBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.subtext }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={[styles.footerDivider, { backgroundColor: divider }]} />
            <TouchableOpacity style={styles.footerBtn} onPress={handleDone}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  wheelContainer: {
    overflow: 'hidden',
  },
  highlightBar: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#ffffff10',
    zIndex: 0,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 18,
  },
  wheelTextSelected: {
    fontWeight: '700',
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 52,
  },
  footerBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
});

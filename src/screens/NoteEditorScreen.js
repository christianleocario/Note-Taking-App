import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
  Alert, Modal, Platform, StatusBar, Keyboard, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, actions, RichToolbar } from 'react-native-pell-rich-editor';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { ChecklistItemRow } from '../components/ChecklistItemRow';
import { CustomDatePickerModal } from '../components/CustomDatePickerModal';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEXT_COLORS = [
  '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#32ADE6', '#007AFF', '#5856D6', '#FF2D55',
  '#A2845E', '#8E8E93',
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// ─── Popover (rich content, floats above anchor) ─────────────────────────────
function Popover({ visible, anchor, children, colors, kbOffset = 0, maxWidth = 280 }) {
  const [sz, setSz] = useState(null);

  if (!visible || !anchor) return null;

  const screenW = Dimensions.get('window').width;
  const w = Math.min(sz?.width ?? maxWidth, maxWidth);
  const h = sz?.height ?? 44;

  const cx = anchor.x + anchor.w / 2;
  const left = clamp(cx - w / 2, 8, screenW - w - 8);
  // Anchor.y is absolute from screen top; lift above keyboard too
  const toolbarH = 60;
  const bottom = kbOffset + toolbarH + 12;

  return (
    <View pointerEvents="box-none" style={[styles.popoverWrap, { left, bottom, width: w }]}>
      <View
        onLayout={e => setSz(e.nativeEvent.layout)}
        style={[styles.popover, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        {children}
      </View>
    </View>
  );
}

// ─── Unified tooltip — BELOW icon if near top, ABOVE toolbar otherwise ────────
function LabelTip({ tip, colors, kbOffset = 0 }) {
  if (!tip) return null;
  const { text, anchor } = tip;
  const screenW = Dimensions.get('window').width;
  const approxW = text.length * 9 + 24;
  const left = clamp(anchor.x + anchor.w / 2 - approxW / 2, 8, screenW - approxW - 8);
  // Header icons sit within the top ~180px on any device (incl. large safe areas)
  const HEADER_MAX_Y = 180;
  const isHeaderIcon = (anchor.y + anchor.h) < HEADER_MAX_Y;
  const posStyle = isHeaderIcon
    ? { top: anchor.y + anchor.h + 32 }        // appear directly BELOW the icon
    : { bottom: kbOffset + 60 + 8 };           // appear ABOVE the bottom toolbar
  return (
    <View pointerEvents="none" style={[styles.labelTipWrap, { left, width: approxW }, posStyle]}>
      <Text style={[styles.labelTipText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

export function NoteEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { noteId } = route.params;
  const { notes, updateNote, addChecklistItem, removeChecklistItem, toggleChecked } = useNotes();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const note = notes.find(n => n.id === noteId);
  const [title, setTitle] = useState(note?.title || '');
  const [isChecklist, setIsChecklist] = useState(note?.isChecklist || false);
  const [reminder, setReminder] = useState(note?.reminder ? new Date(note.reminder) : undefined);
  const [isDirty, setIsDirty] = useState(false);   // true when unsaved changes exist

  // Store originals to compare against
  const originalTitle = useRef(note?.title || '');
  const originalContent = useRef(note?.content || '');

  // Toolbar / popover state
  const [formatOpen, setFormatOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [showColorRow, setShowColorRow] = useState(false);
  const [formatAnchor, setFormatAnchor] = useState(null);
  const [alignAnchor, setAlignAnchor] = useState(null);
  const [labelTip, setLabelTip] = useState(null); // { text, anchor }

  const [showUrlPrompt, setShowUrlPrompt] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const richText = useRef(null);
  const scrollRef = useRef(null);
  // All icon refs (header + bottom toolbar)
  const hBackRef  = useRef(null);
  const hUndoRef  = useRef(null);
  const hRedoRef  = useRef(null);
  const hSaveRef  = useRef(null);
  const imageBtnRef = useRef(null);
  const micBtnRef = useRef(null);
  const formatBtnRef = useRef(null);
  const alignBtnRef = useRef(null);
  const checklistBtnRef = useRef(null);
  const reminderBtnRef = useRef(null);

  const editorRef = useRef();

  // Animated bottom offset for the absolutely-positioned toolbar
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const [kbHeight, setKbHeight] = useState(0);
  const longPressFiredRef = useRef(false);

  const TOOLBAR_HEIGHT = 70; // Must match or exceed the actual rendered height of the toolbar to prevent overlap

  const measureRectInWindow = (ref, cb) => {
    ref.current?.measureInWindow?.((x, y, w, h) => cb({ x, y, w, h }));
  };

  const showLabelTip = (text, ref) => {
    measureRectInWindow(ref, (rect) => setLabelTip({ text, anchor: rect }));
  };

  const onIconLongPress = (text, ref) => {
    longPressFiredRef.current = true;
    showLabelTip(text, ref);
  };

  const onIconPressOut = () => {
    setLabelTip(null);
    // onPressOut can fire before onPress; delay reset so onPress can detect long-press
    setTimeout(() => { longPressFiredRef.current = false; }, 0);
  };

  // ─── Keyboard tracking (reference approach) ─────────────────────────────────
  // Toolbar is absolutely positioned; bottomAnim drives it up/down.
  // Uses screenY to calculate exact keyboard height — more reliable than height field.
  useEffect(() => {
    const screenH = Dimensions.get('window').height;

    const getKbH = e => {
      const kbY = e?.endCoordinates?.screenY ?? screenH;
      const raw = screenH - kbY;
      // Floating keyboard: small height OR not anchored to bottom
      const isFloating = raw < 250 && kbY < screenH - raw;
      return isFloating ? 0 : Math.max(0, raw);
    };

    const onShow = e => {
      const h = getKbH(e);
      setKbHeight(h);
      Animated.timing(bottomAnim, {
        toValue: h,
        duration: Platform.OS === 'ios' ? (e?.duration ?? 250) : 250,
        useNativeDriver: false,
      }).start();
    };

    // Frame event fires continuously during resize drag — follow finger with no animation
    const onFrame = e => {
      const h = getKbH(e);
      setKbHeight(h);
      bottomAnim.setValue(h);
    };

    const onHide = () => {
      setKbHeight(0);
      Animated.timing(bottomAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    };

    const showEvent  = Platform.OS === 'ios' ? 'keyboardWillShow'        : 'keyboardDidShow';
    const frameEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame';

    const show  = Keyboard.addListener(showEvent,  onShow);
    const frame = Keyboard.addListener(frameEvent, onFrame);
    const hide  = Keyboard.addListener('keyboardDidHide', onHide);
    return () => { show.remove(); frame.remove(); hide.remove(); };
  }, [bottomAnim]);

  // Auto-save title continuously
  useEffect(() => { updateNote(noteId, { title, isChecklist }); }, [title, isChecklist]);

  // Save content and go back
  const handleSave = useCallback(() => {
    richText.current?.blurContentEditor();   // dismiss keyboard cleanly
    richText.current?.getContentHtml().then(html => {
      updateNote(noteId, { title, content: html, isChecklist, reminder: reminder?.toISOString() });
    }).catch(() => {
      updateNote(noteId, { title, isChecklist, reminder: reminder?.toISOString() });
    });
    navigation.goBack();
  }, [title, isChecklist, reminder, noteId]);

  // Blur editor when user navigates away (hardware back / swipe)
  const handleBack = useCallback(() => {
    richText.current?.blurContentEditor();
    navigation.goBack();
  }, [navigation]);

  // ─── Image: use ImagePicker's built-in base64 (avoids FileSystem issues) ───
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
        base64: true,          // get base64 directly — no FileSystem needed
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert('Error', 'Could not read image data. Please try another image.');
          return;
        }
        const mime = asset.type === 'image' && asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mime};base64,${asset.base64}`;
        richText.current?.insertImage(
          dataUri,
          'max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0;'
        );
      }
    } catch (e) {
      console.error('Image pick error:', e);
      Alert.alert('Error', 'Failed to pick image: ' + e?.message);
    }
  };

  // ─── Formatting: use sendAction for native pell-rich-editor commands ────
  const fmt = (action) => richText.current?.sendAction(action, 'result', null, null);

  // ─── Alignment: use correct execCommand approach ─────────────────────────
  const applyAlign = (dir) => {
    const cmd = dir === 'left' ? 'justifyLeft' : dir === 'center' ? 'justifyCenter' : 'justifyRight';
    richText.current?.commandDOM(`document.execCommand('${cmd}', false, null)`);
    setAlignOpen(false);
  };

  // ─── Undo/Redo: use RichEditor built-in methods ──────────────────────────
  const handleUndo = () => richText.current?.sendAction(actions.undo, 'result', null, null);
  const handleRedo = () => richText.current?.sendAction(actions.redo, 'result', null, null);

  const applyTextColor = (c) => {
    richText.current?.setForeColor(c);
    setShowColorRow(false);
  };

  const handleInsertLink = () => {
    if (linkUrl.trim()) richText.current?.insertLink(linkUrl.trim(), linkUrl.trim());
    setLinkUrl('');
    setShowUrlPrompt(false);
  };

  const handleSetReminder = async (date) => {
    setReminder(date);
    updateNote(noteId, { reminder: date?.toISOString() });
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: { title: `Reminder: ${title || 'Note'}`, body: 'You have a reminder.' },
          trigger: { date },
        });
      }
    } catch {}
  };

  // Close any open popovers when user focuses the editor
  const onEditorFocus = () => {
    setFormatOpen(false);
    setAlignOpen(false);
    setShowColorRow(false);
    setLabelTip(null);
  };

  if (!note) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.bg }]}>
        <TouchableOpacity
          ref={hBackRef}
          onPress={handleBack}
          onLongPress={() => onIconLongPress('Go Back', hBackRef)}
          onPressOut={onIconPressOut}
          delayLongPress={350}
          style={styles.headerLeft}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notes</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            ref={hUndoRef}
            onPress={handleUndo}
            onLongPress={() => onIconLongPress('Undo', hUndoRef)}
            onPressOut={onIconPressOut}
            delayLongPress={350}
            style={styles.hBtn}
          >
            <Ionicons name="return-down-back-outline" size={24} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity
            ref={hRedoRef}
            onPress={handleRedo}
            onLongPress={() => onIconLongPress('Redo', hRedoRef)}
            onPressOut={onIconPressOut}
            delayLongPress={350}
            style={styles.hBtn}
          >
            <Ionicons name="return-down-forward-outline" size={24} color={colors.subtext} />
          </TouchableOpacity>
          {isDirty && (
            <TouchableOpacity
              ref={hSaveRef}
              onPress={handleSave}
              onLongPress={() => onIconLongPress('Save', hSaveRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.hBtn}
            >
              <Ionicons name="checkmark" size={30} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Title — pinned outside scroll so it never scrolls away ─────── */}
      <TextInput
        value={title}
        onChangeText={t => { setTitle(t); setIsDirty(t !== originalTitle.current); }}
        placeholder="Title"
        placeholderTextColor={colors.subtext}
        style={[styles.titleInput, { color: colors.text }]}
        maxLength={120}
        
      />

      {/* ── Content — scrollable body ──────────────────────────────────── */}
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          
          { paddingBottom: TOOLBAR_HEIGHT + (insets.bottom > 0 ? insets.bottom : 16) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        indicatorStyle={isDark ? 'white' : 'black'}
      >
        {isChecklist ? (
          <View style={styles.checklistArea}>
            {note.checklistItems.map(item => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleChecked(noteId, item.id)}
                onChangeText={text => updateNote(noteId, { checklistItems: note.checklistItems.map(i => i.id === item.id ? { ...i, text } : i) })}
                onDelete={() => removeChecklistItem(noteId, item.id)}
                onSetDueDate={date => updateNote(noteId, { checklistItems: note.checklistItems.map(i => i.id === item.id ? { ...i, dueDate: date?.toISOString() } : i) })}
              />
            ))}
            <TouchableOpacity
              style={[styles.addItemBtn, { borderColor: colors.accent + '55', backgroundColor: colors.accentLight }]}
              onPress={() => addChecklistItem(noteId, { id: Date.now().toString(), text: '', checked: false })}
            >
              <Text style={[styles.addItemText, { color: colors.accent }]}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        ) :
         (
          
           <RichEditor
            ref={richText}
            initialContentHTML={note?.content || ''}
            onChange={html => { setIsDirty(html !== originalContent.current); }}
            placeholder="Note something down..."
            onFocus={onEditorFocus}
            editorStyle={{
              backgroundColor: colors.bg,        // fix: was hardcoded #bf4e4e
              color: colors.text,
              placeholderColor: colors.subtext,
              contentCSSText: `
                font-size: 16px;
                line-height: 1.7;
                font-family: -apple-system, sans-serif;
                word-break: break-word;
                padding-bottom: 40px;
              `,
            }}
            useContainer={false}
            style={{ minHeight: 300 }}
            onCursorPosition={y => scrollRef.current?.scrollTo({ y: y - 80, animated: true })}
          />
        )}

        {showVoice && (
          <View style={{ marginTop: 16 }}>
            <VoiceRecorder onSave={vn => {
              updateNote(noteId, { voiceNotes: [...(note.voiceNotes || []), vn] });
              setShowVoice(false);
            }} />
          </View>
        )}

        {note.voiceNotes?.map(vn => (
          <View key={vn.id} style={[styles.voiceChip, { backgroundColor: colors.card }]}>
            <Ionicons name="mic" size={16} color={colors.accent} />
            <Text style={{ color: colors.text, marginLeft: 8 }}>
              Voice Note · {new Date(vn.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>

      {/* ── Bottom Toolbar — absolutely positioned, lifted by bottomAnim ─── */}
      {!isChecklist && (
        <Animated.View style={[
          styles.toolbarWrap,
          {
            position: 'relative',
            left: 0,
            right: 0,
            bottom: bottomAnim,
            paddingBottom: 20,
          },
        ]}>
          <View style={styles.toolbar}>
            <TouchableOpacity
              ref={imageBtnRef}
              onPress={() => { if (longPressFiredRef.current) return; handlePickImage(); }}
              onLongPress={() => onIconLongPress('Image', imageBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Ionicons name="image-outline" size={26} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              ref={micBtnRef}
              onPress={() => { if (longPressFiredRef.current) return; setShowVoice(v => !v); }}
              onLongPress={() => onIconLongPress('Voice', micBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Ionicons name="mic-outline" size={26} color={showVoice ? colors.accent : colors.text} />
            </TouchableOpacity>

            {/* Text Format (Bold / Italic / Color / Link) */}
            <TouchableOpacity
              ref={formatBtnRef}
              onPress={() => {
                if (longPressFiredRef.current) return;
                if (formatOpen) { setFormatOpen(false); setShowColorRow(false); return; }
                setAlignOpen(false);
                setShowColorRow(false);
                measureRectInWindow(formatBtnRef, (rect) => { setFormatAnchor(rect); setFormatOpen(true); });
              }}
              onLongPress={() => onIconLongPress('Text Format', formatBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Text style={[styles.aaLabel, { color: colors.text }]}>Aa</Text>
            </TouchableOpacity>

            {/* Text Align (Left / Center / Right) */}
            <TouchableOpacity
              ref={alignBtnRef}
              onPress={() => {
                if (longPressFiredRef.current) return;
                if (alignOpen) { setAlignOpen(false); return; }
                setFormatOpen(false);
                setShowColorRow(false);
                measureRectInWindow(alignBtnRef, (rect) => { setAlignAnchor(rect); setAlignOpen(true); });
              }}
              onLongPress={() => onIconLongPress('Text Align', alignBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Ionicons name="list-outline" size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              ref={checklistBtnRef}
              onPress={() => { if (longPressFiredRef.current) return; setIsChecklist(v => !v); }}
              onLongPress={() => onIconLongPress('Checklist', checklistBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Ionicons name="checkmark-circle-outline" size={26} color={isChecklist ? colors.accent : colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              ref={reminderBtnRef}
              onPress={() => { if (longPressFiredRef.current) return; setShowReminderPicker(true); }}
              onLongPress={() => onIconLongPress('Reminder', reminderBtnRef)}
              onPressOut={onIconPressOut}
              delayLongPress={350}
              style={styles.tBtn}
            >
              <Ionicons name="time-outline" size={26} color={reminder ? colors.accent : colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Text Format Popover ───────────────────────────────────────── */}
      <Popover visible={formatOpen} anchor={formatAnchor} colors={colors} kbOffset={kbHeight}>
        <Text style={[styles.popoverTitle, { color: colors.subtext }]}>Text Format</Text>
        <View style={styles.popoverRow}>
          <TouchableOpacity onPress={() => fmt(actions.setBold)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.tBold, { color: colors.text }]}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fmt(actions.setItalic)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.tItalic, { color: colors.text }]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fmt(actions.setUnderline)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.tUnderline, { color: colors.text }]}>U</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fmt(actions.setStrikethrough)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.tStrike, { color: colors.text }]}>S</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowColorRow(v => !v)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="color-palette-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowUrlPrompt(true)} style={[styles.popoverBtn, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="link-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        {showColorRow && (
          <View style={[styles.swatchRow, { marginTop: 10 }]}>
            {TEXT_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => applyTextColor(c)}
                style={[styles.swatch, { backgroundColor: c, borderColor: c === '#FFFFFF' ? '#555' : 'transparent' }]} />
            ))}
          </View>
        )}
      </Popover>

      {/* ── Text Align Popover ────────────────────────────────────────── */}
      <Popover visible={alignOpen} anchor={alignAnchor} colors={colors} kbOffset={kbHeight}>
        <Text style={[styles.popoverTitle, { color: colors.subtext }]}>Text Align</Text>
        <View style={styles.alignRow}>
          {[
            { dir: 'left',   label: 'Left' },
            { dir: 'center', label: 'Center' },
            { dir: 'right',  label: 'Right' },
          ].map(({ dir, label }) => (
            <TouchableOpacity key={dir} onPress={() => applyAlign(dir)}
              style={[styles.alignBtn, { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: colors.subtext, fontSize: 11 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Popover>

      {/* ── Label tooltip (shared for header + toolbar icons) ───────────── */}
      <LabelTip tip={labelTip} colors={colors} kbOffset={kbHeight} />

      {/* ── Reminder Picker ─────────────────────────────────────────────── */}
      <CustomDatePickerModal
        visible={showReminderPicker}
        value={reminder || new Date()}
        onChange={date => { setShowReminderPicker(false); if (date) handleSetReminder(date); }}
        onClose={() => setShowReminderPicker(false)}
        mode="datetime"
      />

      {/* ── Link Modal ──────────────────────────────────────────────────── */}
      <Modal visible={showUrlPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 14 }}>Insert Link</Text>
            <TextInput
              style={[styles.linkInput, { color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="https://"
              placeholderTextColor={colors.subtext}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => { setShowUrlPrompt(false); setLinkUrl(''); }} style={styles.modalBtn}>
                <Text style={{ color: colors.subtext, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleInsertLink} style={styles.modalBtn}>
                <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>Insert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 12 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerTitle:   { fontSize: 20, fontWeight: '800' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hBtn:          { padding: 4 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0 },
  titleInput:    { fontSize: 26, fontWeight: '800', marginBottom: 2, paddingHorizontal: 25, paddingTop: 10, paddingBottom: 8, letterSpacing: 1},
 
  addItemBtn:    { borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  addItemText:   { fontSize: 14, fontWeight: '600' },
  voiceChip:     { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginTop: 8 },
  // Popover
  popoverWrap:   { position: 'absolute', zIndex: 200, elevation: 50 },
  popover:       { borderWidth: 1, borderRadius: 14, padding: 12,shadowOpacity: 0.28, shadowRadius: 10 },
  popoverTitle:  { fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  popoverRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  popoverBtn:    { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  // Plain label tooltip — no container, just text
  labelTipWrap:  { position: 'absolute', zIndex: 300, elevation: 40, alignItems: 'center' },
  labelTipText:  { fontSize: 12, fontWeight: '600', color: '#FFF', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, overflow: 'hidden' },
  swatchRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch:        { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  alignRow:      { flexDirection: 'row', gap: 10 },
  alignBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center', minWidth: 52 },
  // Header tooltip — below icon, minimal
  headerTipWrap: { position: 'absolute', zIndex: 400, elevation: 50 },
  headerTipText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, overflow: 'hidden', textAlign: 'center' },
  // Toolbar
  toolbarWrap:   {},
  toolbar:       { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10 },
  tBold:         { fontSize: 20, fontWeight: '900' },
  tItalic:       { fontSize: 20, fontStyle: 'italic', fontWeight: '600' },
  tUnderline:    { fontSize: 20, textDecorationLine: 'underline', fontWeight: '600' },
  tStrike:       { fontSize: 20, textDecorationLine: 'line-through', fontWeight: '600' },
  aaLabel:       { fontSize: 20, fontWeight: '600' },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalBox:      { width: '82%', padding: 22, borderRadius: 14 },
  linkInput:     { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 20 },
  modalRow:      { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  modalBtn:      { padding: 4 },
});

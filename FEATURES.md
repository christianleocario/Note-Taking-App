# 📝 Note-Taking App — Feature Specification

> **Platform:** React Native (Snack / Expo)
> **Entry Point:** `App.tsx`
> **Last Updated:** 2026-05-10 *(v2 — added 6 new features)*

---

## 📌 Project Overview

A feature-rich React Native note-taking application built with Expo (Snack-compatible). Designed to be modular and extensible so new features can be added or existing ones modified with minimal friction.

---

## ✅ Feature List

### 1. 🔤 Text Formatting
- **Bold**, *Italic*, and custom **Font Family / Style** support
- Applied inline within note body (rich text editor behavior)
- Toolbar or floating action bar for formatting controls
- Planned: Underline, strikethrough, text size options

---

### 2. 🔍 Search Bar
- Search notes by **title**
- Real-time filtering as the user types
- Displayed at the top of the notes list screen
- Planned: Full-text search (search within note body)

---

### 3. ⏰ Reminders / Alarm
- Set a **date & time reminder** per note
- Triggers a **local push notification** (via `expo-notifications`)
- Displayed on the note card with a clock icon
- Planned: Recurring reminders, snooze support

---

### 4. 🔐 Passcode / PIN Lock
- **Per-note toggle**: when creating or editing a note, user can enable PIN protection
- Locked notes require PIN entry before viewing
- PIN stored securely (e.g., via `expo-secure-store`)
- App-level PIN option (global lock) — future enhancement
- Planned: Biometric unlock (fingerprint / Face ID via `expo-local-authentication`)

---

### 5. 🖼️ Add Image
- Attach **one or more images** to a note
- Image picker via `expo-image-picker` (gallery or camera)
- Images displayed inline in the note body
- Planned: Image annotation, drag-to-reorder images

---

### 6. ✅ To-Do Tab
- Dedicated **To-do tab** in bottom navigation
- Automatically filters and displays notes that are marked as checklists
- Clean and separate view for all your tasks
- Planned: Sort to-dos by due date

---

### 7. 💾 Auto Save
- Notes are **automatically saved** as the user types (debounced, e.g., 500ms–1s delay)
- No manual "Save" button required
- Persisted locally via `AsyncStorage` or `expo-sqlite`
- Planned: Cloud sync / backup support

---

### 8. 🎨 Color Container (Note Color)
- Each note card has a **customizable color accent**
- Color picker with a predefined pastel palette (e.g., 8–12 colors)
- The entire note card background takes on the selected color for a vibrant aesthetic
- Planned: Custom hex color input, gradient themes

---

### 9. ✅ Checklist (To-Do List)
- Notes can include a **checklist mode** (toggle per note)
- Each checklist item has:
  - A checkbox (completed / not completed)
  - A **due date & time** picker
- Completed items are visually struck through
- Planned: Sub-tasks, priority levels, progress indicator

---

### 10. ↩️ Undo / Redo
- Standard **undo/redo stack** for text editing within a note
- Accessible via toolbar buttons or swipe gesture
- Minimum stack depth: 20 actions
- Planned: Persistent undo history across sessions

---

### 11. 📌 Pin Notes to Top
- Any note can be **pinned** so it always appears at the top of the list
- Pinned notes are visually distinguished (pin icon on card)
- Multiple notes can be pinned; pinned group sorted by last modified
- Planned: Custom ordering within pinned notes

---

### 12. 🗑️ Trash / Recycle Bin
- Deleted notes are moved to a **Trash tab** instead of being permanently removed
- Notes in Trash are **auto-deleted after 30 days**
- User can **restore** or **permanently delete** from Trash manually
- Trash item count shown as a badge on the tab
- Planned: Bulk restore / bulk delete

---

### 13. 🌙 Dark Mode / Theme Toggle
- Supports **Light**, **Dark**, and **System (auto-follow)** themes
- Toggle accessible from Settings or a quick-action button
- All screens, modals, and cards adapt to the selected theme
- Theme preference persisted via `AsyncStorage`
- Planned: Custom accent color, AMOLED pure-black mode

---

### 14. 🔤 Word & Character Count
- Live **word count** and **character count** displayed at the bottom of the note editor
- Updates in real-time as the user types
- Tapping the counter shows a detailed breakdown (words, chars, sentences, paragraphs)
- Planned: Reading time estimate (e.g., "~2 min read")

---

### 15. 📋 Note Templates
- Predefined templates selectable when creating a new note via the newly redesigned **Visual Preview Cards** modal.
- Built-in templates:
  - 📅 Daily Journal (Previews diary-style structure)
  - 🤝 Meeting Notes (Previews agenda formatting)
  - 🛒 Checklist (Previews checkbox layout)
  - 📖 Study Note (Previews highlighted sections)
  - 📝 Blank Note (Clean slate)
- User can also **save any note as a custom template**
- Planned: Import/export templates, community template sharing

---

### 16. 🎙️ Voice Notes + Transcription
- Record **audio directly inside a note** using the device microphone
- Audio playback controls (play, pause, seek bar, speed control) shown inline
- Optional **speech-to-text transcription** — converts recording to editable text in the note body
- Transcription runs on-device (no internet required) using the platform's native speech API
- Multiple recordings can be attached to a single note
- Recording indicated by a waveform / mic icon on the note card
- **Dependencies:** `expo-av` (recording & playback), `@react-native-voice/voice` (transcription)
- Planned: Noise cancellation, auto-punctuation, language selection

---

## 🗂️ Screen / Navigation Structure

```
App
├── HomeScreen            → Grid/List toggle + Search Bar + Calendar Strip + Note list
├── TodoScreen            → Filtered checklist/task notes
├── TrashScreen           → Deleted notes (restore / permanent delete)
├── NoteEditorScreen      → Create / Edit note
│   ├── Text Formatting Toolbar
│   ├── Checklist Mode Toggle
│   ├── Image Picker
│   ├── Voice Recorder + Transcription
│   ├── Color Picker
│   ├── Reminder Setter
│   ├── Template Picker (on new note)
│   ├── Word / Char Count Bar
│   └── PIN Toggle
├── PINScreen             → PIN entry for locked notes
├── TemplatesScreen       → Browse & manage note templates
└── SettingsScreen        → Theme toggle (Light/Dark/System), app preferences
```

---

## 🧰 Key Dependencies

| Package | Purpose |
|---|---|
| `expo-notifications` | Reminders / Alarms |
| `expo-image-picker` | Add Image feature |
| `expo-secure-store` | PIN / Passcode storage |
| `expo-local-authentication` | (Future) Biometric unlock |
| `@react-native-async-storage/async-storage` | Auto Save, Theme preference, persistence |
| `expo-sqlite` | (Alternative) Structured local storage |
| `react-native-pell-rich-editor` or custom impl | Rich text formatting |
| `expo-av` | Voice Notes — audio recording & playback |
| `@react-native-voice/voice` | Voice Notes — speech-to-text transcription |

---

## 🚀 Future / Planned Features

- [ ] Cloud Sync (Firebase / Supabase)
- [ ] Note sharing (export as PDF or plain text)
- [ ] Tags / Categories
- [ ] Folder organization
- [ ] Biometric unlock (fingerprint / Face ID)
- [ ] Full-text search (search inside note body)
- [ ] Recurring reminders
- [ ] Widget support (Android/iOS home screen)
- [ ] AMOLED pure-black theme
- [ ] Noise cancellation for voice recordings
- [ ] Voice note language selection
- [ ] Reading time estimate in word count
- [ ] Community template sharing
- [ ] AI Smart Summary (Gemini / OpenAI integration)
- [ ] Geo-tagged notes (attach location)
- [ ] OCR — scan text from photo

---

## 🔄 How to Extend This Document

When adding a new feature:
1. Add a new numbered section under **Feature List**
2. Include: description, sub-features, planned extensions
3. Update the **Screen / Navigation Structure** if new screens are added
4. Add any new packages to **Key Dependencies**
5. Move items from **Future / Planned Features** to the feature list once implemented

---


---

*This document serves as the single source of truth for app features. Update it whenever a feature is added, modified, or removed.*

# 🛠️ CHANGELOG

## [Unreleased] - Interactive Features & Multi-Select

### Added
- **Multi-Select Mode**: Long-pressing a note card on the Home Screen or To-Do list now enters a selection mode.
- **Bottom Action Panel**: Displays dynamic bulk actions when in selection mode (Select All, Bulk Pin, Bulk Favorite, Bulk Delete).
- **Study Note Template**: Added a new preset "Study Note" template.

### Changed
- **Template Picker**: Completely redesigned the template selection modal. Replaced plain text rows with visual "Preview Cards" representing the layout of the note (e.g., checkboxes for Shopping List, bold headers for Daily Journal).
- **Calendar Date Picker**: Clicking the "Month, Year" text below the search bar now opens a native, visually appealing date picker to easily change the calendar month.
- **Safe Area Insets**: Implemented `react-native-safe-area-context` across all screens to ensure UI elements (like headers and modals) never overlap with device notches or punch-hole cameras.

### Fixed
- **Calendar Dot Bug**: Fixed an issue where the reminder dot indicator on the calendar strip would persist even after the corresponding note was deleted.

## [Unreleased] - UI Overhaul (Notie Redesign)

### Added
- **Grid / List View Toggle**: Added a toggle button in the top right of the Home Screen to dynamically switch between 2-column Grid View and 1-column List View.
- **Scrollable Calendar Strip**: Introduced a horizontal date scroller below the search bar on the Home Screen.
  - Displays the month and year.
  - Users can select a specific date to filter their notes.
  - Days with scheduled note reminders display a visual dot indicator.
- **To-Do Tab**: Replaced the "Favorites" tab with a dedicated "To-do" tab in the bottom navigation.
  - The To-Do screen automatically filters the global notes list, showing only notes configured as checklists.
- **Note Formatting Previews**: Added basic Markdown preview parsing to `NoteCard` so that formatted text (like bold) appears accurately on the main screen without having to open the note.
- **Card Timestamps**: Added explicit `Created` and `Modified` date labels inside every note card.

### Changed
- **Header Animation**: Re-engineered the Home Screen header. The "Notie" title now dynamically shrinks responsively as the user scrolls down the list.
- **Note Card Styling**: Overhauled the note card UI. 
  - Instead of a side border, the entire note container now adopts the user-selected pastel color.
  - Text colors automatically adjust to ensure readability against bright backgrounds.
- **Iconography**:
  - Completely removed legacy text emojis (e.g., 🗑️, ⚙️, ⭐).
  - Replaced all visual markers with clean vector icons from `Ionicons` (`@expo/vector-icons`).
  - The "Favorite" marker was changed to a sleek **Pin** icon to match the reference design.
- **Floating Action Button (FAB)**: Recalibrated the FAB to ensure the "+" icon is perfectly centered using strict flexbox alignment.
- **Empty States**: Updated the empty states and messaging to reflect the new Notie style.

### Removed
- Removed the old `FavoritesScreen` from the bottom navigation in favor of the new `TodoScreen`.
- Deprecated emoji-based labels in favor of icon-based layout indicators.

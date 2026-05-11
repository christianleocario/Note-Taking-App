import React from 'react';
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotesProvider } from './src/context/NotesContext';
import { SelectionProvider } from './src/context/SelectionContext';
import { AppNavigator } from './src/navigation/AppNavigator';


LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications',
  'Expo AV has been deprecated',
]);

export default function App() {
  return (
    <SafeAreaProvider>
        <ThemeProvider>
          <NotesProvider>
            <SelectionProvider>
              <AppNavigator />
            </SelectionProvider>
          </NotesProvider>
        </ThemeProvider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { PINScreen } from '../screens/PINScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useSelection } from '../context/SelectionContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { colors } = useTheme();
  const { isSelecting } = useSelection();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: isSelecting
          ? { display: 'none' }
          : {
              backgroundColor: colors.headerBg,
              borderTopWidth: 0,
              elevation: 0,
              height: 75,
              paddingTop: 15,
              paddingBottom: 15,
            },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Notes') iconName = 'document-text';
          else if (route.name === 'To-do') iconName = 'checkmark-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Notes" component={HomeScreen} />
      <Tab.Screen name="To-do" component={TodoScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
        <Stack.Screen name="PINScreen" component={PINScreen} />
        <Stack.Screen name="Trash" component={TrashScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

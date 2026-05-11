import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';

export function PINScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { noteId, mode } = route.params;
  const { notes, updateNote } = useNotes();
  const { colors } = useTheme();

  const note = notes.find(n => n.id === noteId);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(mode === 'set' ? 'enter' : 'verify');

  const handlePress = (num) => {
    if (pin.length < 4 && step !== 'confirm') {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (step === 'enter') {
          setTimeout(() => setStep('confirm'), 200);
        } else if (step === 'verify') {
          setTimeout(() => verifyPin(newPin), 200);
        }
      }
    } else if (confirmPin.length < 4 && step === 'confirm') {
      const newConfirm = confirmPin + num;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        setTimeout(() => savePin(pin, newConfirm), 200);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'confirm') setConfirmPin(confirmPin.slice(0, -1));
    else setPin(pin.slice(0, -1));
  };

  const verifyPin = (entered) => {
    if (entered === note.pin) {
      navigation.replace('NoteEditor', { noteId });
    } else {
      Alert.alert('Incorrect PIN');
      setPin('');
    }
  };

  const savePin = (p1, p2) => {
    if (p1 === p2) {
      updateNote(noteId, { isLocked: true, pin: p1 });
      navigation.goBack();
    } else {
      Alert.alert('PINs do not match. Try again.');
      setPin('');
      setConfirmPin('');
      setStep('enter');
    }
  };

  const currentPin = step === 'confirm' ? confirmPin : pin;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 'enter' ? 'Set PIN' : step === 'confirm' ? 'Confirm PIN' : 'Enter PIN'}
        </Text>
        <View style={styles.dots}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[styles.dot, { borderColor: colors.text, backgroundColor: currentPin.length > i ? colors.text : 'transparent' }]} />
          ))}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <TouchableOpacity key={num} style={[styles.key, { backgroundColor: colors.card }]} onPress={() => handlePress(num.toString())}>
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.key} />
          <TouchableOpacity style={[styles.key, { backgroundColor: colors.card }]} onPress={() => handlePress('0')}>
            <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.key, { backgroundColor: colors.card }]} onPress={handleDelete}>
            <Text style={[styles.keyText, { color: colors.text }]}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, alignItems: 'flex-end' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 30 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 50 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  keypad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  key: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, fontWeight: '500' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';

export function VoiceRecorder({ onSave }) {
  const { colors } = useTheme();
  const [recording, setRecording] = useState();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  async function startRecording() {
    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      
      onSave({
        id: Date.now().toString(),
        uri,
        duration: 0, 
        createdAt: new Date().toISOString()
      });
      setRecording(undefined);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: isRecording ? colors.danger : colors.accent }]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.text}>{isRecording ? '⏹ Stop Recording' : '🎙 Record Voice'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 10 },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  text: { color: '#FFF', fontWeight: 'bold' }
});

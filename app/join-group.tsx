import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { joinGroupByCode } from '@/lib/groups';
import { useRouter } from 'expo-router';

export default function JoinGroupScreen() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleJoin = async () => {
    try {
      const result = await joinGroupByCode(code);
      setMessage(`Joined group ${result[0].group_id} as ${result[0].role}`);
      // Navigate to tabs after joining
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter join code"
        style={styles.input}
      />
      <Button title="Join" onPress={handleJoin} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  message: { marginTop: 12, color: '#555' },
});

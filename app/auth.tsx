import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function AuthScreen() {
  const router = useRouter();
  const { userId, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin'|'signup'>('signin');

  // signin
  const [identifier, setIdentifier] = useState(''); // email OR username
  const [password, setPassword] = useState('');

  // signup
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');

  const [busy, setBusy] = useState(false);

  if (userId) {
    router.replace('/(tabs)/home');
    return null;
  }

  const onSubmitSignIn = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Sign in', 'Enter email/username and password.');
      return;
    }
    try {
      setBusy(true);
      await signIn(identifier.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Auth error', e.message ?? 'Failed to sign in');
    } finally {
      setBusy(false);
    }
  };

  const onSubmitSignUp = async () => {
    if (!signupEmail.trim() || !signupUsername.trim() || !password) {
      Alert.alert('Sign up', 'Enter email, username, and password.');
      return;
    }
    try {
      setBusy(true);
      await signUp(signupEmail.trim(), password, signupUsername.trim());
      Alert.alert('Account created', 'You can sign in now.');
      setMode('signin');
      setIdentifier(signupEmail.trim());
    } catch (e: any) {
      Alert.alert('Auth error', e.message ?? 'Failed to sign up');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {mode === 'signin' ? (
        <>
          <Text style={styles.title}>Sign in</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Email or Username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={onSubmitSignIn} disabled={busy}>
            <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('signup')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Create account</Text>
          <TextInput
            style={styles.input}
            value={signupEmail}
            onChangeText={setSignupEmail}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            value={signupUsername}
            onChangeText={setSignupUsername}
            placeholder="Username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={onSubmitSignUp} disabled={busy}>
            <Text style={styles.buttonText}>{busy ? 'Working…' : 'Sign up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('signin')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Have an account? Sign in</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#0b1220',
    borderColor: '#1f2937',
    borderWidth: 1,
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: '#0EA5E9', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#60a5fa' },
});

import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { login, register } from '../services/authService'
import colors from '../theme/colors'

import { useGoogleAuth } from '../services/googleAuth'






export default function LoginScreen() {
  const navigation = useNavigation<any>()
 

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { signInWithGoogle, isReady: googleReady, loading: googleLoading } = useGoogleAuth()



  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Virhe', 'Täytä kaikki kentät')
      return
    }

    try {
      setLoading(true)

      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }

      
      navigation.replace('Home')
    } catch (error: any) {
      Alert.alert(
        isRegister ? 'Rekisteröinti epäonnistui' : 'Kirjautuminen epäonnistui',
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

 // Google login
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigation.replace("Home");
    } catch (err: any) {
      Alert.alert("Google kirjautuminen epäonnistui", err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRegister ? 'Luo käyttäjätili' : 'Kirjaudu sisään'}
      </Text>

      <TextInput
        placeholder="Sähköposti"
        placeholderTextColor={colors.mutedText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Salasana"
        placeholderTextColor={colors.mutedText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <View style={styles.buttonWrap}>
        <Button
          title={
            loading
              ? 'Käsitellään...'
              : isRegister
                ? 'Rekisteröidy'
                : 'Kirjaudu'
          }
          onPress={handleSubmit}
          disabled={loading}
          color={colors.primary}
        />

     
      </View>

      <View style={styles.buttonWrap}>
        <Button
          title={loading || googleLoading ? 'Käsitellään...' : 'Kirjaudu Googlella'}
          onPress={handleGoogleSignIn}
          disabled={!googleReady || loading || googleLoading}
          color={colors.secondary}
        />
      </View>

      <View style={styles.buttonWrap}>
        <Button
          title={isRegister ? 'Minulla on jo tili – kirjaudu' : 'Ei tiliä? Rekisteröidy'}
          onPress={() => setIsRegister(!isRegister)}
          color={colors.secondary}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    marginBottom: 20,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: 'rgba(255,255,255,0.35)',
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonWrap: {
    width: '100%',
    marginTop: 8,
  },
})

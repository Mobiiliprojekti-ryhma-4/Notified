import { View, Text, Button,TextInput, StyleSheet, Alert } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { login } from '../services/authService'
import { useState } from 'react'

export default function LoginScreen() {
  const navigation = useNavigation<any>()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

     try {
      setLoading(true)
      await login(email, password)
      navigation.navigate('Home')
    } catch (error: any) {
      Alert.alert('Login failed', error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <View style={styles.container}>
      
      <Text>LoginScreen</Text>
         <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
       
       
        <Button  
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
        />
  
        </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  marginBottom:300
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    fontSize: 24,
    marginBottom: 20,
  },

})
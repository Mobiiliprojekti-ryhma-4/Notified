import { View, Text, Button, StyleSheet } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function LoginScreen() {
  const navigation = useNavigation<any>()
  return (
    <View style={styles.container}>
      <Text>LoginScreen</Text>
        <Button title= "Login" 
         onPress={() => navigation.navigate('Home')}
        />
  
        </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
})
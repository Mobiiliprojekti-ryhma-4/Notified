import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import colors from "../theme/colors"; 
export default function UserListScreen() {
  return (
    <View style={styles.container}>
      <Text >UserListScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
 container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
 title: {
    marginLeft: 100,
    marginTop:20, 
    color: colors.text,
    fontSize: 24,
    marginBottom: 20,
  },
section: {
    marginBottom: 20,
  },
})
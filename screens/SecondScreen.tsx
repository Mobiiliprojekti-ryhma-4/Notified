import { View, Text, Button, StyleSheet } from 'react-native'

export default function SecondScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>SecondScreen</Text>
      <Button title="Open menu" onPress={() => navigation.openDrawer()} />
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
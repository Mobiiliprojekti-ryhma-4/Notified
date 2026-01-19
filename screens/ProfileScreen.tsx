// screens/ProfileScreen.tsx
import { View, Text, StyleSheet, Button } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'

type Props = {
  navigation: DrawerNavigationProp<any>
}

export default function ProfileScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profiilin Asetukset</Text>
      
      <Text>Nimi: Profiilikuva</Text>
      
      <Text>Sähköposti: user@example.com</Text>
      <Text>Nimi: John Doe</Text>

      <Button title="Avaa valikko" onPress={() => navigation.openDrawer()} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
})
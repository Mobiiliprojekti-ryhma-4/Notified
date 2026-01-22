import { View, Text, Button, Alert, StyleSheet } from 'react-native'

import { DrawerNavigationProp } from '@react-navigation/drawer'
import { logout } from '../services/authService'

type Props = {
  navigation: DrawerNavigationProp<any>
}
export default function HomeScreen({ navigation }: Props) {
  const handleLogout = async () => {
    try {
      await logout()
      navigation.navigate('Login') // go back to login screen
    } catch (e: any) {
      Alert.alert('Logout failed', e.message)
    }
  }
  
  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>
       <Button
        title="Open menu"
        onPress={() => navigation.openDrawer()}
      /> 
     <Button
          title="Logout"
          color="#ff3b30"
          onPress={handleLogout}
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
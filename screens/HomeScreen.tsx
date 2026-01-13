import { View, Text, Button, StyleSheet } from 'react-native'

import { DrawerNavigationProp } from '@react-navigation/drawer'


type Props = {
  navigation: DrawerNavigationProp<any>
}
export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>
       <Button
        title="Open menu"
        onPress={() => navigation.openDrawer()}
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
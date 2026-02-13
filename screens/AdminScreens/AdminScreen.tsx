//AdminScreen.tsx
import { View, Text, Button, StyleSheet } from 'react-native'
import colors from '../../theme/colors'
export default function AdminScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Paneeli:</Text>
     <View style={styles.section}>
        <Button
          title="Hallitse käyttäjiä"
          onPress={() => navigation.navigate('UserList')}
          color={colors.primary}
        />
      </View>
    
    <View style={styles.section}>
        <Button
          title="Hallitse ilmoituksia"
          onPress={() => navigation.navigate('AdminServiceRequests')}
          color={colors.primary}
        />
    </View>
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
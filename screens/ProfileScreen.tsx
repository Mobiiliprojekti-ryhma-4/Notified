// screens/ProfileScreen.tsx
import { View, Text, StyleSheet, Button } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import { auth } from '../firebase/Config'
import colors from '../theme/colors'
import { pickAndUploadProfileImage } from '../services/imageService'
import { Image, TouchableOpacity, Alert } from 'react-native'

type Props = {
  navigation: DrawerNavigationProp<any>
}

export default function ProfileScreen({ navigation }: Props) {
  const user = auth.currentUser

  if (!user) {
    return <Text>Not logged in</Text>
  }
  const handlePickImage = async () => {
  try {
    await pickAndUploadProfileImage()
  } catch (e: any) {
    Alert.alert('Virhe', e.message)
  }
}
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profiilin Asetukset</Text>
      
    
   <TouchableOpacity onPress={handlePickImage}>
  <Image
    source={{
      uri:
        user.photoURL ??
        'https://ui-avatars.com/api/?name=' + (user.email ?? 'User'),
    }}
    style={styles.avatar}
  />
</TouchableOpacity>
      <Text style={styles.text}>Sähköposti: {user.email}</Text>
      <Text style={styles.text}>Käyttäjän id: {user.uid}</Text>
      <View style={styles.button}>
      <Button title="Avaa valikko"color={colors.primary} onPress={() => navigation.openDrawer()} />
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
  title: {
    marginLeft: 100,
    marginTop:20, 
    color: colors.text,
    fontSize: 24,
    marginBottom: 20,
  },
 text: {
  marginLeft: 10,  
  marginTop:10, 
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 20,
  },
button: {
  marginLeft: 140,  
  marginTop:10, 
  fontSize: 14,
  marginBottom: 20,
  },
avatar: {
  width: 120,
  height: 120,
  borderRadius: 60, 
  marginLeft: 140,
  marginBottom: 20,
  borderWidth: 2,
  borderColor: colors.specialColor,
},

})
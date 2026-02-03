// components/CustomDrawer.tsx
import React from 'react'
import { Alert } from 'react-native'
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { logout } from '../services/authService'
import { View, Text, Image, StyleSheet } from 'react-native'
import colors from '../theme/colors'
import { useAuth } from '../context/AuthContext'



export default function CustomDrawer(props: any) {
  const { user } = useAuth() 
  const navigation = useNavigation()

  const handleLogout = async () => {
    try {
      await logout()
      // reset stack so user cannot go back
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      )
    } catch (e: any) {
      Alert.alert('Logout failed', e.message)
    }
  }

  return (
    
  
   <DrawerContentScrollView {...props}
    contentContainerStyle={styles.container}
   >
      {/* YLÄOSA */}
    
      <View style={styles.header}>
        <Image
          source={{
            uri:
              user?.photoURL ??
              'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
          }}
          style={styles.avatar}
        />

        <Text style={styles.email}>{user?.email}</Text>
      </View>
       {/* LINKIT */}
      <DrawerItemList {...props} />
      <DrawerItem
        label="Kirjaudu ulos"
        onPress={handleLogout}
        labelStyle={{ color: 'red', fontWeight: 'bold' }}
      />
    </DrawerContentScrollView>
  
  
  
)
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.secondary,
   
  },
  
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45, 
    marginBottom: 10,
  },
  email: {
    color: colors.text,
    fontSize: 14,
  },


})
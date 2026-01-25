// components/CustomDrawer.tsx
import React from 'react'
import { Alert } from 'react-native'
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { logout } from '../services/authService'

export default function CustomDrawer(props: any) {
  
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
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        onPress={handleLogout}
        labelStyle={{ color: 'red', fontWeight: 'bold' }}
      />
    </DrawerContentScrollView>
  )
}
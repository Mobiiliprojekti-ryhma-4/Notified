import React from 'react'
import { Alert } from 'react-native'
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { logout } from '../services/authService'
import colors from '../theme/colors'

export default function CustomDrawer(props: any) {
  const navigation = useNavigation<any>()

  const handleLogout = async () => {
    try {
      await logout()
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      )
    } catch (e: any) {
      Alert.alert('Uloskirjautuminen epäonnistui', e.message)
    }
  }

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Kirjaudu ulos"
        onPress={handleLogout}
        labelStyle={{ color: '#ff3b30', fontWeight: '700' }}
      />
    </DrawerContentScrollView>
  )
}

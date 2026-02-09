import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { View, ActivityIndicator } from 'react-native'

import { useAuth } from '../context/AuthContext'
import colors from '../theme/colors'

import CustomDrawer from '../components/CustomDrawer'

import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import ServiceRequestForm from '../screens/ServiceRequestForm'
import TimeTrackingScreen from '../screens/TimeTrackingScreen'
import PhotoScreen from '../screens/PhotoScreen'
import AdminScreen from '../screens/AdminScreen'
import UserListScreen from '../screens/UserListScreen'
import ServiceRequestAdminScreen from '../screens/ServiceRequestsAdminScreen'
import MyServicerequestScreen from '../screens/MyServicerequestScreen'
import AnalyticsScreen from '../screens/AnalyticsScreen'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <Drawer.Navigator
      initialRouteName="Koti"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        // Header (yläpalkki)
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },

        // Drawer (sivupaneeli)
        drawerStyle: { backgroundColor: colors.background },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.mutedText,
        drawerActiveBackgroundColor: 'rgba(87, 156, 209, 0.18)',

        // pientä viimeistelyä
        drawerItemStyle: { borderRadius: 10, marginHorizontal: 8 },
        drawerLabelStyle: { fontWeight: '600' },
      }}
    >
      {/* Kaikille käyttäjille */}
      <Drawer.Screen
        name="Koti"
        component={HomeScreen}
        options={{ title: 'Etusivu', drawerLabel: 'Etusivu' }}
      />

      <Drawer.Screen
        name="Asetukset"
        component={ProfileScreen}
        options={{ title: 'Asetukset', drawerLabel: 'Asetukset' }}
      />

      {/* CUSTOMER */}
      {role === 'customer' && (
        <Drawer.Screen
          name="Vikailmoitus"
          component={ServiceRequestForm}
          options={{ title: 'Vikailmoitus', drawerLabel: 'Vikailmoitus' }}
        />
      )}
      {role === 'customer' && (
        <Drawer.Screen
          name="Omat vikailmoitukset"
          component={MyServicerequestScreen}
          options={{ title: 'Omat vikailmoitukset', drawerLabel: 'Omat vikailmoitukset' }}
        />
      )}
      {role === 'customer' && (
        <Drawer.Screen
          name="Kuva"
          component={PhotoScreen}
          options={{ title: 'Kuva', drawerLabel: 'Kuva' }}
        />
      )}

      {/* WORKER */}
      {role === 'worker' && (
        <Drawer.Screen
          name="Työajanseuranta"
          component={TimeTrackingScreen}
          options={{ title: 'Työajanseuranta', drawerLabel: 'Työajanseuranta' }}
        />
      )}

      {/* ADMIN */}
      {role === 'admin' && (
        <>
          <Drawer.Screen
            name="AdminScreen"
            component={AdminScreen}
            options={{ title: 'Ylläpito', drawerLabel: 'Ylläpito' }}
          />
          <Drawer.Screen
            name="UserList"
            component={UserListScreen}
            options={{ title: 'Käyttäjät', drawerLabel: 'Käyttäjät' }}
          />
          <Drawer.Screen
            name="AdminServiceRequests"
            component={ServiceRequestAdminScreen}
            options={{ title: 'Vikailmoitukset', drawerLabel: 'Vikailmoitukset' }}
          />
          <Drawer.Screen
            name="Analytiikka"
            component={AnalyticsScreen}
            options={{ title: 'Analytiikka', drawerLabel: 'Analytiikka' }}
          />
        </>
      )}
    </Drawer.Navigator>
  )
}

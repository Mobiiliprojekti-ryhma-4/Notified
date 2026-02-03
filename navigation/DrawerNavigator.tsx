
// navigation/DrawerNavigator.tsx

import { createDrawerNavigator } from '@react-navigation/drawer'
import { useAuth } from '../context/AuthContext'

import HomeScreen from '../screens/HomeScreen'
import SecondScreen from '../screens/SecondScreen'
import ThirdScreen from '../screens/ThirdScreen'
import ProfileScreen from '../screens/ProfileScreen'
import ServiceRequestForm from '../screens/ServiceRequestForm'
import TimeTrackingScreen from '../screens/TimeTrackingScreen'
import PhotoScreen from '../screens/PhotoScreen'
import { View, ActivityIndicator } from 'react-native'
import CustomDrawer from '../components/CustomDrawer'
import AdminScreen from '../screens/AdminScreen'
import UserListScreen from '../screens/UserListScreen'
import ServiceRequestAdminScreen from '../screens/ServiceRequestsAdminScreen'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  const { role, loading } = useAuth()
  console.log('ROLE:', role, 'LOADING:', loading)
 if (loading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  )
}

  return (
    <Drawer.Navigator
      initialRouteName="Koti"
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      {/* Kaikille käyttäjille */}
      <Drawer.Screen name="Koti" component={HomeScreen} />
      <Drawer.Screen name="Asetukset" component={ProfileScreen} />
     

      {/* CUSTOMER */}
      {role === 'customer' && (
        <Drawer.Screen
          name="Vikailmoitus"
          component={ServiceRequestForm}
        />
      )}
      {role === 'customer' && (
        <Drawer.Screen name="Kuva" component={PhotoScreen} />
      )} 

      {/* WORKER */}
      {role === 'worker' && (
        <Drawer.Screen
          name="Työajanseuranta"
          component={TimeTrackingScreen}
        />
      )}
     

      {/* ADMIN */}
      {role === 'admin' && (
        <>
        <Drawer.Screen name="Admin paneeli" component={AdminScreen} />
    <Drawer.Screen name="Käyttäjälista" component={UserListScreen} />
    <Drawer.Screen
      name="AdminPalveluPyynnöt"
      component={ServiceRequestAdminScreen}
    />
     </> 
    )}
      
    </Drawer.Navigator>
  )
}
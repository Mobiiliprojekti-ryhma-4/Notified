import { createDrawerNavigator } from '@react-navigation/drawer'
import HomeScreen from '../screens/HomeScreen'
import SecondScreen from '../screens/SecondScreen'
import ThirdScreen from '../screens/ThirdScreen'
import ProfileScreen from '../screens/ProfileScreen'
import CustomDrawer from './CustomDrawer'
import ServiceRequestForm from '../screens/ServiceRequestForm'
import TimeTrackingScreen from '../screens/TimeTrackingScreen'
import PhotoScreen from '../screens/PhotoScreen'
import colors from '../theme/colors'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },

      
        drawerStyle: { backgroundColor: colors.background },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.mutedText,
      }}
    >
      {/* xxx */}
      <Drawer.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: 'Etusivu', drawerLabel: 'Etusivu' }}
      />
      <Drawer.Screen
        name="SecondScreen"
        component={SecondScreen}
        options={{ title: 'Toinen', drawerLabel: 'Toinen' }}
      />
      <Drawer.Screen
        name="ThirdScreen"
        component={ThirdScreen}
        options={{ title: 'Kolmas', drawerLabel: 'Kolmas' }}
      />
      <Drawer.Screen
        name="Settings"
        component={ProfileScreen}
        options={{ title: 'Asetukset', drawerLabel: 'Asetukset' }}
      />
      <Drawer.Screen
        name="ServiceRequest"
        component={ServiceRequestForm}
        options={{ title: 'Vikailmoitus', drawerLabel: 'Vikailmoitus' }}
      />
      <Drawer.Screen
        name="TimeTracking"
        component={TimeTrackingScreen}
        options={{ title: 'Työajanseuranta', drawerLabel: 'Työajanseuranta' }}
      />
      <Drawer.Screen
        name="Photo"
        component={PhotoScreen}
        options={{ title: 'Kuva', drawerLabel: 'Kuva' }}
      />
    </Drawer.Navigator>
  )
}

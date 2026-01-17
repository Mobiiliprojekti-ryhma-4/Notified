//components/DrawerNavigator.tsx
import { createDrawerNavigator } from '@react-navigation/drawer'
import HomeScreen from '../screens/HomeScreen'
import SecondScreen from '../screens/SecondScreen'
import ThirdScreen from '../screens/ThirdScreen'
import CustomDrawer from './CustomDrawer'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
    
      <Drawer.Screen name="HomeScreen" component={HomeScreen} />
      <Drawer.Screen name="SecondScreen" component={SecondScreen} />
    <Drawer.Screen name="ThirdScreen" component={ThirdScreen} />
    </Drawer.Navigator>
  )
}
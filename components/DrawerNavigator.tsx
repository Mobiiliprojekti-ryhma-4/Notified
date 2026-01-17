import { createDrawerNavigator } from '@react-navigation/drawer'
import HomeScreen from '../screens/HomeScreen'
import SecondScreen from '../screens/SecondScreen'
import ThirdScreen from '../screens/ThirdScreen'
import Photoscreen from '../screens/Photoscreen'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="HomeScreen">
      <Drawer.Screen name="HomeScreen" component={HomeScreen} />
      <Drawer.Screen name="SecondScreen" component={SecondScreen} />
    <Drawer.Screen name="ThirdScreen" component={ThirdScreen} />
    <Drawer.Screen name="Photoscreen" component={Photoscreen} />

    </Drawer.Navigator>
  )
}
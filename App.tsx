import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from './screens/LoginScreen'
import DrawerNavigator from './navigation/DrawerNavigator'
import { AuthProvider } from './context/AuthContext'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={DrawerNavigator} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  )
}
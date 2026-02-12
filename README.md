## Installation 


Get started

npm ci
npx expo start



npm install @react-navigation/native

npm install @react-navigation/native-stack

npx expo install react-native-screens react-native-safe-area-context

npm install @react-navigation/drawer

npx expo install react-native-gesture-handler react-native-reanimated

npm install react-native-gesture-handler react-native-reanimated




Firebase setup
npx expo install firebase
npx expo install @react-native-async-storage/async-storage
npx expo install expo-image-picker expo-location
npx expo install expo-constants
npx expo install react-native-maps expo-location

Google login setup
npx expo install expo-auth-session expo-web-browser

expo install expo-auth-session expo-crypto

for google login google cloud is required and a google cloud OAuth API service with existing client.
for android client it is required to have SHA1 
it can be found from project folder with folowing commands
cd android
./gradlew signingReport

npx expo install expo-auth-session
npx expo install expo-system-ui
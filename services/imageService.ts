import * as ImagePicker from 'expo-image-picker'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth } from '../firebase/Config'
import {  storage } from '../firebase/Config'

export const pickAndUploadProfileImage = async (): Promise<string | null> => {
  const user = auth.currentUser
  if (!user) return null

  const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images', 
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
})

  if (result.canceled) return null

  const uri = result.assets[0].uri
  const response = await fetch(uri)
  const blob = await response.blob()
  const imageRef = ref(storage, `profilePictures/${user.uid}.jpg`)

  await uploadBytes(imageRef, blob)
  const downloadURL = await getDownloadURL(imageRef)
  await updateProfile(user, {
    photoURL: downloadURL,
  })

  return downloadURL
}

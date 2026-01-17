import React, { useState } from 'react'
import { View, Text, Button, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from "../src/firebase";
 

async function uriToBlob(uri: string): Promise<Blob> {
  
  const response = await fetch(uri)
  return await response.blob()
}

export default function ThirdScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const takePhoto = async () => {
   
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Anna kameran käyttöoikeus, jotta voit ottaa kuvan.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (result.canceled) return

    const uri = result.assets?.[0]?.uri
    if (!uri) return

    setImageUri(uri)
    setDownloadUrl(null)
  }

  const uploadToFirebase = async () => {
    if (!imageUri) return

    try {
      setUploading(true)

      const blob = await uriToBlob(imageUri)

      
      const filename = `images/${Date.now()}.jpg`
      const storageRef = ref(storage, filename)

      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
      const url = await getDownloadURL(storageRef)

      setDownloadUrl(url)
      Alert.alert('Valmis!', 'Kuva ladattu Firebase Storageen.')
    } catch (e: any) {
      Alert.alert('Upload epäonnistui', e?.message ?? String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lisää kuva</Text>

      <Button title="Ota kuva" onPress={takePhoto} />

      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={{ height: 12 }} />
          <Button title="Lataa kuva ilmoitukselle" onPress={uploadToFirebase} disabled={uploading} />
        </>
      )}

      {uploading && (
        <View style={{ marginTop: 12 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6 }}>Uploading...</Text>
        </View>
      )}

      {downloadUrl && (
        <Text style={styles.url} selectable>
          {downloadUrl}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
  preview: {
    width: 240,
    height: 240,
    borderRadius: 12,
    marginTop: 16,
  },
  url: {
    marginTop: 12,
    fontSize: 12,
  },
})

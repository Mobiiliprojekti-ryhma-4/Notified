import React, { useState } from 'react'
import { View,Text,StyleSheet,Image,Alert,ActivityIndicator,Pressable,SafeAreaView,} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/Config'
import colors from '../theme/colors'

async function uriToBlob(uri: string): Promise<Blob> {  //Muunnetaan paikallisen tiedosto-URI:n blobiksi
  const response = await fetch(uri)
  return await response.blob()
}

export default function PhotoScreen() {  
  const [imageUri, setImageUri] = useState<string | null>(null) // Paikallisen kuvan esikatselu ja upload
  const [uploading, setUploading] = useState(false) 
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null) //Firebase latauslinkki

  const takePhoto = async () => { //Kuvan otto
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Kameran käyttöoikeus puuttuu', 'Anna kameran käyttöoikeus, jotta voit ottaa kuvan.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // saako muokata
      quality: 0.8, // laatu 
    })

    if (result.canceled) return  //Kuvan peruminen
    const uri = result.assets?.[0]?.uri
    if (!uri) return

    setImageUri(uri)  // asetetaan kuvalle uusi URI
    setDownloadUrl(null)
  }

  const uploadToFirebase = async () => { //Ladataan Firebaseen
    if (!imageUri) return

    try {
      setUploading(true)

      const blob = await uriToBlob(imageUri)  //muuntaminen blokiski
      const filename = `images/${Date.now()}.jpg` // Tiedostonimi
      const storageRef = ref(storage, filename) // tallennusosoite

      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' }) // varsinainen tallennus
      const url = await getDownloadURL(storageRef) // Haetaan linkki kuvaan

      setDownloadUrl(url)
      Alert.alert('Valmis!', 'Kuva ladattu Firebase Storageen.')
    } catch (e: any) {
      Alert.alert('Upload epäonnistui', e?.message ?? String(e))
    } finally {
      setUploading(false) //nollataan uploading tila lopuksi 
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Lisää kuva</Text>
        <Text style={styles.subtitle}>
          Ota kuva ja lataa se ilmoitukselle.
        </Text>

        <Pressable
          onPress={takePhoto}
          disabled={uploading}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            (pressed && !uploading) && styles.btnPressed,
            uploading && styles.btnDisabled,
          ]}
        >
          <Text style={styles.btnTextPrimary}>Ota kuva</Text>
        </Pressable>

        <Pressable
          onPress={uploadToFirebase}
          disabled={!imageUri || uploading}
          style={({ pressed }) => [
            styles.btn,
            styles.btnSecondary,
            (pressed && !(!imageUri || uploading)) && styles.btnPressed,
            (!imageUri || uploading) && styles.btnDisabled,
          ]}
        >
          <Text style={styles.btnTextSecondary}>
            {uploading ? 'Ladataan…' : 'Lataa kuva'}
          </Text>
        </Pressable>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

        {uploading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        )}

        {downloadUrl && (
          <>
            <Text style={styles.linkTitle}>Linkki:</Text>
            <Text style={styles.link} selectable>
              {downloadUrl}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 6,
    textAlign: 'center',
  },

  btn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  preview: {
    width: 240,
    height: 240,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.specialColor,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  loadingText: {
    color: colors.mutedText,
    fontWeight: '600',
  },

  linkTitle: {
    marginTop: 8,
    color: colors.text,
    fontWeight: '800',
  },
  link: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
})

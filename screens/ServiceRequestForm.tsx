import React, { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Pressable,
} from "react-native"

import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import * as ImagePicker from "expo-image-picker"

import { db, auth } from "../firebase/Config"
import { storage } from "../src/firebase"
import colors from "../theme/colors"

type ServiceRequestStatus = "new" | "in_progress" | "done"
type YesNo = "yes" | "no" | ""

type ServiceRequestCreate = {
  userId: string
  userEmail?: string | null

  issueDescription: string
  address: string
  whenAppeared: string
  masterKeyUsage: YesNo
  pets: YesNo
  otherInfo: string

  imageUrls: string[]
  status: ServiceRequestStatus
  createdAt: ReturnType<typeof serverTimestamp>
  updatedAt: ReturnType<typeof serverTimestamp>
}

type FieldProps = {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: YesNo
  onChange: (v: YesNo) => void
}) {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        onPress={() => onChange("Kyllä")}
        style={({ pressed }) => [
          styles.toggleBtn,
          value === "Kyllä" && styles.toggleBtnSelected,
          pressed && styles.btnPressed,
        ]}
      >
        <View style={[styles.radio, value === "Kyllä" && styles.radioSelected]} />
        <Text style={[styles.toggleText, value === "Kyllä" && styles.toggleTextSelected]}>
          Kyllä
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("Ei")}
        style={({ pressed }) => [
          styles.toggleBtn,
          value === "Ei" && styles.toggleBtnSelected,
          pressed && styles.btnPressed,
        ]}
      >
        <View style={[styles.radio, value === "Ei" && styles.radioSelected]} />
        <Text style={[styles.toggleText, value === "Ei" && styles.toggleTextSelected]}>
          Ei
        </Text>
      </Pressable>
    </View>
  )
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return await response.blob()
}

export default function ServiceRequestForm() {
  const [issueDescription, setIssueDescription] = useState("")
  const [address, setAddress] = useState("")
  const [whenAppeared, setWhenAppeared] = useState("")
  const [masterKeyUsage, setMasterKeyUsage] = useState<YesNo>("")
  const [pets, setPets] = useState<YesNo>("")
  const [otherInfo, setOtherInfo] = useState("")

  const [submitting, setSubmitting] = useState(false)

  // Kuvien hallinta
  const [imageUris, setImageUris] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const canSubmit = useMemo(() => {
    return issueDescription.trim().length > 0 && address.trim().length > 0
  }, [issueDescription, address])

  const busy = submitting || uploadingImages

  const resetForm = () => {
    setIssueDescription("")
    setAddress("")
    setWhenAppeared("")
    setMasterKeyUsage("")
    setPets("")
    setOtherInfo("")
    setImageUris([])
  }

  const addImageFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Oikeus puuttuu", "Anna kuvakirjaston käyttöoikeus.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (result.canceled) return
    const uri = result.assets?.[0]?.uri
    if (!uri) return

    setImageUris((prev) => [...prev, uri])
  }

  const addImageFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Oikeus puuttuu", "Anna kameran käyttöoikeus.")
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

    setImageUris((prev) => [...prev, uri])
  }

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImagesAndGetUrls = async (): Promise<string[]> => {
    if (imageUris.length === 0) return []

    const user = auth.currentUser
    if (!user) throw new Error("Käyttäjä ei ole kirjautunut.")

    setUploadingImages(true)
    try {
      const urls: string[] = []

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i]
        const blob = await uriToBlob(uri)

        const filename = `serviceRequests/${user.uid}/${Date.now()}_${i}.jpg`
        const storageRef = ref(storage, filename)

        await uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
        const url = await getDownloadURL(storageRef)
        urls.push(url)
      }

      return urls
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Täydennä tiedot", "Kerro viasta ja missä osoitteessa vika on.")
      return
    }

    const user = auth.currentUser
    if (!user) {
      Alert.alert("Kirjautuminen puuttuu", "Kirjaudu sisään ennen lähettämistä.")
      return
    }

    setSubmitting(true)
    try {
      const uploadedImageUrls = await uploadImagesAndGetUrls()

      const payload: ServiceRequestCreate = {
        userId: user.uid,
        userEmail: user.email ?? null,

        issueDescription: issueDescription.trim(),
        address: address.trim(),
        whenAppeared: whenAppeared.trim(),
        masterKeyUsage,
        pets,
        otherInfo: otherInfo.trim(),

        imageUrls: uploadedImageUrls,
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, "serviceRequests"), payload)

      Alert.alert("Lähetetty", "Vikailmoitus lähetettiin onnistuneesti.")
      resetForm()
    } catch (error: any) {
      console.log(error)
      Alert.alert("Virhe", error?.message ?? "Lähetys epäonnistui.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vikailmoitus lomake</Text>

        <Field label="Kerro viasta">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={issueDescription}
            onChangeText={setIssueDescription}
            multiline
          />
        </Field>

        <Field label="Missä osoitteessa vika on?">
          <TextInput
            style={styles.input}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={address}
            onChangeText={setAddress}
          />
        </Field>

        <Field label="Milloin vika ilmentyi?">
          <TextInput
            style={styles.input}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={whenAppeared}
            onChangeText={setWhenAppeared}
          />
        </Field>

        <Field label="Saako käyttää yleisavainta?">
          <YesNoToggle value={masterKeyUsage} onChange={setMasterKeyUsage} />
        </Field>

        <Field label="Onko kotieläimiä?">
          <YesNoToggle value={pets} onChange={setPets} />
        </Field>

        <Field label="Muuta tietoa?">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={otherInfo}
            onChangeText={setOtherInfo}
            multiline
          />
        </Field>

        {/* Kuvien lisäys */}
        <View style={styles.imageBox}>
          <Text style={styles.label}>Lisää kuvia (valinnainen)</Text>

          <View style={styles.imageActions}>
            <Pressable
              onPress={addImageFromCamera}
              disabled={busy}
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && !busy && styles.btnPressed,
                busy && styles.btnDisabled,
              ]}
            >
              <Text style={styles.smallBtnText}>Kamera</Text>
            </Pressable>

            <Pressable
              onPress={addImageFromLibrary}
              disabled={busy}
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && !busy && styles.btnPressed,
                busy && styles.btnDisabled,
              ]}
            >
              <Text style={styles.smallBtnText}>Galleria</Text>
            </Pressable>
          </View>

          {imageUris.length === 0 ? (
            <Text style={styles.imageHint}>Ei kuvia valittuna.</Text>
          ) : (
            <View style={styles.previewGrid}>
              {imageUris.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.previewItem}>
                  <Image source={{ uri }} style={styles.previewImage} />

                  <Pressable
                    onPress={() => removeImage(idx)}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      pressed && !busy && styles.btnPressed,
                      busy && styles.btnDisabled,
                    ]}
                  >
                    <Text style={styles.removeBtnText}>Poista</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {uploadingImages && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Ladataan kuvia…</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, (!canSubmit || busy) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || busy}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Lähetä</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 22,
    fontWeight: "600",
    color: colors.text,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: colors.text,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },

  // Kyllä / Ei valinnat
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 10,
  },
  toggleBtnSelected: {
    borderColor: colors.primary,
  },
  toggleText: {
    fontWeight: "700",
    color: colors.text,
  },
  toggleTextSelected: {
    color: colors.primary,
  },
  radio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  imageBox: {
    marginTop: 10,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderStyle: "dashed",
    borderRadius: 6,
  },
  imageActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  smallBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: colors.secondary,
  },
  smallBtnText: {
    color: colors.text,
    fontWeight: "700",
  },
  imageHint: {
    color: colors.mutedText,
    textAlign: "center",
    marginTop: 6,
  },

  previewGrid: {
    marginTop: 8,
    gap: 12,
  },
  previewItem: {
    gap: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  removeBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#fff",
  },
  removeBtnText: {
    fontWeight: "700",
    color: colors.text,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.mutedText,
    fontWeight: "600",
  },

  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnDisabled: {
    opacity: 0.6,
  },

  button: {
    alignSelf: "center",
    width: 140,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
})
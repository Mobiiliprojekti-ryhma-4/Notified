import React, { useMemo, useState } from "react";
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
} from "react-native"

import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/Config"
import colors from "../theme/colors"

type ServiceRequestStatus = "new" | "in_progress" | "done";

type ServiceRequestCreate = {
  issueDescription: string
  address: string
  whenAppeared: string
  masterKeyUsage: string
  pets: string
  otherInfo: string
  imageUrls: string[]
  status: ServiceRequestStatus
  createdAt: ReturnType<typeof serverTimestamp>
  updatedAt: ReturnType<typeof serverTimestamp>
}

type FieldProps = {
  label: string
  children: React.ReactNode
};

function Field({ label, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function ServiceRequestForm(){
  const [issueDescription, setIssueDescription] = useState("");
  const [address, setAddress] = useState("");
  const [whenAppeared, setWhenAppeared] = useState("");
  const [masterKeyUsage, setMasterKeyUsage] = useState("");
  const [pets, setPets] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => issueDescription.trim().length > 0 && address.trim().length > 0,
    [issueDescription, address]
  );

  const resetForm = () => {
    setIssueDescription("")
    setAddress("")
    setWhenAppeared("")
    setMasterKeyUsage("")
    setPets("")
    setOtherInfo("")
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Täydennä tiedot", "Kerro viasta ja missä osoitteessa vika on.")
      return
    }

    setSubmitting(true)
    try {
      const payload: ServiceRequestCreate = {
        issueDescription: issueDescription.trim(),
        address: address.trim(),
        whenAppeared: whenAppeared.trim(),
        masterKeyUsage: masterKeyUsage.trim(),
        pets: pets.trim(),
        otherInfo: otherInfo.trim(),
        imageUrls: [],
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "serviceRequests"), payload)

      Alert.alert("Lähetetty", "Vikailmoitus lähetettiin onnistuneesti.")
      resetForm()
    } catch (error) {
      console.log(error)
      Alert.alert("Virhe", "Lähetys epäonnistui.")
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
          <TextInput
            style={styles.input}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={masterKeyUsage}
            onChangeText={setMasterKeyUsage}
          />
        </Field>

        <Field label="Onko kotieläimiä?">
          <TextInput
            style={styles.input}
            placeholder="Type here"
            placeholderTextColor={colors.mutedText}
            value={pets}
            onChangeText={setPets}
          />
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

        {/* Kuvien lisäys myöhemmin */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            Kuvien lisääminen lisätään myöhemmin
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Lähetä</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  imagePlaceholder: {
    marginTop: 10,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderStyle: "dashed",
    borderRadius: 6,
  },
  imagePlaceholderText: {
    textAlign: "center",
    color: colors.mutedText,
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
import React, { useEffect, useState } from "react";
import {ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, View,} from "react-native";
import {collection, onSnapshot, orderBy, query,Timestamp,where,} from "firebase/firestore";
import { auth, db } from "../firebase/Config";
import colors from "../theme/colors";

type ServiceRequestStatus = "new" | "in_progress" | "done";

type ServiceRequestDoc = {
  id: string;
  address: string;
  issueDescription: string;
  status: ServiceRequestStatus;
  createdAt?: Timestamp;
  imageUrls?: string[];
};

function statusFi(status: ServiceRequestStatus) {
  if (status === "new") return "Uusi";
  if (status === "in_progress") return "Työn alla";
  return "Valmis";
}

function timeFi(ts?: Timestamp) {
  if (!ts) return "";
  return ts.toDate().toLocaleString("fi-FI", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyServiceRequestsScreen() {
  const [items, setItems] = useState<ServiceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      Alert.alert("Kirjaudu sisään", "Et ole kirjautunut sisään.");
      return;
    }

    const q = query(
      collection(db, "serviceRequests"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ServiceRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ServiceRequestDoc, "id">),
        }));
        setItems(rows);
        setLoading(false);
      },
      () => {
        setLoading(false);
        Alert.alert("Virhe", "Vikailmoitusten haku epäonnistui.");
      }
    );

    return unsub;
  }, [uid]);

  const renderItem = ({ item }: { item: ServiceRequestDoc }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{statusFi(item.status)}</Text>
        <Text style={styles.meta}>{timeFi(item.createdAt)}</Text>
      </View>

      <Text style={styles.line}>
        <Text style={styles.bold}>Osoite:</Text> {item.address}
      </Text>

      <Text style={styles.line} numberOfLines={3}>
        <Text style={styles.bold}>Vika:</Text> {item.issueDescription}
      </Text>

      {!!item.imageUrls?.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbRow}
        >
          {item.imageUrls.map((url, idx) => (
            <Image
              key={`${item.id}-${idx}`}
              source={{ uri: url }}
              style={styles.thumb}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.meta}>Haetaan vikailmoituksia…</Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Sinulla ei ole vielä vikailmoituksia.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Omat vikailmoitukset</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 10 },

  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },

  card: { borderWidth: 1, borderColor: colors.specialColor, borderRadius: 12, padding: 10, marginBottom: 10, backgroundColor: "rgba(255,255,255,0.55)" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontWeight: "900", color: colors.text },

  line: { color: colors.text, marginTop: 6 },
  bold: { fontWeight: "900" },
  meta: { color: colors.mutedText, marginTop: 6 },

  thumbRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  thumb: { width: 90, height: 70, borderRadius: 10, borderWidth: 1, borderColor: colors.specialColor },
});

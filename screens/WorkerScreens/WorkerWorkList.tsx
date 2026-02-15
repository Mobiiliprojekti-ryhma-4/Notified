import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, View, Pressable, TextInput,} from "react-native";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where,} from "firebase/firestore";
import { auth, db } from "../../firebase/Config";
import colors from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

type ServiceRequestStatus = "new" | "in_progress" | "done";

type ServiceRequestDoc = {
  id: string;

  userId: string;
  userEmail?: string | null;

  address: string;
  issueDescription: string;

  status: ServiceRequestStatus;
  createdAt?: Timestamp;

  imageUrls?: string[];

 
  assignedTo?: string | null;
  assignedToEmail?: string | null;
  assignedAt?: Timestamp | null;

 
  startedAt?: Timestamp | null;
  finishedAt?: Timestamp | null;
  workerComment?: string | null;
};

function statusFi(status: ServiceRequestStatus) {
  if (status === "new") return "Uusi";
  if (status === "in_progress") return "Työn alla";
  return "Valmis";
}

function timeFi(ts?: Timestamp | null) {
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

export default function WorkerWorkList() {
  const { role } = useAuth();
  const [items, setItems] = useState<ServiceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "worker") {
      setLoading(false);
      Alert.alert("Ei oikeuksia", "Tämä näkymä on vain työntekijöille.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      Alert.alert("Kirjautuminen puuttuu", "Kirjaudu sisään nähdäksesi työlistan.");
      return;
    }

    const q = query(
      collection(db, "serviceRequests"),
      where("assignedTo", "==", user.uid),
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

        setCommentById((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            if (next[r.id] === undefined) {
              next[r.id] = r.workerComment ?? "";
            }
          }
          return next;
        });

        setLoading(false);
      },
      (e: any) => {
        console.log(e);
        setLoading(false);
        if (items.length === 0) {
          Alert.alert("Virhe", "Työlistan haku epäonnistui.");
        }
      }
    );

    return unsub;
   
  }, [role]);

  const visibleItems = useMemo(() => {
    return items.filter((it) => (showDone ? it.status === "done" : it.status !== "done"));
  }, [items, showDone]);

  const toggleOpen = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  const setComment = (id: string, text: string) => {
    setCommentById((prev) => ({ ...prev, [id]: text }));
  };

  const startWork = async (item: ServiceRequestDoc) => {
    setSavingId(item.id);
    try {
      await updateDoc(doc(db, "serviceRequests", item.id), {
        status: "in_progress",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.log(e);
      Alert.alert("Virhe", e?.message ?? "Aloitus epäonnistui.");
    } finally {
      setSavingId(null);
    }
  };

  const saveComment = async (item: ServiceRequestDoc) => {
    const text = (commentById[item.id] ?? "").trim();
    setSavingId(item.id);
    try {
      await updateDoc(doc(db, "serviceRequests", item.id), {
        workerComment: text ? text : null,
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Tallennettu", "Kommentti tallennettu.");
    } catch (e: any) {
      console.log(e);
      Alert.alert("Virhe", e?.message ?? "Kommentin tallennus epäonnistui.");
    } finally {
      setSavingId(null);
    }
  };

  const closeWork = async (item: ServiceRequestDoc) => {
    const text = (commentById[item.id] ?? "").trim();

    Alert.alert("Suljetaanko työ?", "Työ merkitään valmiiksi.", [
      { text: "Peruuta", style: "cancel" },
      {
        text: "Sulje työ",
        style: "destructive",
        onPress: async () => {
          setSavingId(item.id);
          try {
            await updateDoc(doc(db, "serviceRequests", item.id), {
              status: "done",
              finishedAt: serverTimestamp(),
              workerComment: text ? text : null,
              updatedAt: serverTimestamp(),
            });
          } catch (e: any) {
            console.log(e);
            Alert.alert("Virhe", e?.message ?? "Sulkeminen epäonnistui.");
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  };

  const renderExpanded = (item: ServiceRequestDoc) => {
    const isSaving = savingId === item.id;
    const canStart = item.status !== "in_progress" && item.status !== "done";
    const canClose = item.status !== "done";

    return (
      <View style={styles.expandedBox}>
        {!!item.startedAt && <Text style={styles.meta}>Aloitettu: {timeFi(item.startedAt)}</Text>}
        {!!item.finishedAt && <Text style={styles.meta}>Suljettu: {timeFi(item.finishedAt)}</Text>}

        <Text style={[styles.line, { marginTop: 10 }]}>
          <Text style={styles.bold}>Kommentti:</Text>
        </Text>

        <TextInput
          value={commentById[item.id] ?? ""}
          onChangeText={(t) => setComment(item.id, t)}
          placeholder="Kirjoita mitä teit / havaintoja…"
          placeholderTextColor={colors.mutedText}
          style={styles.commentInput}
          multiline
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => startWork(item)}
            disabled={!canStart || isSaving}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPressed,
              (!canStart || isSaving) && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnPrimaryText}>Aloita</Text>
          </Pressable>

          <Pressable
            onPress={() => saveComment(item)}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.btnPressed,
              isSaving && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnText}>Tallenna</Text>
          </Pressable>

          <Pressable
            onPress={() => closeWork(item)}
            disabled={!canClose || isSaving}
            style={({ pressed }) => [
              styles.btnDanger,
              pressed && styles.btnPressed,
              (!canClose || isSaving) && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnPrimaryText}>Sulje</Text>
          </Pressable>
        </View>

        <Text style={[styles.meta, { marginTop: 8 }]}>
          Vinkki: työn aloitus ja sulku tallentaa kellonajan automaattisesti.
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ServiceRequestDoc }) => {
    const isOpen = openId === item.id;

    return (
      <View style={styles.card}>
        <Pressable onPress={() => toggleOpen(item.id)} style={({ pressed }) => [pressed && styles.btnPressed]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{statusFi(item.status)}</Text>
            <Text style={styles.meta}>{timeFi(item.createdAt)}</Text>
          </View>

          <Text style={styles.line}>
            <Text style={styles.bold}>Osoite:</Text> {item.address}
          </Text>

          <Text style={styles.line} numberOfLines={isOpen ? 20 : 3}>
            <Text style={styles.bold}>Vika:</Text> {item.issueDescription}
          </Text>

          {!!item.assignedAt && <Text style={styles.meta}>Määrätty: {timeFi(item.assignedAt)}</Text>}

          {!!item.imageUrls?.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {item.imageUrls.map((url, idx) => (
                <Image key={`${item.id}-${idx}`} source={{ uri: url }} style={styles.thumb} />
              ))}
            </ScrollView>
          )}

          <Text style={[styles.meta, { marginTop: 8 }]}>
            {isOpen ? "Sulje työkortti ▲" : "Avaa työkortti ▼"}
          </Text>
        </Pressable>

        {isOpen && renderExpanded(item)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.meta}>Haetaan työlistaa…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Minulle määrätyt työt</Text>

      {/*Toggle-napit */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setShowDone(false)}
          style={({ pressed }) => [
            styles.filterBtn,
            !showDone && styles.filterBtnActive,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={[styles.filterText, !showDone && styles.filterTextActive]}>
            Aktiiviset
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowDone(true)}
          style={({ pressed }) => [
            styles.filterBtn,
            showDone && styles.filterBtnActive,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={[styles.filterText, showDone && styles.filterTextActive]}>
            Valmiit työt
          </Text>
        </Pressable>
      </View>

      {visibleItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.meta}>
            {showDone ? "Ei valmiita töitä." : "Ei aktiivisia töitä."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10,
  },

  filterRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  filterBtnActive: { borderColor: colors.primary },
  filterText: { fontWeight: "900", color: colors.text },
  filterTextActive: { color: colors.primary },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { fontWeight: "900", color: colors.text },

  line: { color: colors.text, marginTop: 6 },
  bold: { fontWeight: "900" },
  meta: { color: colors.mutedText, marginTop: 6 },

  thumbRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  thumb: {
    width: 90,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.specialColor,
  },

  expandedBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: 10,
  },

  commentInput: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: "top",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "900", color: colors.text },

  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#b00020",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { fontWeight: "900", color: "#fff" },

  btnPressed: { opacity: 0.9 },
  btnDisabled: { opacity: 0.6 },
});
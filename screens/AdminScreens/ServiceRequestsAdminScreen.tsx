import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,} from "react-native";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where,} from "firebase/firestore";
import { db } from "../../firebase/Config";
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

  workerComment?: string | null;
  startedAt?: Timestamp | null;
  finishedAt?: Timestamp | null;
};

type WorkerUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: string;
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

export default function ServiceRequestsAdminScreen() {
  const { role } = useAuth();

  const [items, setItems] = useState<ServiceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [showDone, setShowDone] = useState(false);

  
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);

  
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ServiceRequestDoc | null>(null);
  const [workerSearch, setWorkerSearch] = useState("");

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      Alert.alert("Ei oikeuksia", "Tämä näkymä on vain ylläpidolle.");
      return;
    }

    
    const qReq = query(collection(db, "serviceRequests"), orderBy("createdAt", "desc"));
    const unsubReq = onSnapshot(
      qReq,
      (snap) => {
        const rows: ServiceRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ServiceRequestDoc, "id">),
        }));
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        console.log(e);
        setLoading(false);
        Alert.alert("Virhe", "Vikailmoitusten haku epäonnistui.");
      }
    );

  
    const qWorkers = query(collection(db, "users"), where("role", "==", "worker"));
    const unsubWorkers = onSnapshot(
      qWorkers,
      (snap) => {
        const w: WorkerUser[] = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as any),
        }));
        w.sort((a, b) => {
          const an = (a.displayName || a.email || "").toLowerCase();
          const bn = (b.displayName || b.email || "").toLowerCase();
          return an.localeCompare(bn);
        });
        setWorkers(w);
        setWorkersLoading(false);
      },
      (e) => {
        console.log(e);
        setWorkersLoading(false);
        Alert.alert("Virhe", "Työntekijälistan haku epäonnistui.");
      }
    );

    return () => {
      unsubReq();
      unsubWorkers();
    };
  }, [role]);

  const filteredWorkers = useMemo(() => {
    const s = workerSearch.trim().toLowerCase();
    if (!s) return workers;
    return workers.filter((w) => {
      const hay = `${w.displayName ?? ""} ${w.email ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [workers, workerSearch]);

  
  const visibleItems = useMemo(() => {
    return items.filter((it) => (showDone ? it.status === "done" : it.status !== "done"));
  }, [items, showDone]);

  const openAssign = (item: ServiceRequestDoc) => {
    if (workersLoading) {
      Alert.alert("Hetki", "Työntekijälista latautuu vielä…");
      return;
    }
    if (workers.length === 0) {
      Alert.alert("Ei työntekijöitä", 'users-kokoelmasta ei löytynyt role=="worker" käyttäjiä.');
      return;
    }
    setAssignTarget(item);
    setWorkerSearch("");
    setAssignOpen(true);
  };

  const doAssign = async (worker: WorkerUser) => {
    if (!assignTarget) return;

    try {
      await updateDoc(doc(db, "serviceRequests", assignTarget.id), {
        assignedTo: worker.uid,
        assignedToEmail: worker.email ?? null,
        assignedAt: serverTimestamp(),
      });

      setAssignOpen(false);
      setAssignTarget(null);
      Alert.alert("OK", `Työ määrätty: ${worker.displayName ?? worker.email ?? worker.uid}`);
    } catch (e: any) {
      console.log(e);
      Alert.alert("Virhe", e?.message ?? "Työn määrääminen epäonnistui.");
    }
  };

  const renderItem = ({ item }: { item: ServiceRequestDoc }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{statusFi(item.status)}</Text>
        <Text style={styles.meta}>{timeFi(item.createdAt)}</Text>
      </View>

      {/* Asiakkaan osuus */}
      <Text style={styles.line}>
        <Text style={styles.bold}>Asiakas:</Text> {item.userEmail ?? item.userId}
      </Text>

      <Text style={styles.line}>
        <Text style={styles.bold}>Osoite:</Text> {item.address}
      </Text>

      <Text style={styles.line} numberOfLines={3}>
        <Text style={styles.bold}>Vika:</Text> {item.issueDescription}
      </Text>

      {/* Kuvat  */}
      {!!item.imageUrls?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {item.imageUrls.map((url, idx) => (
            <Image key={`${item.id}-${idx}`} source={{ uri: url }} style={styles.thumb} />
          ))}
        </ScrollView>
      )}

      {/* Työntekijän osuus */}
      <View style={styles.workerSection}>
        <Text style={styles.line}>
          <Text style={styles.bold}>Tekijä:</Text>{" "}
          {item.assignedToEmail ? item.assignedToEmail : "Ei määrätty"}
        </Text>

        <Pressable
          onPress={() => openAssign(item)}
          style={({ pressed }) => [styles.assignBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.assignBtnText}>
            {item.assignedTo ? "Vaihda tekijä" : "Määrää tekijä"}
          </Text>
        </Pressable>

        {!!item.workerComment && (
          <Text style={styles.line} numberOfLines={4}>
            <Text style={styles.bold}>Kommentti:</Text> {item.workerComment}
          </Text>
        )}
        {!!item.startedAt && <Text style={styles.meta}>Aloitettu: {timeFi(item.startedAt)}</Text>}
        {!!item.finishedAt && <Text style={styles.meta}>Suljettu: {timeFi(item.finishedAt)}</Text>}
      </View>
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

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Kaikki vikailmoitukset</Text>

      {/* Toggle-napit */}
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
            {showDone ? "Ei valmiita vikailmoituksia." : "Ei aktiivisia vikailmoituksia."}
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

      {/* Assign Modal */}
      <Modal
        visible={assignOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Valitse tekijä</Text>
              <Pressable onPress={() => setAssignOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Sulje</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {assignTarget ? `${assignTarget.address}` : ""}
            </Text>

            <TextInput
              value={workerSearch}
              onChangeText={setWorkerSearch}
              placeholder="Hae nimellä tai sähköpostilla…"
              placeholderTextColor={colors.mutedText}
              style={styles.searchInput}
            />

            <FlatList
              data={filteredWorkers}
              keyExtractor={(w) => w.uid}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item: w }) => (
                <Pressable
                  onPress={() => doAssign(w)}
                  style={({ pressed }) => [styles.workerRow, pressed && styles.btnPressed]}
                >
                  <Text style={styles.workerName}>{w.displayName ?? w.email ?? w.uid}</Text>
                  {!!w.email && <Text style={styles.workerEmail}>{w.email}</Text>}
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Ei osumia.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 10 },

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

  card: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontWeight: "900", color: colors.text },

  line: { color: colors.text, marginTop: 6 },
  bold: { fontWeight: "900" },
  meta: { color: colors.mutedText, marginTop: 6 },

  
  workerSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },

  assignBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.specialColor,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  assignBtnText: { fontWeight: "900", color: colors.text },

  thumbRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  thumb: {
    width: 90,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.specialColor,
  },

  btnPressed: { opacity: 0.85 },

  
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  modalCloseBtn: { paddingVertical: 8, paddingHorizontal: 10 },
  modalCloseText: { fontWeight: "900", color: colors.primary },

  modalSubtitle: { marginTop: 6, color: colors.mutedText },

  searchInput: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },

  workerRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  workerName: { fontWeight: "900", color: colors.text },
  workerEmail: { marginTop: 2, color: colors.mutedText },

  sep: { height: 1, backgroundColor: "rgba(0,0,0,0.06)" },
  emptyText: { padding: 12, color: colors.mutedText, textAlign: "center" },
});
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, SectionList, StyleSheet, Text, View,} from "react-native";
import {collection, onSnapshot, orderBy, query, Timestamp, where,} from "firebase/firestore";

import { db } from "../../firebase/Config";
import colors from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

type WorkerUser = {
  id: string;
  email?: string | null;
  role?: "admin" | "worker" | "customer";
};

type WorkSessionDoc = {
  id: string;

  uid: string;
  email?: string | null;

  status?: "active" | "closed";

  startedAt?: Timestamp;
  endedAt?: Timestamp;

  startedPoint?: { latitude: number; longitude: number };
  endedPoint?: { latitude: number; longitude: number };

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type RangeMode = "7d" | "30d" | "all";

type MonthSection = {
  key: string;      // "YYYY-MM"
  title: string;    // "Tammikuu 2026"
  totalMs: number;  // kuukauden summa
  data: WorkSessionDoc[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDurationMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function dateFi(ts?: Timestamp) {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function timeFi(ts?: Timestamp) {
  if (!ts) return "";
  return ts.toDate().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
}

function calcDurationMs(s: WorkSessionDoc) {
  const start = s.startedAt?.toDate().getTime();
  const end = s.endedAt?.toDate().getTime();
  if (!start || !end) return 0;
  return Math.max(0, end - start);
}

function makeSinceTs(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Timestamp.fromDate(d);
}

function monthKeyFrom(ts: Timestamp) {
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${pad2(m)}`;
}

function monthTitleFi(key: string) {
  const [yStr, mStr] = key.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = new Date(y, m - 1, 1);
  const raw = d.toLocaleDateString("fi-FI", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function AdminTimeTrackingScreen() {
  const { role } = useAuth();

  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const [selectedWorker, setSelectedWorker] = useState<WorkerUser | null>(null);

  const [sessions, setSessions] = useState<WorkSessionDoc[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [rangeMode, setRangeMode] = useState<RangeMode>("30d");

  useEffect(() => {
    if (role !== "admin") {
      Alert.alert("Ei oikeuksia", "Tämä näkymä on vain ylläpidolle.");
    }
  }, [role]);

  // Haetaan työntekijät
  useEffect(() => {
    if (role !== "admin") return;

    const qy = query(collection(db, "users"), where("role", "==", "worker"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: WorkerUser[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkerUser, "id">),
        }));
        rows.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
        setWorkers(rows);
        setLoadingWorkers(false);
      },
      (e) => {
        console.log(e);
        setLoadingWorkers(false);
        Alert.alert("Virhe", "Työntekijöiden haku epäonnistui.");
      }
    );

    return unsub;
  }, [role]);

  // Haetaan valitun työtekijän tunnit
  useEffect(() => {
    if (role !== "admin") return;

    if (!selectedWorker) {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);

    const sessionsCol = collection(db, "users", selectedWorker.id, "workSessions");

    const sinceTs =
      rangeMode === "7d" ? makeSinceTs(7) : rangeMode === "30d" ? makeSinceTs(30) : null;

    const qy =
      rangeMode === "all"
        ? query(sessionsCol, orderBy("startedAt", "desc"))
        : query(sessionsCol, where("startedAt", ">=", sinceTs!), orderBy("startedAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: WorkSessionDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkSessionDoc, "id">),
        }));
        setSessions(rows);
        setLoadingSessions(false);
      },
      (e) => {
        console.log(e);
        setLoadingSessions(false);
        Alert.alert("Virhe", "Työvuorojen haku epäonnistui.");
      }
    );

    return unsub;
  }, [role, selectedWorker, rangeMode]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.status === "active" && s.startedAt && !s.endedAt);
  }, [sessions]);

  const monthSections: MonthSection[] = useMemo(() => {
    const done = sessions.filter((s) => s.status === "closed" && s.startedAt && s.endedAt);

    const map = new Map<string, WorkSessionDoc[]>();
    for (const s of done) {
      const key = monthKeyFrom(s.startedAt!);
      map.set(key, [...(map.get(key) ?? []), s]);
    }

    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1)); // uusin ensin

    return keys.map((k) => {
      const data = (map.get(k) ?? []).sort((a, b) => {
        const ta = a.startedAt?.toDate().getTime() ?? 0;
        const tb = b.startedAt?.toDate().getTime() ?? 0;
        return tb - ta;
      });
      const totalMs = data.reduce((sum, s) => sum + calcDurationMs(s), 0);
      return { key: k, title: monthTitleFi(k), totalMs, data };
    });
  }, [sessions]);

  const totalMs = useMemo(() => monthSections.reduce((sum, sec) => sum + sec.totalMs, 0), [monthSections]);

  const RangeChip = ({ value, label }: { value: RangeMode; label: string }) => {
    const active = rangeMode === value;
    return (
      <Pressable
        onPress={() => setRangeMode(value)}
        style={({ pressed }) => [
          styles.chip,
          active && styles.chipActive,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const WorkerRow = ({ item }: { item: WorkerUser }) => (
    <Pressable
      onPress={() => setSelectedWorker(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.rowTitle}>{item.email ?? item.id}</Text>
      <Text style={styles.rowMeta}>Avaa työajat →</Text>
    </Pressable>
  );

  const SessionRow = ({ item }: { item: WorkSessionDoc }) => {
    const dur = calcDurationMs(item);
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{dateFi(item.startedAt)}</Text>
          <Text style={styles.meta}>
            {timeFi(item.startedAt)} → {timeFi(item.endedAt)}
          </Text>
        </View>
        <Text style={styles.line}>
          <Text style={styles.bold}>Kesto:</Text> {formatDurationMs(dur)}
        </Text>
      </View>
    );
  };

  if (role !== "admin") {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Vain admin voi käyttää tätä näkymää.</Text>
      </View>
    );
  }

  
  if (!selectedWorker) {
    if (loadingWorkers) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.meta}>Haetaan työntekijöitä…</Text>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Työajanseuranta (Admin)</Text>
        <Text style={styles.meta}>Valitse työntekijä nähdäksesi työajat kuukausittain.</Text>

        <FlatList
          data={workers}
          keyExtractor={(w) => w.id}
          renderItem={WorkerRow}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListEmptyComponent={<Text style={styles.meta}>Ei työntekijöitä.</Text>}
        />
      </View>
    );
  }
// valitun työntekijän näkymä
  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setSelectedWorker(null)} style={styles.backBtn}>
          <Text style={styles.backText}>← Takaisin</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{selectedWorker.email ?? selectedWorker.id}</Text>
          <Text style={styles.meta}>
            Näytetään:{" "}
            {rangeMode === "7d" ? "viimeiset 7 päivää" : rangeMode === "30d" ? "viimeiset 30 päivää" : "kaikki"}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <RangeChip value="7d" label="7 pv" />
        <RangeChip value="30d" label="30 pv" />
        <RangeChip value="all" label="Kaikki" />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLine}>
          <Text style={styles.bold}>Tunnit yhteensä:</Text> {formatDurationMs(totalMs)}
        </Text>

        {activeSession?.startedAt && (
          <Text style={styles.summaryLine}>
            <Text style={styles.bold}>Käynnissä alkaen:</Text> {dateFi(activeSession.startedAt)}{" "}
            {timeFi(activeSession.startedAt)}
          </Text>
        )}
      </View>

      {loadingSessions ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.meta}>Haetaan työvuoroja…</Text>
        </View>
      ) : (
        <SectionList
          sections={monthSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionRow item={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionMeta}>{formatDurationMs(section.totalMs)}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={<Text style={styles.meta}>Ei työvuoroja.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: { fontSize: 18, fontWeight: "900", color: colors.text },
  meta: { color: colors.mutedText, marginTop: 6 },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },

  row: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  rowTitle: { color: colors.text, fontWeight: "900" },
  rowMeta: { color: colors.mutedText, marginTop: 4, fontWeight: "700" },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  backText: { color: colors.text, fontWeight: "900" },

  chipRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(87, 156, 209, 0.18)",
  },
  chipText: { color: colors.text, fontWeight: "900" },
  chipTextActive: { color: colors.primary },

  summary: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  summaryLine: { color: colors.text, marginTop: 4 },
  bold: { fontWeight: "900" },

  sectionHeader: {
    marginTop: 10,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "rgba(255,255,255,0.35)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: colors.text, fontWeight: "900" },
  sectionMeta: { color: colors.mutedText, fontWeight: "900" },

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
});

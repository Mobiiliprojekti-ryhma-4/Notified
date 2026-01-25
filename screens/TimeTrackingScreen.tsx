import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "../theme/colors"; 

type GeoPoint = { latitude: number; longitude: number };


// Työajan "leimaus"
type Punch = {
  atISO: string;
  point: GeoPoint;
};

//Työpäivä
type WorkSession = {
  id: string;
  started: Punch;
  ended?: Punch;
};

const STORAGE_KEY = "work_sessions_v1"; // Avain, jolla tallentuu paikallisesti asyncstorageen. Myöhemmin lisätään firestoreen käyttäjälle

function formatDuration(ms: number) { 
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

//Paikallinen tallennus Asyncstorageen
async function loadSessions(): Promise<WorkSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkSession[];
  } catch {
    return [];
  }
}

async function saveSessions(sessions: WorkSession[]) { //Varsinainen tallennus
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function WorkdayMapScreen() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [currentPoint, setCurrentPoint] = useState<GeoPoint | null>(null);

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [showPast, setShowPast] = useState(false);

  // MAhdollisesti aktiivinen eli käynnissä oleva työpäivä. Sessio ilam loppuaikaa
  const activeSession = useMemo(
    () => sessions.find((s) => !s.ended),
    [sessions]
  );

  // Mennyt sessio, jossa loppuaika
  const pastSessions = useMemo(
    () => sessions.filter((s) => !!s.ended),
    [sessions]
  );

  // Alustus, lupa sijainnille, hakee sijainnin ja asettaa käyttöön
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const ok = status === "granted";
      setPermissionGranted(ok);

      if (!ok) {
        Alert.alert("Sijaintilupa puuttuu", "Anna sijaintilupa, jotta paikannus toimii.");
      }

      const stored = await loadSessions();
      setSessions(stored);

      if (ok) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentPoint({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  //Haetaan nykyinen sijainti
  async function getFreshLocation(): Promise<GeoPoint | null> { 
    if (!permissionGranted) return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const p = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setCurrentPoint(p);
    return p;
  }

  //työpäivän aloitus ja virheen käsittely 
  async function handleStart() {
    if (!permissionGranted) {
      Alert.alert("Ei lupaa", "Sijaintilupa tarvitaan.");
      return;
    }
    if (activeSession) {
      Alert.alert("Työpäivä käynnissä", "Lopeta ensin nykyinen työpäivä.");
      return;
    }

    const point = (await getFreshLocation()) ?? currentPoint;
    if (!point) {
      Alert.alert("Sijainti ei saatavilla", "Kokeile uudelleen.");
      return;
    }

    const newSession: WorkSession = {
      id: String(Date.now()),
      started: { atISO: new Date().toISOString(), point },
    };

    const next = [newSession, ...sessions];
    setSessions(next);
    await saveSessions(next);
  }


  async function stopNow() {
    if (!activeSession) return;

    const point = (await getFreshLocation()) ?? currentPoint;
    if (!point) {
      Alert.alert("Sijainti ei saatavilla", "Kokeile uudelleen.");
      return;
    }

    const nowISO = new Date().toISOString();

    const next = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, ended: { atISO: nowISO, point } } : s
    );

    setSessions(next);
    await saveSessions(next);
  }

  //Työpäivän lopetus
  function handleStopWithConfirm() {
    if (!activeSession) {
      Alert.alert("Ei käynnissä olevaa työpäivää", "Aloita työpäivä ensin.");
      return;
    }

    Alert.alert("Lopeta työpäivä?", "Oletko varma, että haluat lopettaa työpäivän?", [
      { text: "Peruuta", style: "cancel" },
      { text: "Lopeta", style: "destructive", onPress: stopNow },
    ]);
  }
//Alustaa kartan ja jos ei sijaintia näyttää Helsingin koordinaattien perusteella
  const region = useMemo(() => {
    const fallback = { latitude: 60.1699, longitude: 24.9384 };
    const p = currentPoint ?? fallback;
    return { ...p, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }, [currentPoint]);

  
 const CurrentCard = () => {
  if (!activeSession) {
    return <Text style={styles.muted}>Ei käynnissä olevaa työpäivää.</Text>;
  }

  const day = dateLabel(activeSession.started.atISO);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{day}</Text>
      <Text style={styles.cardLine}>Työpäivä käynnissä</Text>
      <Text style={styles.cardLine}>
        Aloitus: {timeLabel(activeSession.started.atISO)}
      </Text>
      <Text style={styles.cardLine}>
        Start: {activeSession.started.point.latitude.toFixed(5)},{" "}
        {activeSession.started.point.longitude.toFixed(5)}
      </Text>
    </View>
  );
};


  const renderPast = ({ item }: { item: WorkSession }) => {
  const startMs = new Date(item.started.atISO).getTime();
  const endMs = item.ended ? new Date(item.ended.atISO).getTime() : startMs;
  const duration = formatDuration(endMs - startMs);

  const day = dateLabel(item.started.atISO);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{day}</Text>

      <Text style={styles.cardLine}>
        {timeLabel(item.started.atISO)} →{" "}
        {item.ended ? timeLabel(item.ended.atISO) : "—"}
      </Text>

      <Text style={styles.cardLine}>Kesto: {duration}</Text>
    </View>
  );
};


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Pieni kartta */}
        <View style={styles.mapWrap}>
          <MapView style={styles.map} region={region}>
            {currentPoint && <Marker coordinate={currentPoint} title="Oma sijainti" />}
            {activeSession?.started && <Marker coordinate={activeSession.started.point} title="Aloitus" />}
          </MapView>
        </View>

        {/* Napit kartan alla */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleStart}
            disabled={!!activeSession}
            style={[styles.button, { backgroundColor: colors.primary, opacity: activeSession ? 0.5 : 1 }]}
          >
            <Text style={styles.buttonText}>Aloita työpäivä</Text>
          </Pressable>

          <Pressable
            onPress={handleStopWithConfirm}
            disabled={!activeSession}
            style={[styles.button, { backgroundColor: colors.secondary, opacity: activeSession ? 1 : 0.5 }]}
          >
            <Text style={styles.buttonText}>Lopeta</Text>
          </Pressable>
        </View>

        {/* Nykytilanne */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nykytilanne</Text>
          <CurrentCard />
        </View>

        {/* Menneet työvuorot napin takana */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setShowPast((v) => !v)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {showPast ? "Piilota menneet työvuorot" : "Näytä menneet työvuorot"}
            </Text>
          </Pressable>

          {showPast && (
            <FlatList
              style={{ marginTop: 10 }}
              data={pastSessions}
              keyExtractor={(item) => item.id}
              renderItem={renderPast}
              ListEmptyComponent={<Text style={styles.muted}>Ei vielä menneitä työvuoroja.</Text>}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 12, backgroundColor: colors.background },

  mapWrap: { height: 160, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.specialColor },
  map: { flex: 1 },

  buttonRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.text, fontWeight: "800" },

  section: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 8 },

  muted: { color: colors.mutedText },

  toggle: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.specialColor,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  toggleText: { color: colors.text, fontWeight: "800" },

  card: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  cardTitle: { fontWeight: "900", color: colors.text, marginBottom: 6 },
  cardLine: { color: colors.mutedText },
});

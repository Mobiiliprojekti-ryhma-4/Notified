import React, { useEffect, useMemo, useState } from "react"
import {View,Text, StyleSheet, ActivityIndicator, Pressable, ScrollView, Dimensions,} from "react-native"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import { PieChart, LineChart } from "react-native-chart-kit"
import { db } from "../../firebase/Config"
import colors from "../../theme/colors"

type YesNo = "Kyllä" | "Ei"

function daysAgoTimestamp(days: number) {
  const ms = Date.now() - days * 24 * 60 * 60 * 1000
  return Timestamp.fromMillis(ms)
}

// viimeiset N viikkoavainta muodossa YYYY-WW (ISO-viikko)
function lastNWeeks(n: number) {
  const out: string[] = []
  const d = new Date()

  for (let i = 0; i < n; i++) {
    const dt = new Date(d)
    dt.setDate(d.getDate() - i * 7)

    const date = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    const year = date.getUTCFullYear()
    const ww = String(weekNo).padStart(2, "0")
    out.push(`${year}-${ww}`)
  }

  return Array.from(new Set(out)).reverse()
}

// fallback: laske yearWeek createdAt:sta jos yearWeek puuttuu
function getISOYearWeekFromTimestamp(ts: any): string | null {
  if (!ts?.toDate) return null

  const d = ts.toDate()
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  const year = date.getUTCFullYear()
  const ww = String(weekNo).padStart(2, "0")

  return `${year}-${ww}`
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true)
  const [rangeDays, setRangeDays] = useState<7 | 30 | 365>(30)

  const [total, setTotal] = useState(0)

  const [masterYes, setMasterYes] = useState(0)
  const [masterNo, setMasterNo] = useState(0)

  const [petsYes, setPetsYes] = useState(0)
  const [petsNo, setPetsNo] = useState(0)

  const [imagesYes, setImagesYes] = useState(0)
  const [imagesNo, setImagesNo] = useState(0)

  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([])
  const [weeklyCounts, setWeeklyCounts] = useState<number[]>([])

  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const since = useMemo(() => daysAgoTimestamp(rangeDays), [rangeDays])
  const screenWidth = Dimensions.get("window").width
  const chartWidth = Math.max(320, screenWidth - 32)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)

    try {
      const colRef = collection(db, "serviceRequests")
      const base = query(colRef, where("createdAt", ">=", since))

      const docsSnap = await getDocs(base)

      let totalCount = 0
      let masterYesCount = 0
      let masterNoCount = 0
      let petsYesCount = 0
      let petsNoCount = 0
      let imagesYesCount = 0
      let imagesNoCount = 0

      const weekMap = new Map<string, number>()

      docsSnap.forEach((doc) => {
        const data: any = doc.data()
        totalCount++

        if (data.masterKeyUsage === "Kyllä") masterYesCount++
        else if (data.masterKeyUsage === "Ei") masterNoCount++

        if (data.pets === "Kyllä") petsYesCount++
        else if (data.pets === "Ei") petsNoCount++

        const urls = data.imageUrls
        const hasImage = Array.isArray(urls) && urls.length > 0
        if (hasImage) imagesYesCount++
        else imagesNoCount++

        const yw = data.yearWeek ?? getISOYearWeekFromTimestamp(data.createdAt)
        if (yw) {
          weekMap.set(yw, (weekMap.get(yw) ?? 0) + 1)
        }
      })

      setTotal(totalCount)
      setMasterYes(masterYesCount)
      setMasterNo(masterNoCount)
      setPetsYes(petsYesCount)
      setPetsNo(petsNoCount)
      setImagesYes(imagesYesCount)
      setImagesNo(imagesNoCount)

      const weeks = lastNWeeks(12)
      setWeeklyLabels(weeks.map((w) => w.slice(5)))
      setWeeklyCounts(weeks.map((w) => weekMap.get(w) ?? 0))
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [since, refreshKey])

  const pct = (part: number, whole: number) => {
    if (!whole) return "0%"
    return `${Math.round((part / whole) * 100)}%`
  }

  const pieMaster = [
    { name: "Kyllä", population: masterYes, color: colors.primary, legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Ei", population: masterNo, color: colors.secondary, legendFontColor: colors.text, legendFontSize: 14 },
  ]

  const piePets = [
    { name: "Kyllä", population: petsYes, color: colors.primary, legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Ei", population: petsNo, color: colors.secondary, legendFontColor: colors.text, legendFontSize: 14 },
  ]

  const pieImages = [
    { name: "Kuva mukana", population: imagesYes, color: colors.primary, legendFontColor: colors.text, legendFontSize: 14 },
    { name: "Ei kuvaa", population: imagesNo, color: colors.secondary, legendFontColor: colors.text, legendFontSize: 14 },
  ]

  const masterTotal = masterYes + masterNo
  const petsTotal = petsYes + petsNo
  const imagesTotal = imagesYes + imagesNo

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Analytiikka</Text>

      <View style={styles.rangeRow}>
        <RangeButton label="7 pv" active={rangeDays === 7} onPress={() => setRangeDays(7)} />
        <RangeButton label="30 pv" active={rangeDays === 30} onPress={() => setRangeDays(30)} />
        <RangeButton label="12 kk" active={rangeDays === 365} onPress={() => setRangeDays(365)} />
      </View>

      <Pressable style={styles.refreshBtn} onPress={() => setRefreshKey((k) => k + 1)}>
        <Text style={styles.refreshBtnText}>Päivitä</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Haetaan…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>Virhe: {error}</Text>
      ) : (
        <>
          <Card title={`Ilmoituksia yhteensä (${rangeDays} pv)`} value={`${total}`} />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Yleisavain (Kyllä/Ei %)</Text>
          <PieChart data={pieMaster} width={chartWidth} height={220} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"12"} center={[0, 0]} chartConfig={chartConfig} />
          <Text style={styles.smallNote}>Kyllä {pct(masterYes, masterTotal)} • Ei {pct(masterNo, masterTotal)}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Kotieläimet (Kyllä/Ei %)</Text>
          <PieChart data={piePets} width={chartWidth} height={220} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"12"} center={[0, 0]} chartConfig={chartConfig} />
          <Text style={styles.smallNote}>Kyllä {pct(petsYes, petsTotal)} • Ei {pct(petsNo, petsTotal)}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Kuva vikailmoituksessa (Kyllä/Ei %)</Text>
          <PieChart data={pieImages} width={chartWidth} height={220} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"12"} center={[0, 0]} chartConfig={chartConfig} />
          <Text style={styles.smallNote}>Kuva mukana {pct(imagesYes, imagesTotal)} • Ei kuvaa {pct(imagesNo, imagesTotal)}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Ilmoitukset viikoittain</Text>
          <LineChart
            data={{ labels: weeklyLabels, datasets: [{ data: weeklyCounts.length ? weeklyCounts : [0] }] }}
            width={chartWidth}
            height={240}
            chartConfig={chartConfig}
            bezier
          />
        </>
      )}
    </ScrollView>
  )
}

function RangeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rangeBtn, active && styles.rangeBtnActive, pressed && { opacity: 0.9 }]}>
      <Text style={[styles.rangeBtnText, active && styles.rangeBtnTextActive]}>{label}</Text>
    </Pressable>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  )
}

const chartConfig = {
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  decimalPlaces: 0,
  color: () => colors.primary,
  labelColor: () => colors.text,
  propsForDots: { r: "4" },
}

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: 
    colors.background, 
    gap: 12 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: colors.text, 
    marginBottom: 4 
  },
  sectionTitle: { 
    marginTop: 2, 
    fontSize: 16, 
    fontWeight: "800", 
    color: colors.text 
  },
  smallNote: { 
    color: colors.mutedText, 
    fontWeight: "700", 
    marginTop: -6, 
    marginBottom: 6 
  },
  divider: { 
    height: 1, 
    backgroundColor: "rgba(0,0,0,0.08)", 
    marginVertical: 6 
  },
  card: { 
    padding: 14, 
    borderRadius: 14, 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.08)" 
  },
  cardTitle: { 
    color: colors.mutedText, 
    fontWeight: "700", 
    marginBottom: 6 
  },
  cardValue: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: "900" 
  },
  loadingRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    paddingVertical: 10 
  },
  loadingText: { 
    color: colors.mutedText, 
    fontWeight: "700" 
  },
  errorText: { 
    color: "crimson", 
    fontWeight: "700" 
  },
  rangeRow: { 
    flexDirection: "row", 
    gap: 8, marginBottom: 6 
  },
  rangeBtn: { 
    flex: 1, 
    height: 40, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.10)" 
  },
  rangeBtnActive: { 
    borderColor: colors.primary 
  },
  rangeBtnText: { 
    color: colors.text, 
    fontWeight: "800" 
  },
  rangeBtnTextActive: { 
    color: colors.primary 
  },
  refreshBtn: { 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "rgba(0,0,0,0.10)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  refreshBtnText: { 
    fontWeight: "900", 
    color: colors.text 
  },
})
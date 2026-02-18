import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

import { useAuth } from "../context/AuthContext";
import colors from "../theme/colors";

export default function HomeScreen() {
  const { role } = useAuth();

  let text: string;

  switch (role) {
    case "admin":
      text =
        "Tervetuloa ylläpitoon.\n\n" +
        "Valitse valikosta haluamasi toiminto:\n" +
        "• Vikailmoitukset\n" +
        "• Käyttäjät\n" +
        "• Työajanseuranta\n" +
        "• Analytiikka\n\n";
      break;

    case "worker":
      text =
        "Tervetuloa.\n\n" +
        "Avaa työajanseuranta valikosta ja kirjaa työpäiväsi.\n" +
        "Muista tarkistaa tehtävät ja lisätä tarvittaessa kommentit.\n\n" +
        "Jos jokin tieto puuttuu, ota yhteys ylläpitoon.";
      break;

    default:

      text = "";
  }

  const noop = () => {}; 

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/HuoltoHommeliLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {role === "admin" || role === "worker" ? (
        <Text style={styles.body}>{text}</Text>
      ) : (
        <Text style={styles.body}>
          <Text style={styles.demoTitle}>DEMO NÄKYMÄ</Text>
          {"\n\n\n"}

          <Text style={styles.bold}>Talonyhtiösi</Text>
          {" Viirumäki          "}
          <Text style={styles.link} onPress={noop} accessibilityRole="link">
            vaihda talonyhtiötä
          </Text>
          {"\n\n"}

          <Text style={styles.bold}>Huoltoyhtiönne</Text>
          {" Huolto Mäkiset\n"}

          {"Kiireettömissä asioissa jätä vikailmoitus. Kiiretilanteissa soita "}
          <Text style={styles.phone} onPress={noop} accessibilityRole="link">
            01023560
          </Text>
          {" (24/7)\n\n"}

          <Text style={styles.bold}>Talonyhtiönne ajankohtaiset uutiset</Text>
          {"\n\n"}

          {"• Yhtiökokous 25.4.2026 Klo 17:00 Kerhohuoneella  "}
          <Text style={styles.link} onPress={noop} accessibilityRole="link">
            Lue lisää
          </Text>
          {"\n"}

          {"• Palovaroittimen vuositarkastus  "}
          <Text style={styles.link} onPress={noop} accessibilityRole="link">
            Lue lisää
          </Text>
          {"\n"}

          {"• A54 haluaa vuokrata ylimääräisen parkkipaikan  "}
          <Text style={styles.link} onPress={noop} accessibilityRole="link">
            Lue lisää
          </Text>
          {"\n"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    justifyContent: "flex-start",
  },
  logo: {
    width: 220,
    height: 90,
    alignSelf: "center",
    marginBottom: 160,
  },
  body: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 24,
  },

  demoTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  bold: {
    fontWeight: "900",
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  phone: {
    fontWeight: "900",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
});

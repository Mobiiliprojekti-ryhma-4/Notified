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
      text =
        "Tervetuloa.\n\n" +
        "Voit tehdä vikailmoituksen valikosta ja seurata omien ilmoitustesi tilannetta.\n" +
        "Lisää mahdollisimman tarkat tiedot ja tarvittaessa kuva.\n\n" +
        "Mikäli olet työntekijä ota yhteys ylläpitoon";
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/HuoltoHommeliLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.body}>{text}</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 24,
  },
});

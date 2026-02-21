# HuoltoHommeli

## Miksi 

## Idea

HuoltoHommeli on React Native (Expo) -mobiilisovellus taloyhtiön/huoltoyhtiön vikailmoitusten hallintaan.

### Sovelluksessa on kolme roolia:

- Customer (asiakas): tekee vikailmoituksia ja näkee omat ilmoitukset

- Worker (työntekijä): näkee hänelle määrätyt työt, aloittaa työn, lisää työlle kommentin ja sulkee työn valmiiksi

- Admin (ylläpito): näkee kaikki vikailmoitukset, voi määrätä työntekijän työlle, näkee työajanseurannan ja analytiikkaa

## Teknologiat

- React Native + Expo

- React Navigation (Drawer)

- Firebase

- Authentication (kirjautuminen / rekisteröinti)

- Firestore (vikailmoitukset, käyttäjät, työvuorot, notifikaatiot)

- Storage (kuvien tallennus vikailmoituksiin)

- expo-image-picker (kamerasta/galleriasta kuvat vikailmoitukseen)

## Rakenne (yksinkertaistettuna)

- navigation/ – DrawerNavigator ja roolipohjainen navigointi

### screens/

- UserScreens/ – asiakasnäkymät (lomake, omat vikailmoitukset)

- WorkerScreens/ – työntekijän työlista ja työajanseuranta

### AdminScreens/ – ylläpidon vikailmoitukset, käyttäjälista, työajanseuranta, analytiikka

- services/ – auth-palvelu ym.

- firebase/Config.ts – Firebase-konfiguraatio

- theme/ – värit (colors)


## Sovelluksen ajaminen puhelimessa (Expo Go)

### Android

Lataa play kaupasta Expo Go

Skannaa QR-koodi (Expo Go:n scan-toiminnolla)

Sovellus avautuu puhelimeen

Huom: puhelimen ja tietokoneen pitää yleensä olla samassa verkossa.

## Riippuvuuksien asennus ja käynnistys

 Hae Main haara omalle koneelle ja lisää env tidostoon oikeat tiedot

 Asenna paketit: **npm install**

 Käynnistä Expo: **npx expo start**

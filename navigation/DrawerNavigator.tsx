import React, { useEffect } from "react"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { View, ActivityIndicator, Alert } from "react-native"

import { useAuth } from "../context/AuthContext"
import colors from "../theme/colors"
import CustomDrawer from "../components/CustomDrawer"

import HomeScreen from "../screens/HomeScreen"
import ProfileScreen from "../screens/ProfileScreen"
import ServiceRequestForm from "../screens/UserScreens/ServiceRequestForm"
import TimeTrackingScreen from "../screens/WorkerScreens/TimeTrackingScreen"
import UserListScreen from "../screens/AdminScreens/UserListScreen"
import ServiceRequestAdminScreen from "../screens/AdminScreens/ServiceRequestsAdminScreen"
import MyServicerequestScreen from "../screens/UserScreens/MyServicerequestScreen"
import AdminTimeTrackingScreen from "../screens/AdminScreens/AdminTimeTrackingScreen"
import AnalyticsScreen from "../screens/AdminScreens/AnalyticsScreen"
import WorkerWorkList from "../screens/WorkerScreens/WorkerWorkList"

import { auth, db } from "../firebase/Config"
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  const { role, loading } = useAuth()
  const uid = auth.currentUser?.uid

  
  useEffect(() => {
    if (!uid) return
    if (loading) return 

    const qy = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(1)
    )

    const unsub = onSnapshot(qy, (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type !== "added") return

        const data = chg.doc.data() as any
        if (data.read) return

        Alert.alert(
          data.title ?? "Ilmoitus",
          data.body ?? "",
          [{ text: "OK", style: "cancel" }],
          { cancelable: true }
        )

        
        updateDoc(doc(db, "users", uid, "notifications", chg.doc.id), {
          read: true,
        }).catch(() => {})
      })
    })

    return () => unsub()
  }, [uid, loading, role])

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <Drawer.Navigator
      initialRouteName="Koti"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },

        drawerStyle: { backgroundColor: colors.background },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.mutedText,
        drawerActiveBackgroundColor: "rgba(87, 156, 209, 0.18)",

        drawerItemStyle: { borderRadius: 10, marginHorizontal: 8 },
        drawerLabelStyle: { fontWeight: "600" },
      }}
    >
      {/* Kaikille käyttäjille */}
      <Drawer.Screen
        name="Koti"
        component={HomeScreen}
        options={{ title: "Etusivu", drawerLabel: "Etusivu" }}
      />

      <Drawer.Screen
        name="Asetukset"
        component={ProfileScreen}
        options={{ title: "Asetukset", drawerLabel: "Asetukset" }}
      />

      {/* CUSTOMER */}
      {role === "customer" && (
        <Drawer.Screen
          name="Vikailmoitus"
          component={ServiceRequestForm}
          options={{ title: "Vikailmoitus", drawerLabel: "Vikailmoitus" }}
        />
      )}

      {role === "customer" && (
        <Drawer.Screen
          name="Omat vikailmoitukset"
          component={MyServicerequestScreen}
          options={{
            title: "Omat vikailmoitukset",
            drawerLabel: "Omat vikailmoitukset",
          }}
        />
      )}

      {/* WORKER */}
      {role === "worker" && (
        <Drawer.Screen
          name="Työajanseuranta"
          component={TimeTrackingScreen}
          options={{ title: "Työajanseuranta", drawerLabel: "Työajanseuranta" }}
        />
      )}

      {role === "worker" && (
        <Drawer.Screen
          name="Työjono"
          component={WorkerWorkList}
          options={{ title: "Työjono", drawerLabel: "Työjono" }}
        />
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <>
          <Drawer.Screen
            name="UserList"
            component={UserListScreen}
            options={{ title: "Käyttäjät", drawerLabel: "Käyttäjät" }}
          />

          <Drawer.Screen
            name="AdminTimeTrackingScreen"
            component={AdminTimeTrackingScreen}
            options={{ title: "Työajanseuranta", drawerLabel: "Työajanseuranta" }}
          />

          <Drawer.Screen
            name="AdminServiceRequests"
            component={ServiceRequestAdminScreen}
            options={{ title: "Vikailmoitukset", drawerLabel: "Vikailmoitukset" }}
          />

          <Drawer.Screen
            name="Analytiikka"
            component={AnalyticsScreen}
            options={{ title: "Analytiikka", drawerLabel: "Analytiikka" }}
          />
        </>
      )}
    </Drawer.Navigator>
  )
}
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc, updateDoc   } from "firebase/firestore";
import { db, auth } from "../../firebase/Config";
import { useAuth } from "../../context/AuthContext";
import colors from "../../theme/colors"; 
import { Ionicons } from "@expo/vector-icons";

type UserRole = "admin" | "worker" | "customer";


type UserDoc = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: UserRole;
};


export default function UserListScreen() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
  
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all"); // sudatus dropdown rooleille
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    if (role !== "admin") {
      Alert.alert("Ei oikeuksia", "Tämä näkymä on vain adminille.");
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
     
      collection(db, "users"),
      (snap) => {
        const rows: UserDoc[] = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as any),
        }));
        setUsers(rows);
        setLoading(false);
      },
      (e) => {
        console.log(e);
        setLoading(false);
        Alert.alert("Virhe", "Käyttäjien haku epäonnistui.");
      }
    );

    return unsub;
  }, [role]);

  const changeRole = async (newRole: UserRole) => {
  if (!selectedUser || updating) return;

  //  Estä adminia poistamasta omaa admin-roolia
  if (
    selectedUser.uid === auth.currentUser?.uid &&
    newRole !== "admin"
  ) {
    Alert.alert("Ei sallittu", "Et voi muuttaa omaa admin-rooliasi.");
    return;
  }

  //  Älä päivitä jos rooli on sama
  if (selectedUser.role === newRole) {
    setRoleModalOpen(false);
    return;
  }

  try {
    setUpdating(true);

    await updateDoc(doc(db, "users", selectedUser.uid), {
      role: newRole,
    });

    setRoleModalOpen(false);
    setSelectedUser(null);

    Alert.alert("Onnistui", "Rooli päivitetty.");
  } catch (e: any) {
    Alert.alert("Virhe", e?.message ?? "Roolin vaihto epäonnistui.");
  } finally {
    setUpdating(false);
  }
};


const openRoleModal = (user: UserDoc) => {
  setSelectedUser(user);
  setSelectedRole(user.role ?? "customer");
  setRoleModalOpen(true);
};
 

  const filteredUsers = useMemo(() => {
  if (filterRole === "all") return users;
  return users.filter((u) => u.role === filterRole);
}, [users, filterRole]);


  const renderItem = ({ item }: { item: UserDoc }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        {item.displayName ?? item.email ?? item.uid}
      </Text>

      {!!item.email && <Text style={styles.email}>{item.email}</Text>}

      <View style={styles.rowBetween}>
        <Text style={styles.roleText}>Rooli: {item.role ?? "customer"}</Text>

        <Pressable
          onPress={() => openRoleModal(item)}
          style={({ pressed }) => [
            styles.changeBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.changeBtnText}>Vaihda rooli</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Käyttäjät ({users.length})
      </Text>
{/*  Roolisuodatin */}
<View style={styles.filterContainer}>
 <Pressable
  onPress={() => setFilterOpen(!filterOpen)}
  style={({ pressed }) => [
    styles.filterButton,
    pressed && styles.btnPressed,
  ]}
>
  <Text style={styles.filterText}>
    Suodatus: {filterRole === "all" ? "Kaikki" : filterRole}
  </Text>

  <Ionicons
    name={filterOpen ? "chevron-up" : "chevron-down"}
    size={18}
    color={colors.text}
  />
</Pressable>

  {filterOpen && (
    <View style={styles.filterDropdown}>
      {(["all", "admin", "worker", "customer"] as const).map((r) => (
        <Pressable
          key={r}
          onPress={() => {
            setFilterRole(r);
            setFilterOpen(false);
          }}
          style={({ pressed }) => [
            styles.filterItem,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.filterItemText}>
            {r === "all" ? "Kaikki" : r}
          </Text>
        </Pressable>
      ))}
    </View>
  )}
</View>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Role Modal */}
      
<Modal
  visible={roleModalOpen}
  transparent
  animationType="slide"
  onRequestClose={() => setRoleModalOpen(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Vaihda rooli</Text>

      {(["admin", "worker", "customer"] as UserRole[]).map((r) => (
        <Pressable
          key={r}
          style={[
            styles.roleOption,
            selectedRole === r && { backgroundColor: "#eee" },
          ]}
          onPress={() => setSelectedRole(r)}
        >
          <Text style={styles.roleOptionText}>{r}</Text>
        </Pressable>
      ))}

      {/* Napit */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Pressable
          style={styles.cancelBtn}
          onPress={() => {
            setRoleModalOpen(false);
            setSelectedUser(null);
            setSelectedRole(null);
          }}
        >
          <Text style={styles.cancelText}>Peruuta</Text>
        </Pressable>
<Pressable
  style={[
    styles.saveBtn,
    selectedRole === selectedUser?.role && { opacity: 0.5 },
  ]}
  disabled={selectedRole === selectedUser?.role}
  onPress={() => {
    if (selectedRole) {
      changeRole(selectedRole);
    }
  }}
>
       
        
          <Text style={styles.saveText}>Tallenna</Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  name: {
    fontWeight: "900",
    color: colors.text,
  },

  email: {
    marginTop: 4,
    color: colors.mutedText,
  },

  roleText: {
    fontWeight: "700",
    color: colors.text,
  },

  rowBetween: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  changeBtn: {
    borderWidth: 1,
    borderColor: colors.specialColor,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  changeBtnText: {
    fontWeight: "900",
    color: colors.text,
  },

  btnPressed: {
    opacity: 0.85,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: colors.background,
    borderRadius:10,
    padding: 16,
    margin:10,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
    color: colors.text,
  },

  roleOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: "100%", 
  },

  roleOptionText: {
    fontWeight: "900",
    color: colors.text,
  },

  cancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
  },

  cancelText: {
    color: colors.primary,
    fontWeight: "900",
  },

filterContainer: {
  marginBottom: 10,
},

filterRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

filterText: {
  fontWeight: "700",
  color: colors.text,
},

filterDropdown: {
  marginTop: 6,
  borderWidth: 1,
  borderColor: colors.specialColor,
  borderRadius: 10,
  backgroundColor: "#fff",
},

filterItem: {
  paddingVertical: 10,
  paddingHorizontal: 12,
},

filterItemText: {
  fontWeight: "700",
  color: colors.text,
},


filterButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 1,
  borderColor: colors.specialColor,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  backgroundColor: "#fff",
  marginBottom: 10,
},

filterButtonText: {
  fontWeight: "900",
  color: colors.text,
},

saveBtn: {
  backgroundColor: colors.primary,
  paddingVertical: 10,
  paddingHorizontal: 16,
  paddingBottom:16,
  borderRadius: 10,
},

saveText: {
  color: "#fff",
  fontWeight: "900",
margin:5,
},


});


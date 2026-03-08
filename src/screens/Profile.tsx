import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  Image, Modal, FlatList, TextInput, ActivityIndicator, ScrollView, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../api/firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut, deleteUser } from 'firebase/auth';

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;
const s = (size: number) => (isTV ? size * 1.5 : size);

const AVATARS = [
  { id: '1', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Felix' },
  { id: '2', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Aneka' },
  { id: '3', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Milo' },
  { id: '4', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Luna' },
  { id: '5', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Oliver' },
  { id: '6', url: 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=Zoe' },
];

const MenuItem = ({ icon, label, onPress, color = "#A020F0", isDestructive = false }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity 
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.menuItem, 
        focused && { backgroundColor: '#202020', borderRadius: 10, borderColor: isDestructive ? '#FF3B30' : '#A020F0', borderWidth: 1 }
      ]}
    >
      <Ionicons name={icon} size={s(22)} color={isDestructive ? "#FF3B30" : (focused ? "#FFF" : color)} />
      <Text style={[styles.menuText, { fontSize: s(16), color: isDestructive ? "#FF3B30" : "#FFF" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function Profile() {
  const [avatar, setAvatar] = useState(AVATARS[0].url);
  const [nickname, setNickname] = useState('Usuário');
  const [tempNickname, setTempNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nickModal, setNickModal] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);

  useEffect(() => {
    let unsubscribe: () => void;
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      unsubscribe = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.avatarUrl) setAvatar(data.avatarUrl);
          if (data.nickname) setNickname(data.nickname);
        }
        setLoading(false);
      }, (error) => {
        // CORREÇÃO: Silencia o erro de permissão que ocorre após deletar a conta
        if (error.code !== 'permission-denied') {
          console.error("Erro Snapshot Profile:", error);
        }
        setLoading(false);
      });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleUpdateNickname = async () => {
    const user = auth.currentUser;
    if (!tempNickname.trim() || !user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { nickname: tempNickname.trim() }, { merge: true });
      setNickModal(false);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar o apelido.");
    } finally { setSaving(false); }
  };

  const handleSelectAvatar = async (url: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { avatarUrl: url }, { merge: true });
      setAvatarModal(false);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar o avatar.");
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  const handleClearHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    Alert.alert("Limpar Histórico", "Deseja apagar seu histórico permanentemente?", [
        { text: "Não" },
        { text: "Sim", onPress: async () => {
            try {
              const historyRef = collection(db, "users", user.uid, "history");
              const snapshot = await getDocs(historyRef);
              const batch = writeBatch(db);
              snapshot.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
              Alert.alert("Sucesso", "Histórico limpo!");
            } catch (e) { Alert.alert("Erro", "Falha ao limpar histórico."); }
        }}
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ EXCLUIR CONTA",
      "Isso apagará permanentemente seu perfil, favoritos e histórico. Esta ação não pode ser desfeita!",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "EXCLUIR TUDO", 
          style: "destructive", 
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              setSaving(true);
              const batch = writeBatch(db);
              const historyRef = collection(db, "users", user.uid, "history");
              const favRef = collection(db, "users", user.uid, "favorites");
              const userDoc = doc(db, "users", user.uid);

              const [hSnap, fSnap] = await Promise.all([getDocs(historyRef), getDocs(favRef)]);
              hSnap.docs.forEach(d => batch.delete(d.ref));
              fSnap.docs.forEach(d => batch.delete(d.ref));
              batch.delete(userDoc);

              await batch.commit();
              await deleteUser(user);
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert("Ação Necessária", "Por segurança, saia e entre novamente na conta antes de excluí-la.");
              } else {
                Alert.alert("Erro", "Não foi possível excluir a conta.");
              }
            } finally { setSaving(false); }
          } 
        }
      ]
    );
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#A020F0" size="large" /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={isTV ? styles.tvContentContainer : { paddingBottom: 40 }}>
      <View style={[styles.header, { marginTop: isTV ? 40 : 60 }]}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={() => setAvatarModal(true)} activeOpacity={0.8}>
          <Image source={{ uri: avatar }} style={[styles.avatarImage, { width: s(110), height: s(110) }]} />
          <View style={styles.editIcon}><Ionicons name="camera" size={s(14)} color="#FFF" /></View>
        </TouchableOpacity>
        
        <View style={styles.nameRow}>
          <Text style={[styles.userName, { fontSize: s(22) }]}>{nickname}</Text>
          <TouchableOpacity onPress={() => { setTempNickname(nickname); setNickModal(true); }}>
            <Ionicons name="create-outline" size={s(24)} color="#A020F0" style={{marginLeft: 15}} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.email, { fontSize: s(14) }]}>{auth.currentUser?.email}</Text>
      </View>

      <View style={isTV ? styles.tvMenuWrapper : { width: '100%' }}>
        <Text style={[styles.sectionLabel, { fontSize: s(12) }]}>PREFERÊNCIAS</Text>
        <View style={styles.menu}>
          <MenuItem icon="trash-outline" label="Limpar Histórico" onPress={handleClearHistory} />
        </View>

        <Text style={[styles.sectionLabel, { fontSize: s(12) }]}>CONTA E SEGURANÇA</Text>
        <View style={styles.menu}>
          <MenuItem icon="mail-outline" label="Redefinir Senha" onPress={() => {
            if(auth.currentUser?.email) {
              sendPasswordResetEmail(auth, auth.currentUser.email);
              Alert.alert("E-mail enviado", "Verifique sua caixa de entrada.");
            }
          }} />
          <MenuItem icon="log-out-outline" label="Sair da Conta" onPress={handleLogout} />
          <MenuItem icon="person-remove-outline" label="Excluir minha conta" isDestructive onPress={handleDeleteAccount} />
        </View>
      </View>

      <Text style={[styles.version, { fontSize: s(12) }]}>Anime Go v1.0.2 • BitSoul Studios</Text>

      {/* MODAL AVATAR */}
      <Modal visible={avatarModal} animationType="slide" transparent onRequestClose={() => setAvatarModal(false)}>
        <View style={styles.modalBgBottom}>
          <View style={[styles.avatarModalContent, isTV && { height: '80%', alignSelf: 'center', width: '70%', borderRadius: 30 }]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: s(20) }]}>Escolha seu Avatar</Text>
                <TouchableOpacity onPress={() => setAvatarModal(false)}><Ionicons name="close" size={s(30)} color="#FFF" /></TouchableOpacity>
            </View>
            {saving ? <ActivityIndicator color="#A020F0" style={{ marginTop: 20 }} /> : (
              <FlatList data={AVATARS} numColumns={isTV ? 4 : 3} keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.avatarOption} onPress={() => handleSelectAvatar(item.url)}>
                    <Image source={{ uri: item.url }} style={[styles.avatarGrid, { width: s(90), height: s(90) }, avatar === item.url && { borderColor: '#A020F0', borderWidth: 3 }]} />
                  </TouchableOpacity>
                )} />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL NICKNAME */}
      <Modal visible={nickModal} transparent animationType="fade" onRequestClose={() => setNickModal(false)}>
        <View style={styles.modalBgCentered}>
          <View style={[styles.nickModalContent, { maxWidth: 450 }]}>
            <Text style={[styles.modalTitle, { fontSize: s(18) }]}>Editar Apelido</Text>
            <TextInput style={[styles.input, { height: s(55), fontSize: s(16) }]} value={tempNickname} onChangeText={setTempNickname} placeholderTextColor="#666" maxLength={15} autoFocus={true} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setNickModal(false)} style={styles.btnCancel} disabled={saving}><Text style={{color: '#666', fontSize: s(14)}}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateNickname} style={[styles.btnSave, { paddingVertical: s(12) }]} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: s(14)}}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  tvContentContainer: { alignItems: 'center' },
  tvMenuWrapper: { width: 600 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { borderRadius: 60, marginBottom: 15, overflow: 'visible' },
  avatarImage: { borderRadius: 60, borderWidth: 3, borderColor: '#A020F0', backgroundColor: '#1A1A1A' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#A020F0', borderRadius: 15, padding: 6, borderWidth: 2, borderColor: '#0A0A0A' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { color: '#FFF', fontWeight: 'bold' },
  email: { color: '#666' },
  sectionLabel: { color: '#A020F0', fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10, marginTop: 25 },
  menu: { backgroundColor: '#151515', borderRadius: 15, padding: 10, marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, marginBottom: 5 },
  menuText: { marginLeft: 15, fontWeight: '600' },
  version: { color: '#333', textAlign: 'center', marginTop: 40, marginBottom: 20 },
  modalBgCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBgBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  nickModalContent: { width: '85%', backgroundColor: '#151515', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#A020F0' },
  avatarModalContent: { backgroundColor: '#151515', height: '70%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalTitle: { color: '#FFF', fontWeight: 'bold' },
  input: { backgroundColor: '#0A0A0A', color: '#FFF', paddingHorizontal: 15, borderRadius: 12, marginTop: 20, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  btnCancel: { padding: 10, marginRight: 20 },
  btnSave: { backgroundColor: '#A020F0', paddingHorizontal: 25, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  avatarOption: { flex: 1, alignItems: 'center', margin: 10 },
  avatarGrid: { borderRadius: 20, borderWidth: 2, borderColor: '#333', backgroundColor: '#1A1A1A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
});
import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Image, Dimensions 
} from 'react-native';
import { db, auth } from '../api/firebase';
import { collection, query, orderBy, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Historico({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const historyRef = collection(db, "users", auth.currentUser.uid, "history");
    const q = query(historyRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id_doc: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Erro Firebase:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearHistory = async () => {
    Alert.alert(
      "Limpar Histórico",
      "Deseja remover todos os animes assistidos?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Limpar Tudo", 
          style: "destructive", 
          onPress: async () => {
            if (!auth.currentUser) return;
            const historyRef = collection(db, "users", auth.currentUser.uid, "history");
            const snapshot = await getDocs(historyRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
          } 
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#A020F0" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER PREMIUM BITSOUAL */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTÓRICO ANIME GO</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.iconBtn}>
          <Ionicons name="trash-bin-outline" size={24} color="#A020F0" />
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="play-circle-outline" size={80} color="#1A1A1A" />
          <Text style={styles.emptyText}>Você ainda não assistiu nada.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id_doc}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            // CORREÇÃO DA IMAGEM: 
            // O Details já manda a URL pronta. Se não mandar, montamos uma reserva.
            const imageUri = item.backdrop_path?.startsWith('http') 
              ? item.backdrop_path 
              : `https://image.tmdb.org/t/p/w500${item.backdrop_path || item.poster_path}`;

            return (
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => navigation.navigate('Player', { ...item })}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.backdrop} 
                    resizeMode="cover"
                  />
                  <LinearGradient 
                    colors={['transparent', 'rgba(10,10,10,0.8)']} 
                    style={styles.gradient} 
                  />
                  <View style={styles.playIconOverlay}>
                    <Ionicons name="play-circle" size={50} color="rgba(160, 32, 240, 0.9)" />
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>T{item.season} : E{item.episode}</Text>
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.animeName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar} />
                    <Text style={styles.continueText}>Retomar episódio</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loadingContainer: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20,
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A'
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  iconBtn: { width: 40, alignItems: 'center' },

  card: { 
    marginHorizontal: 15, 
    marginTop: 20, 
    backgroundColor: '#111', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  imageContainer: { width: '100%', height: (width - 30) * 0.56 }, 
  backdrop: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject },
  playIconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  
  badge: { 
    position: 'absolute', 
    bottom: 12, 
    right: 12, 
    backgroundColor: '#A020F0', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  infoContainer: { padding: 15 },
  animeName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  progressBar: { width: 4, height: 14, backgroundColor: '#00e156', marginRight: 8, borderRadius: 2 },
  continueText: { color: '#888', fontSize: 12, fontWeight: '600' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 16, marginTop: 15, fontWeight: '600' }
});
import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../api/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;
const s = (size: number) => (isTV ? size * 1.2 : size);

const FavoriteCard = ({ item, numColumns, navigation }: any) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ flex: 1 / numColumns, zIndex: focused ? 99 : 1 }}>
      <TouchableOpacity 
        activeOpacity={1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.card, 
          focused && styles.cardFocused 
        ]}
        onPress={() => navigation.navigate('Details', { animeId: item.id })}
      >
        <Image 
          source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/342x513?text=Sem+Imagem' }} 
          style={[
            styles.poster, 
            { height: isTV ? 250 : 160 }, 
            focused && { borderColor: '#A020F0', borderWidth: 3 }
          ]}
        />
        <Text numberOfLines={1} style={[styles.title, { fontSize: s(12), color: focused ? '#A020F0' : '#FFF' }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  const numColumns = isTV ? 6 : 3;

  useEffect(() => {
    const handleOrientation = async () => {
      if (isFocused) {
        if (isTV) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      }
    };
    handleOrientation();
  }, [isFocused]);

  useEffect(() => {
    // CORREÇÃO: Variável para armazenar o cancelador do onSnapshot
    let unsubscribe: () => void;

    // 1. Verificação de segurança: Só inicia se houver um usuário logado
    if (auth.currentUser) {
      const userUid = auth.currentUser.uid;
      const favRef = collection(db, "users", userUid, "favorites");
      const q = query(favRef, orderBy("addedAt", "desc"));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data() }));
        setFavorites(list);
        setLoading(false);
      }, (error) => {
        // Silencia erros de permissão que ocorrem durante o logout
        if (!error.message.includes("permissions")) {
          console.error("Erro ao ouvir favoritos:", error);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // 2. Limpeza: Cancela o ouvinte ao desmontar o componente ou mudar o usuário
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [auth.currentUser]); // Re-executa se o estado de autenticação mudar

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-dislike-outline" size={s(60)} color="#333" />
        <Text style={[styles.emptyText, { fontSize: s(16) }]}>Você ainda não salvou nenhum anime.</Text>
        <TouchableOpacity 
          style={styles.searchBtn} 
          onPress={() => navigation.navigate('Procurar')} // Ajustado para o nome da aba
        >
          <Text style={[styles.searchBtnText, { fontSize: s(14) }]}>Procurar Animes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isTV && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      <Text style={[styles.headerTitle, { fontSize: s(20) }]}>Meus Favoritos</Text>
      
      <FlatList
        data={favorites}
        key={numColumns} 
        numColumns={numColumns}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 15, paddingVertical: 10 }}
        renderItem={({ item }) => (
          <FavoriteCard 
            item={item} 
            numColumns={numColumns} 
            navigation={navigation} 
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loadingContainer: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 45, marginLeft: 20, marginBottom: 5 },
  headerTitle: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    marginBottom: 10, 
    marginTop: isTV ? 30 : 10, 
    marginLeft: 25 
  },
  emptyContainer: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#666', marginTop: 15, textAlign: 'center' },
  searchBtn: { 
    marginTop: 20, 
    backgroundColor: '#A020F0', 
    paddingVertical: 12, 
    paddingHorizontal: 25, 
    borderRadius: 30 
  },
  searchBtnText: { color: '#FFF', fontWeight: 'bold' },
  card: { 
    margin: 8, 
    alignItems: 'center', 
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    transform: [{ scale: 1.1 }],
    borderColor: '#A020F0',
    elevation: 20,
    backgroundColor: '#151515'
  },
  poster: { 
    width: '100%', 
    borderRadius: 10, 
    backgroundColor: '#151515'
  },
  title: { color: '#FFF', marginTop: 8, textAlign: 'center', fontWeight: 'bold' }
});
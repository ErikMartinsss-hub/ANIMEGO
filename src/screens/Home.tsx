import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, 
  StyleSheet, ScrollView, ActivityIndicator, Platform, ImageBackground, useWindowDimensions, StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- ADMOB REMOVIDO PARA COMPILAÇÃO ---
// import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

import tmdb from '../api/tmdb'; 
import { db, auth } from '../api/firebase'; 
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

const FocusableCard = ({ item, isTV, onPress, type = 'poster' }: any) => {
  const [focused, setFocused] = useState(false);
  const cardWidth = type === 'history' ? (isTV ? 220 : 180) : (isTV ? 140 : 110); 
  const cardHeight = type === 'history' ? (isTV ? 124 : 100) : (isTV ? 210 : 165);
  const imageUri = type === 'history' ? (item.backdrop_path || item.poster_path) : item.poster_path;

  return (
    <View style={{ zIndex: focused ? 99 : 1, paddingVertical: 10, marginRight: 15 }}>
      <TouchableOpacity 
        activeOpacity={1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={onPress}
        style={[styles.card, { width: cardWidth, height: cardHeight }, focused && styles.cardFocused]}
      >
        <Image source={{ uri: `https://image.tmdb.org/t/p/w342${imageUri}` }} style={styles.poster} />
        {type === 'history' && (
          <View style={styles.historyInfoBadge}><Text style={styles.historyInfoText}>T{item.season} : E{item.episode}</Text></View>
        )}
        {focused && <View style={styles.focusOverlay}><Ionicons name="play-circle" size={35} color="#A020F0" /></View>}
      </TouchableOpacity>
      {!focused && type !== 'history' && <Text numberOfLines={1} style={styles.miniTitleBelow}>{item.name || item.title}</Text>}
    </View>
  );
};

export default function Home() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const isTV = Platform.isTV || width > 1000;

  const [trending, setTrending] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [actionAnimes, setActionAnimes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA AUTO-PLAY BANNER PRINCIPAL ---
  const bannerListRef = useRef<FlatList>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerData = trending.slice(0, 5);

  // Efeito do Banner Auto-Play
  useEffect(() => {
    if (bannerData.length > 0) {
      const timer = setTimeout(() => {
        const nextIndex = (bannerIndex + 1) % bannerData.length;
        if (bannerListRef.current) {
          bannerListRef.current.scrollToIndex({ index: nextIndex, animated: true });
          setBannerIndex(nextIndex);
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [bannerIndex, bannerData]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [resTrending, resTop, resAction] = await Promise.all([
          tmdb.get('/discover/tv', { params: { with_genres: '16', sort_by: 'popularity.desc' } }),
          tmdb.get('/discover/tv', { params: { with_genres: '16', sort_by: 'vote_average.desc', 'vote_count.gte': 500 } }),
          tmdb.get('/discover/tv', { params: { with_genres: '16,10759', with_original_language: 'ja' } }),
        ]);
        setTrending(resTrending.data.results);
        setTopRated(resTop.data.results);
        setActionAnimes(resAction.data.results);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchAll();

    if (auth.currentUser) {
      const historyRef = collection(db, "users", auth.currentUser.uid, "history");
      const q = query(historyRef, orderBy("updatedAt", "desc"), limit(3));
      onSnapshot(q, (snapshot) => { setHistory(snapshot.docs.map(doc => doc.data())); });
    }
  }, []);

  // FUNÇÃO DE NAVEGAÇÃO (LÓGICA DE ANÚNCIO REMOVIDA)
  const handleAnimePress = (animeId: number) => {
    navigation.navigate('Details', { animeId });
  };

  const renderRow = (title: string, data: any[]) => (
    <View style={styles.rowContainer}>
      <View style={styles.rowHeader}><View style={styles.indicator} /><Text style={styles.rowTitle}>{title}</Text></View>
      <FlatList horizontal data={data} contentContainerStyle={{ paddingLeft: 20 }} showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <FocusableCard item={item} isTV={isTV} onPress={() => handleAnimePress(item.id)} />}
      />
    </View>
  );

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#A020F0" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { paddingTop: isTV ? 20 : 45 }]}>
        <Text style={styles.logoText}>ANIME<Text style={{color: '#A020F0'}}>GO</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: isTV ? height * 0.7 : 480 }}>
            <FlatList 
                ref={bannerListRef}
                data={bannerData}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => 'hero-' + item.id}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    if (index !== bannerIndex) setBannerIndex(index);
                }}
                renderItem={({item}) => (
                    <TouchableOpacity activeOpacity={1} style={{width: width, height: '100%'}} onPress={() => handleAnimePress(item.id)}>
                        <ImageBackground source={{ uri: `https://image.tmdb.org/t/p/original${item.backdrop_path}` }} style={styles.heroImage}>
                            <LinearGradient colors={['transparent', 'rgba(10,10,10,0.5)', '#0A0A0A']} style={styles.heroOverlay}>
                                <Text style={styles.heroTitle}>{item.name}</Text>
                                <Text numberOfLines={2} style={styles.heroSub}>{item.overview}</Text>
                                <View style={styles.heroBtn}>
                                    <Ionicons name="play" size={20} color="#FFF" />
                                    <Text style={styles.heroBtnText}>ASSISTIR AGORA</Text>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </TouchableOpacity>
                )}
            />
        </View>

        {history.length > 0 && (
          <View style={styles.rowContainer}>
            <View style={styles.rowHeader}>
                <View style={[styles.indicator, {backgroundColor: '#00e156'}]} />
                <Text style={styles.rowTitle}>CONTINUAR ASSISTINDO</Text>
            </View>
            <FlatList horizontal data={history} contentContainerStyle={{ paddingLeft: 20 }} showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <FocusableCard item={item} isTV={isTV} type="history" 
                  onPress={() => navigation.navigate('Player', { id: item.id, type: item.type, season: item.season, episode: item.episode })}
                />
              )}
            />
          </View>
        )}

        {renderRow("POPULARES NESTA TEMPORADA", trending)}
        {renderRow("RECOMENDADOS PARA VOCÊ", topRated)}
        {renderRow("ANIMES DE AÇÃO", actionAnimes)}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loading: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, width: '100%', zIndex: 999, backgroundColor: 'rgba(10,10,10,0.5)', paddingBottom: 10 },
  logoText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 25, paddingBottom: 40 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  heroSub: { color: '#CCC', fontSize: 13, marginBottom: 20, width: '85%' },
  heroBtn: { flexDirection: 'row', backgroundColor: '#A020F0', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  heroBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  rowContainer: { marginTop: 25 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginBottom: 15 },
  indicator: { width: 4, height: 18, backgroundColor: '#A020F0', marginRight: 10 },
  rowTitle: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  card: { borderRadius: 4, backgroundColor: '#1A1A1A', overflow: 'hidden' },
  poster: { width: '100%', height: '100%' },
  cardFocused: { borderColor: '#FFF', borderWidth: 2, transform: [{ scale: 1.05 }] },
  focusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  miniTitleBelow: { color: '#888', fontSize: 11, marginTop: 5, width: 110, fontWeight: '600' },
  historyInfoBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: '#00e156', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  historyInfoText: { color: '#000', fontSize: 10, fontWeight: '900' },
});
import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, ImageBackground, Alert, Dimensions, Platform 
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Episode } from '../types/tmdb';
import tmdb from '../api/tmdb';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../api/firebase'; 
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useIsFocused } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'Details'>;

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;
const s = (size: number) => (isTV ? size * 1.3 : size);

// --- COMPONENTE DE BOTÃO DE TEMPORADA ---
const SeasonButton = ({ num, selected, onPress }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 5, zIndex: focused ? 10 : 1 }}>
        <TouchableOpacity 
          activeOpacity={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPress={onPress}
          style={[
              styles.seasonButton, 
              selected === num && styles.activeSeason, 
              { paddingHorizontal: s(20) },
              focused && styles.seasonBtnFocused
          ]}
        >
          <Text style={[styles.seasonText, (selected === num || focused) && styles.activeSeasonText, { fontSize: s(14) }]}>T{num}</Text>
        </TouchableOpacity>
    </View>
  );
};

// --- COMPONENTE DE EPISÓDIO ---
const EpisodeCard = ({ ep, anime, isTV, onPress }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.episodeCardContainer, { width: isTV ? '48%' : '100%' }]}> 
      <TouchableOpacity 
        activeOpacity={1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={onPress}
        style={[
          styles.episodeCard, 
          focused && styles.cardFocused
        ]}
      >
        <Image 
          source={{ uri: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : `https://image.tmdb.org/t/p/w500${anime.backdrop_path}` }} 
          style={[styles.epImage, { width: isTV ? 160 : 120 }]} 
        />
        <View style={styles.epInfo}>
          <Text style={[styles.epNumber, { color: focused ? '#FFF' : '#A020F0' }]}>EP {ep.episode_number}</Text>
          <Text style={[styles.epTitle, { fontSize: s(13) }]} numberOfLines={1}>
            {ep.name || `Episódio ${ep.episode_number}`}
          </Text>
        </View>
        <Ionicons 
          name={focused ? "play-circle" : "play-circle-outline"} 
          size={s(28)} 
          color={focused ? "#FFF" : "#A020F0"} 
          style={{ alignSelf: 'center', marginRight: 15 }} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default function Details({ route, navigation }: Props) {
  const { animeId } = route.params;
  const isFocused = useIsFocused();
  const [anime, setAnime] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);

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
    async function loadInitialData() {
      try {
        const resDetail = await tmdb.get(`/tv/${animeId}`);
        setAnime(resDetail.data);
        if (auth.currentUser) {
          const favRef = doc(db, "users", auth.currentUser.uid, "favorites", String(animeId));
          const favSnap = await getDoc(favRef);
          setIsFavorite(favSnap.exists());
        }
        loadEpisodes(1); 
      } catch (error) {
        console.error("Erro ao carregar detalhes", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [animeId]);

  const loadEpisodes = async (seasonNumber: number) => {
    setLoadingEpisodes(true);
    try {
      const resEpisodes = await tmdb.get(`/tv/${animeId}/season/${seasonNumber}`);
      setEpisodes(resEpisodes.data.episodes);
      setSelectedSeason(seasonNumber);
    } catch (error) {
      console.error("Erro ao carregar episódios", error);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // --- CORREÇÃO AQUI: AJUSTE DE NOMES DE CAMPOS ---
  const handlePlayEpisode = async (ep: Episode) => {
    if (!anime) return;
    try {
      if (auth.currentUser) {
        const historyRef = doc(db, "users", auth.currentUser.uid, "history", String(animeId));
        await setDoc(historyRef, {
          id: Number(animeId), // Mudei de animeId para id
          name: anime.name, // Mudei de animeName para name
          poster_path: anime.poster_path,
          backdrop_path: anime.backdrop_path, // Importante para a imagem do card na Home
          season: ep.season_number, // Mudei de lastSeason para season
          episode: ep.episode_number, // Mudei de lastEpisode para episode
          type: 'serie',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (e) {
        console.log("Erro ao salvar progresso", e);
    } finally {
      navigation.navigate('Player', { 
        id: animeId, season: ep.season_number, episode: ep.episode_number, type: 'serie' 
      });
    }
  };

  const toggleFavorite = async () => {
    if (!anime || !auth.currentUser) return;
    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", String(anime.id));
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          id: anime.id, name: anime.name, poster_path: anime.poster_path,
          backdrop_path: anime.backdrop_path, addedAt: serverTimestamp()
        });
      }
      setIsFavorite(!isFavorite);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar favoritos.");
    }
  };

  if (loading || !anime) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground 
        source={{ uri: `https://image.tmdb.org/t/p/original${anime.backdrop_path}` }} 
        style={[styles.header, { height: isTV ? 450 : 280 }]}
      >
        <LinearGradient colors={['transparent', 'rgba(10, 10, 10, 0.8)', '#0A0A0A']} style={styles.gradient} />
        
        {!isTV && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.favHeaderBtn, { top: isTV ? 30 : 50 }]} 
          onPress={toggleFavorite}
        >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={s(28)} color={isFavorite ? "#A020F0" : "#FFF"} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w342${anime.poster_path}` }} 
            style={[styles.miniPoster, { width: s(90), height: s(135) }]} 
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: s(22) }]}>{anime.name}</Text>
            <Text style={[styles.infoText, { fontSize: s(13) }]}>
               {anime.first_air_date?.split('-')[0]} • {anime.number_of_seasons} Temporadas
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={[styles.content, isTV && styles.tvContentWrapper]}>
        <Text style={[styles.sectionTitle, { fontSize: s(18) }]}>Sinopse</Text>
        <Text style={[styles.overview, { fontSize: s(13) }]}>{anime.overview || "Sem sinopse disponível."}</Text>

        <Text style={[styles.sectionTitle, { fontSize: s(18) }]}>Temporadas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonPicker}>
          {Array.from({ length: anime.number_of_seasons }, (_, i) => i + 1).map((num) => (
            <SeasonButton 
              key={num} 
              num={num} 
              selected={selectedSeason} 
              onPress={() => loadEpisodes(num)} 
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
            <View style={[styles.neonBar, { height: s(20) }]} />
            <Text style={[styles.sectionTitle, { fontSize: s(18) }]}>Episódios</Text>
        </View>

        {loadingEpisodes ? (
          <ActivityIndicator color="#A020F0" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.tvEpisodesGrid}>
            {episodes.map((ep) => (
              <EpisodeCard key={ep.id} ep={ep} anime={anime} isTV={isTV} onPress={() => handlePlayEpisode(ep)} />
            ))}
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loading: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  header: { width: '100%', justifyContent: 'flex-end' },
  gradient: { ...StyleSheet.absoluteFillObject },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 11, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  favHeaderBtn: { position: 'absolute', right: 30, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 30, borderWidth: 1, borderColor: '#A020F0', zIndex: 10 },
  headerContent: { flexDirection: 'row', padding: 20, alignItems: 'flex-end', zIndex: 5 },
  miniPoster: { borderRadius: 8, borderWidth: 2, borderColor: '#A020F0' },
  headerText: { marginLeft: 20, flex: 1, marginBottom: 10 },
  title: { color: '#FFF', fontWeight: 'bold' },
  infoText: { color: '#A020F0', fontWeight: 'bold', marginTop: 5 },
  content: { padding: 20 },
  tvContentWrapper: { width: '95%', alignSelf: 'center' },
  sectionTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  overview: { color: '#BBB', lineHeight: 22, marginBottom: 20 },
  seasonPicker: { flexDirection: 'row', marginBottom: 25 },
  seasonButton: { paddingVertical: 8, backgroundColor: '#151515', borderRadius: 10, marginRight: 15, borderWidth: 2, borderColor: '#333' },
  activeSeason: { backgroundColor: '#A020F0', borderColor: '#FFF' },
  seasonBtnFocused: { 
    borderColor: '#FFF', 
    transform: [{ scale: 1.1 }], 
    backgroundColor: '#A020F0',
    elevation: 10,
    shadowColor: '#A020F0',
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  seasonText: { color: '#666', fontWeight: 'bold' },
  activeSeasonText: { color: '#FFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  neonBar: { width: 4, backgroundColor: '#A020F0', marginRight: 10 },
  
  episodeCardContainer: { padding: 8, zIndex: 1 },
  episodeCard: { 
    flexDirection: 'row', 
    backgroundColor: '#151515', 
    borderRadius: 12, 
    height: 90, 
    borderWidth: 2, 
    borderColor: 'transparent',
  },
  epImage: { 
    height: '100%',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10
  },
  cardFocused: { 
    borderColor: '#FFF', 
    backgroundColor: '#A020F0', 
    transform: [{ scale: 1.05 }],
    elevation: 20,
    zIndex: 999,
  },
  tvEpisodesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  epInfo: { padding: 12, justifyContent: 'center', flex: 1 },
  epNumber: { fontWeight: 'bold', fontSize: 14 },
  epTitle: { color: '#FFF', fontWeight: '500', marginTop: 2 },
});
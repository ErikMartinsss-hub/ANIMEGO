import React, { useEffect, useState, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, StatusBar, Text,
  FlatList, Modal, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { auth, db } from '../api/firebase';
import { doc, setDoc } from 'firebase/firestore';

const API_KEY = '8afc06276fa4cd6f89d291b3b8ddf9a8'; 

export default function Player({ route, navigation }: any) {
  useKeepAwake();

  const params = route.params || {};
  const id = params.id || params.item?.id;
  const type = params.tipo || params.type || (params.item?.temp ? 'serie' : 'filme');
  const initialSeason = params.season || params.item?.temp || 1;
  const episode = params.episode || params.item?.ep || 1;

  const webViewRef = useRef<WebView>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSeason, setActiveSeason] = useState(initialSeason);
  const [loading, setLoading] = useState(true);
  
  const [realTotalSeasons, setRealTotalSeasons] = useState(1);
  const [episodesInSeason, setEpisodesInSeason] = useState(24);

  const playerSource = 'playerflixapi.com';

  const embedUrl =
    type === 'serie' || type === 'tv'
      ? `https://${playerSource}/serie/${id}/${activeSeason}/${episode}`
      : `https://${playerSource}/filme/${id}`;

  // Corrigido: Adicionado playsinline para iOS não forçar tela cheia nativa
  const htmlPlayer = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="${embedUrl}" allowfullscreen="true" scrolling="no" playsinline></iframe>
      </body>
    </html>
  `;

  const jsCode = `
    (function() {
      const removeAds = () => {
        const ads = document.querySelectorAll('div[style*="z-index"], #popoverlay, .ad-banner, ins');
        ads.forEach(ad => { ad.style.display = 'none'; ad.remove(); });
      };
      setInterval(removeAds, 1000);
      setTimeout(() => { document.body.click(); }, 2000);
    })();
    true;
  `;

  useEffect(() => {
    if (type === 'serie' || type === 'tv') {
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=pt-BR`)
        .then(res => res.json())
        .then(data => {
          if (data.number_of_seasons) setRealTotalSeasons(data.number_of_seasons);
        });
    }
  }, [id, type]);

  useEffect(() => {
    if (type === 'serie' || type === 'tv') {
      fetch(`https://api.themoviedb.org/3/tv/${id}/season/${activeSeason}?api_key=${API_KEY}&language=pt-BR`)
        .then(res => res.json())
        .then(data => {
          if (data.episodes) setEpisodesInSeason(data.episodes.length);
        })
        .catch(() => setEpisodesInSeason(24)); 
    }
  }, [activeSeason, id, type]);

  const saveProgress = async (s: number, ep: number) => {
    if (!auth.currentUser || !id) return;
    try {
      const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', id.toString());
      await setDoc(historyRef, {
          id: Number(id),
          type,
          season: s,
          episode: ep,
          updatedAt: Date.now(),
          name: params.name || params.item?.name || "Anime",
          backdrop_path: params.backdrop_path || params.item?.backdrop_path || ""
        }, { merge: true });
    } catch (e) { console.error('Erro Firebase:', e); }
  };

  // Corrigido: Melhor tratamento de orientação para iOS
  useEffect(() => {
    const lock = async () => {
      if (Platform.OS !== 'web') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    };
    lock();
    saveProgress(activeSeason, episode);

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    };
  }, [activeSeason, episode]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <WebView
        ref={webViewRef}
        key={embedUrl}
        source={{ 
          html: htmlPlayer,
          baseUrl: `https://${playerSource}` 
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        injectedJavaScript={jsCode}
        // Corrigido: UserAgent dinâmico (iOS usa o nativo para não bugar o player)
        userAgent={Platform.OS === 'android' ? "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36" : undefined}
        mixedContentMode="always"
        originWhitelist={['*']}
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;
          if (!url.startsWith('http')) return false; 
          if (
            url.includes(playerSource) || 
            url.includes("google") || 
            url.includes("gstatic") ||
            url.startsWith('data:') || 
            url.includes('about:blank')
          ) {
            return true;
          }
          return request.isTopFrame ? false : false;
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#D10DF8" />
          <Text style={styles.loadingText}>Iniciando Player...</Text>
        </View>
      )}

      <View style={styles.topControls} pointerEvents="box-none">
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => webViewRef.current?.reload()}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>

          {(type === 'serie' || type === 'tv') && (
            <TouchableOpacity style={styles.epBtn} onPress={() => setShowMenu(true)}>
              <Text style={styles.btnText}>T{activeSeason} • EP {episode}</Text>
              <Ionicons name="list" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showMenu} transparent animationType="slide" onRequestClose={() => setShowMenu(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeArea} onPress={() => setShowMenu(false)} />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>TEMPORADAS ({realTotalSeasons})</Text>
            <View style={{ height: 50, marginBottom: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {Array.from({ length: realTotalSeasons }, (_, i) => i + 1).map((num) => (
                  <TouchableOpacity
                    key={`season-${num}`}
                    style={[styles.seasonTab, activeSeason === num && styles.seasonActive]}
                    onPress={() => setActiveSeason(num)}
                  >
                    <Text style={[styles.seasonText, activeSeason === num && { color: '#FFF' }]}>T{num}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.menuTitle}>EPISÓDIOS</Text>
            <FlatList
              data={Array.from({ length: episodesInSeason }, (_, i) => i + 1)} 
              keyExtractor={(item) => `ep-${item}`}
              renderItem={({ item: epNum }) => (
                <TouchableOpacity
                  style={[styles.epCard, (episode === epNum && activeSeason === initialSeason) && styles.epActive]}
                  onPress={() => {
                    setShowMenu(false);
                    navigation.replace('Player', { 
                      id, type, season: activeSeason, episode: epNum,
                      name: params.name || params.item?.name,
                      backdrop_path: params.backdrop_path || params.item?.backdrop_path
                    });
                  }}
                >
                  <Text style={[styles.epText, (episode === epNum && activeSeason === initialSeason) && { color: '#00e156' }]}>
                    Episódio {epNum}
                  </Text>
                  <Ionicons name="play-circle" size={20} color={episode === epNum && activeSeason === initialSeason ? "#00e170" : "#444"} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { color: '#FFF', marginTop: 15, fontWeight: 'bold' },
  topControls: { position: 'absolute', top: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 5 },
  iconCircle: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 30 },
  epBtn: { backgroundColor: 'rgba(209, 13, 248, 0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f0f5f0' },
  btnText: { color: '#FFF', marginRight: 8, fontWeight: 'bold' },
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.85)' },
  closeArea: { flex: 1 },
  menuContent: { width: 300, backgroundColor: '#0F0F0F', padding: 25, borderLeftWidth: 2, borderLeftColor: '#D10DF8' },
  menuTitle: { color: '#f1f2f7', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1.5 },
  seasonTab: { paddingHorizontal: 18, height: 40, backgroundColor: '#161616', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  seasonActive: { backgroundColor: '#D10DF8', borderColor: '#FFF' },
  seasonText: { color: '#888', fontWeight: 'bold' },
  epCard: { padding: 16, backgroundColor: '#161616', marginBottom: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  epActive: { backgroundColor: '#001a24', borderWidth: 1, borderColor: '#00e156' },
  epText: { color: '#EEE', fontSize: 14 },
});
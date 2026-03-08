import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, FlatList, Image, 
  TouchableOpacity, StyleSheet, Dimensions, Platform, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Anime } from '../types/tmdb';
import tmdb from '../api/tmdb';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Lógica de detecção e escala - ESTILO PRIME VIDEO
const isTV = width > 1000 || Platform.isTV;
const s = (size: number) => (isTV ? size * 1.2 : size);
const numColumns = isTV ? 6 : 3;
const columnWidth = (width - (isTV ? 100 : 40)) / numColumns;

// COMPONENTE DE CARD COM FOCO (HOVER)
const SearchCard = ({ item, navigation }: any) => {
  const [focused, setFocused] = useState(false);

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => navigation.navigate('Details', { animeId: item.id })}
      style={[
        styles.card, 
        { width: columnWidth - 10 },
        focused && styles.cardFocused
      ]}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} 
        style={[styles.poster, { height: (columnWidth - 10) * 1.5 }]}
      />
      {focused && (
        <View style={styles.focusOverlay}>
          <Text numberOfLines={1} style={styles.focusTitle}>{item.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Search'>>();

  useEffect(() => {
    if (query.trim().length === 0) {
        setResults([]);
        setLoading(false);
        return;
    }
    setLoading(true);

    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (text: string) => {
    try {
      const response = await tmdb.get('/search/tv', {
        params: { query: text, include_adult: false, language: 'pt-BR' }
      });
      
      const filtered = response.data.results.filter((item: any) => 
        (item.origin_country?.includes('JP') || item.original_language === 'ja') && item.poster_path
      );
      setResults(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* BARRA DE BUSCA OTIMIZADA PARA TV */}
      <View style={[styles.searchSection, { marginTop: isTV ? 10 : 0 }]}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={s(20)} color="#A020F0" style={styles.searchIcon} />
          
          <TextInput
            style={[styles.input, { fontSize: s(16) }]}
            placeholder="Procurar anime..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={(text) => {
                setQuery(text);
                if(text.length > 0) setLoading(true);
            }}
            autoFocus
            returnKeyType="search"
          />

          {query.length > 0 && (
            <TouchableOpacity 
                onPress={() => { setQuery(''); setResults([]); setLoading(false); }} 
                style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={s(22)} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A020F0" />
        </View>
      ) : (
        <FlatList
          data={results}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SearchCard item={item} navigation={navigation} />
          )}
          ListEmptyComponent={
            query.length >= 2 ? (
                <Text style={styles.emptyText}>Nenhum anime encontrado.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: isTV ? 30 : 10 },
  center: { marginTop: 50, alignItems: 'center' },
  searchSection: { marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: 15,
    height: 60
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF' },
  clearButton: { padding: 5 },
  listContainer: { paddingBottom: 100 },
  card: { 
    margin: 5, 
    borderRadius: 8, 
    backgroundColor: '#1a1a1a', 
    borderWidth: 2, 
    borderColor: 'transparent',
    overflow: 'visible' // Para o scale funcionar
  },
  cardFocused: { 
    borderColor: '#FFF', // Borda branca estilo Prime
    transform: [{ scale: 1.1 }], 
    zIndex: 99,
    elevation: 15,
    shadowColor: '#A020F0',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  poster: { width: '100%', borderRadius: 6 },
  focusOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(160, 32, 240, 0.9)',
    padding: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6
  },
  focusTitle: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 }
});
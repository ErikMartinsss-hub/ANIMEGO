import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/api/firebase';
import { Dimensions, Platform, View, StyleSheet } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

// Telas
import Home from './src/screens/Home';
import Details from './src/screens/Details';
import Player from './src/screens/Player';
import Search from './src/screens/Search';
import Favorites from './src/screens/Favorites';
import Profile from './src/screens/Profile'; 
import Login from './src/screens/Login';    
import SignUp from './src/screens/SignUp';   
import Historico from './src/screens/Historico'; // <-- Importante para o BitSoul

const Stack = createStackNavigator<any>();
const Tab = createBottomTabNavigator();

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#A020F0',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: isTV ? { marginHorizontal: 25 } : {},
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;
          if (route.name === 'Início') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Procurar') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favoritos') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={isTV ? (focused ? 38 : 30) : size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Início" component={Home} />
      <Tab.Screen name="Procurar" component={Search} />
      <Tab.Screen name="Favoritos" component={Favorites} />
      <Tab.Screen name="Perfil" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function configureOrientation() {
        if (Platform.OS !== 'web') {
            if (isTV) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            } else {
                await ScreenOrientation.unlockAsync();
            }
        }
    }
    configureOrientation();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return <View style={styles.loadingContainer} />;

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: '#A020F0',
          headerTitleStyle: styles.headerTitle,
          headerTitleAlign: 'center',
          cardStyle: { backgroundColor: '#0A0A0A' },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'CRIAR CONTA' }} />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{ 
                headerShown: !isTV, 
                title: 'ANIME GO' 
              }} 
            />
            <Stack.Screen 
              name="Details" 
              component={Details} 
              options={{ title: '', headerTransparent: true }} 
            />
            <Stack.Screen 
              name="Player" 
              component={Player} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Historico" 
              component={Historico} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// OS ESTILOS QUE VOCÊ PEDIU ESTÃO AQUI:
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    backgroundColor: '#0A0A0A'
  },
  header: { 
    backgroundColor: '#0A0A0A', 
    borderBottomWidth: 1, 
    borderBottomColor: '#1A1A1A',
    height: isTV ? 110 : undefined 
  },
  headerTitle: { 
    fontWeight: '900', 
    fontSize: isTV ? 32 : 18, 
    letterSpacing: 2,
    textShadowColor: 'rgba(160, 32, 240, 0.6)', 
    textShadowRadius: 15 
  },
  tabBar: {
    backgroundColor: '#0A0A0A',
    borderTopColor: '#1A1A1A',
    height: isTV ? 80 : 65, 
    paddingBottom: isTV ? 12 : 8,
    paddingTop: isTV ? 10 : 0,
    borderTopWidth: isTV ? 2 : 1,
    elevation: 10,
  },
  tabBarLabel: { 
    fontWeight: 'bold', 
    fontSize: isTV ? 14 : 12,
    marginBottom: isTV ? 5 : 0
  }
});
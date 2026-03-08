import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../api/firebase';

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;

// Função de escala para aumentar elementos na TV
const s = (size: number) => (isTV ? size * 1.4 : size);

export default function SignUp({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Controle de foco para navegação via controle remoto
  const [focusField, setFocusField] = useState<string | null>(null);

  const handleSignUp = () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        Alert.alert("Sucesso!", "Sua conta foi criada. Agora faça login.");
        navigation.navigate('Login');
      })
      .catch((error) => {
        let message = "Erro ao criar conta.";
        if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
        if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
        Alert.alert("Erro", message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.logo}>CRIAR <Text style={{color: '#A020F0'}}>CONTA</Text></Text>
        
        <TextInput 
          placeholder="E-mail" 
          placeholderTextColor="#666" 
          style={[
            styles.input,
            focusField === 'email' && styles.inputFocused
          ]} 
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail} 
          onFocus={() => setFocusField('email')}
          onBlur={() => setFocusField(null)}
        />
        
        <TextInput 
          placeholder="Senha (mínimo 6 caracteres)" 
          placeholderTextColor="#666" 
          secureTextEntry 
          style={[
            styles.input,
            focusField === 'password' && styles.inputFocused
          ]} 
          onChangeText={setPassword} 
          onFocus={() => setFocusField('password')}
          onBlur={() => setFocusField(null)}
        />

        <TouchableOpacity 
          style={[
            styles.button,
            focusField === 'signUpBtn' && styles.buttonFocused
          ]} 
          onPress={handleSignUp} 
          onFocus={() => setFocusField('signUpBtn')}
          onBlur={() => setFocusField(null)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>CADASTRAR</Text>
          )}
        </TouchableOpacity>

        {/* REAJUSTADO: View com zIndex para a sombra do link "Entrar" não sumir */}
        <View style={{ zIndex: focusField === 'backBtn' ? 10 : 1, marginTop: s(25) }}>
            <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            onFocus={() => setFocusField('backBtn')}
            onBlur={() => setFocusField(null)}
            style={[
                styles.linkContainer,
                focusField === 'backBtn' && styles.linkContainerFocused
            ]}
            >
            <Text style={[
                styles.linkText,
                focusField === 'backBtn' && { color: '#FFF' }
            ]}>
                Já tem uma conta? <Text style={{color: '#A020F0', fontWeight: 'bold'}}>Entrar</Text>
            </Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0A', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 25 
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 450, 
  },
  logo: { 
    color: '#FFF', 
    fontSize: s(32), 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: s(50) 
  },
  input: { 
    backgroundColor: '#151515', 
    color: '#FFF', 
    padding: s(15), 
    borderRadius: 10, 
    marginBottom: s(15), 
    fontSize: s(16),
    borderWidth: 2, 
    borderColor: '#333' 
  },
  inputFocused: {
    borderColor: '#A020F0',
    backgroundColor: '#1A1A1A',
    transform: [{ scale: 1.02 }],
    elevation: 10,
    shadowColor: '#A020F0',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  button: { 
    backgroundColor: '#A020F0', 
    padding: s(15), 
    borderRadius: 10, 
    alignItems: 'center', 
    height: s(55),
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  buttonFocused: {
    borderColor: '#FFF',
    backgroundColor: '#B030FF',
    transform: [{ scale: 1.05 }],
    // --- CORREÇÃO DA SOMBRA NO BOTÃO ---
    elevation: 20,
    shadowColor: '#A020F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: s(16) 
  },
  linkContainer: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  linkContainerFocused: {
    backgroundColor: '#151515',
    borderColor: '#A020F0',
    transform: [{ scale: 1.05 }],
    // --- CORREÇÃO DA SOMBRA NO LINK ---
    elevation: 10,
    shadowColor: '#A020F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  linkText: { 
    color: '#666', 
    textAlign: 'center',
    fontSize: s(14)
  }
});
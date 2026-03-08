import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../api/firebase';

const { width } = Dimensions.get('window');
const isTV = width > 1000 || Platform.isTV;

const s = (size: number) => (isTV ? size * 1.4 : size);

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .catch(error => {
        Alert.alert("Erro", "E-mail ou senha incorretos");
      })
      .finally(() => setLoading(false));
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Atenção", "Digite seu e-mail no campo acima para receber o link de recuperação.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("E-mail Enviado", "Verifique sua caixa de entrada para redefinir sua senha.");
      })
      .catch(error => {
        Alert.alert("Erro", "Não foi possível enviar o e-mail.");
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.logo}>ANIME<Text style={{color: '#A020F0'}}>GO</Text></Text>
        
        <TextInput 
          placeholder="E-mail" 
          placeholderTextColor="#666" 
          style={[
            styles.input, 
            focusField === 'email' && styles.inputFocused
          ]} 
          onChangeText={setEmail} 
          onFocus={() => setFocusField('email')}
          onBlur={() => setFocusField(null)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput 
          placeholder="Senha" 
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

        {/* REAJUSTADO: View em volta para permitir a sombra aparecer */}
        <View style={{zIndex: focusField === 'forgot' ? 10 : 1}}>
          <TouchableOpacity 
            onPress={handleForgotPassword} 
            onFocus={() => setFocusField('forgot')}
            onBlur={() => setFocusField(null)}
            style={[
              styles.forgotPassContainer,
              focusField === 'forgot' && styles.textActionFocused // Adicionado brilho
            ]}
          >
            <Text style={[
              styles.forgotPassText, 
              focusField === 'forgot' && { color: '#FFF' }
            ]}>
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            focusField === 'loginBtn' && styles.buttonFocused
          ]} 
          onPress={handleLogin} 
          onFocus={() => setFocusField('loginBtn')}
          onBlur={() => setFocusField(null)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        {/* REAJUSTADO: View em volta para permitir a sombra aparecer */}
        <View style={{zIndex: focusField === 'signup' ? 10 : 1}}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('SignUp')}
            onFocus={() => setFocusField('signup')}
            onBlur={() => setFocusField(null)}
            style={[
               styles.signUpBtn,
               focusField === 'signup' && styles.textActionFocused
            ]}
          >
            <Text style={[
              styles.linkText,
              focusField === 'signup' && { color: '#FFF' }
            ]}>
              Não tem conta? <Text style={{color: '#A020F0', fontWeight: 'bold'}}>Cadastre-se</Text>
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
    fontSize: s(40), 
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
  forgotPassContainer: { 
    alignSelf: 'flex-end', 
    marginBottom: s(20), 
    padding: 8, // Aumentado para a sombra não cortar
    borderRadius: 5,
  },
  forgotPassText: { 
    color: '#A020F0', 
    fontSize: s(13), 
    fontWeight: '500' 
  },
  button: { 
    backgroundColor: '#A020F0', 
    padding: s(15), 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10, 
    height: s(55), 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  buttonFocused: {
    borderColor: '#FFF',
    transform: [{ scale: 1.05 }],
    backgroundColor: '#B030FF',
    // --- CORREÇÃO DA SOMBRA ---
    elevation: 20,
    shadowColor: '#A020F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: s(16) 
  },
  signUpBtn: {
    marginTop: s(20),
    padding: 10,
    borderRadius: 10,
  },
  textActionFocused: {
    backgroundColor: '#151515',
    transform: [{ scale: 1.05 }],
    // --- CORREÇÃO DA SOMBRA PARA TEXTOS CLICÁVEIS ---
    elevation: 10,
    shadowColor: '#A020F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    borderColor: '#A020F0',
    borderWidth: 1,
  },
  linkText: { 
    color: '#666', 
    textAlign: 'center', 
    fontSize: s(14)
  }
});
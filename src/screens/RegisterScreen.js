import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../store/slices/authSlice';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleRegister = () => {
    if (!email || !password || !password2) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }
    if (password !== password2) {
      Alert.alert('Ошибка', 'Пароли не совпадают.');
      return;
    }
    dispatch(registerUser({ email, password }));
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка регистрации', error);
      dispatch(clearAuthError());
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {/* Логотип */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* Заголовок */}
      <Text style={styles.title}>Register</Text>

      {/* Email */}
      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Enter your email or phone number"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Пароль */}
      <View style={styles.inputUnderlineContainer}>
        <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Подтверждение пароля */}
      <View style={styles.inputUnderlineContainer}>
        <MaterialCommunityIcons name="lock-check-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Confirm your password"
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry={!showPassword}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Кнопка регистрации */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.registerButtonText}>REGISTER</Text>
        )}
      </TouchableOpacity>

      {/* Вход */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Have account already?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>

      {/* Social SignUp */}
      <Text style={styles.signUpUsing}>Or Sign Up Using</Text>
      <View style={styles.socialIcons}>
        <FontAwesome name="facebook" size={32} color="#1877F2" />
        <FontAwesome name="google" size={32} color="#DB4437" />
      </View>

      {/* Privacy Notice */}
      <Text style={styles.privacyText}>
        By registering, you agree to our{' '}
        <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
        <Text style={styles.linkText}>Terms of Use</Text>.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  logo: {
    width: 40,
    height: 40,
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputUnderlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 10,
  },
  inputUnderline: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  registerButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#555',
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  signUpUsing: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 25,
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#777',
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#007AFF',
  },
});

export default RegisterScreen;

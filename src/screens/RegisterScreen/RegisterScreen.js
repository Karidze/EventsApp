import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  // StyleSheet removed from here
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

import styles from './RegisterScreenStyles';

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
  }, [error, dispatch]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Register</Text>

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

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.registerButtonText}>REGISTER</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Have account already?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.signUpUsing}>Or Sign Up Using</Text>
      <View style={styles.socialIcons}>
        <FontAwesome name="facebook" size={32} color="#1877F2" />
        <FontAwesome name="google" size={32} color="#DB4437" />
      </View>

      <Text style={styles.privacyText}>
        By registering, you agree to our{' '}
        <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
        <Text style={styles.linkText}>Terms of Use</Text>.
      </Text>
    </View>
  );
};

export default RegisterScreen;
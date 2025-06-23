import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

import styles from './LoginScreenStyles';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your Email and Password');
      return;
    }
    dispatch(loginUser({ email, password }));
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Login error', error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Login</Text>

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Type your username or email"
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
          placeholder="Type your password"
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

      <TouchableOpacity onPress={() => {}} style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginText}>LOGIN</Text>
        )}
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.signUpUsing}>Or Sign Up Using</Text>
      <View style={styles.socialIcons}>
        <FontAwesome name="facebook" size={32} color="#1877F2" />
        <FontAwesome name="google" size={32} color="#DB4437" />
        <Ionicons name="call-outline" size={32} color="#1E90FF" />
      </View>
    </View>
  );
};

export default LoginScreen;
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
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

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
  }, [error]);

  return (
    <View style={styles.container}>
      {/* Логотип */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* заголовок */}
      <Text style={styles.title}>Login</Text>

      {/* email */}
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

      {/* Пароль */}
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

      {/* Forgot password */}
      <TouchableOpacity onPress={() => {}} style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Login button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginText}>LOGIN</Text>
        )}
      </TouchableOpacity>

      {/* Register */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>

      {/* Sign up using */}
      <Text style={styles.signUpUsing}>Or Sign Up Using</Text>
      <View style={styles.socialIcons}>
        <FontAwesome name="facebook" size={32} color="#1877F2" />
        <FontAwesome name="google" size={32} color="#DB4437" />
        <Ionicons name="call-outline" size={32} color="#1E90FF" />
      </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
  },
  loginText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: '#555',
  },
  registerLink: {
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
    justifyContent: 'space-evenly',
    padding: 15,
    paddingHorizontal: 30,
  },
});

export default LoginScreen;

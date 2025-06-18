import React, { useState, useEffect } from 'react'; 
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, введите Email и Пароль.');
      return;
    }
    dispatch(loginUser({ email, password }));
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка входа', error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={isLoading ? 'Загрузка...' : 'Войти'}
        onPress={handleLogin}
        disabled={isLoading}
      />
      {isLoading && <ActivityIndicator style={styles.spinner} size="small" color="#0000ff" />}
      <Button
        title="Нет аккаунта? Зарегистрироваться"
        onPress={() => navigation.navigate('Register')}
        color="gray"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  spinner: {
    marginTop: 10,
  },
});

export default LoginScreen;
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const profile = useSelector(state => state.profile.profile);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль Пользователя</Text>
      {profile ? (
        <>
          <Text style={styles.subtitle}>Имя пользователя: {profile?.username || 'Не указано'}</Text>
          <Text style={styles.subtitle}>Email: {profile?.email}</Text>
          <Text style={styles.subtitle}>Возраст: {profile?.age || 'Не указан'}</Text>
          <Text style={styles.subtitle}>Интересы: {profile?.interests || 'Не указаны'}</Text>
        </>
      ) : user ? (
        <Text style={styles.subtitle}>Привет, {user?.email || 'Пользователь'}! (Профиль не найден)</Text>
      ) : (
        <Text style={styles.subtitle}>Пожалуйста, войдите или зарегистрируйтесь.</Text>
      )}
      <Button title="Выйти" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e0f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#00796b',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 5,
    color: '#4db6ac',
    textAlign: 'center',
  },
});

export default ProfileScreen;
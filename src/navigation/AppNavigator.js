import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import AuthNavigator from './AuthStack';
import TabNavigator from './TabNavigator';
import CommentsScreen from '../screens/CommentsScreen/CommentsScreen';
import EventDetailScreen from '../screens/EventDetailScreen/EventDetailScreen';

import useAuthSession from '../hooks/useAuthSession';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  useAuthSession();

  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}

        <Stack.Screen
          name="Comments"
          component={CommentsScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
          initialParams={{ isModalFromRoot: true }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default AppNavigator;
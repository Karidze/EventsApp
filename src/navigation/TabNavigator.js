import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, Platform, StatusBar } from 'react-native';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import MapScreen from '../screens/MapScreen/MapScreen';
import CreateEventScreen from '../screens/CreateEventScreen/CreateEventScreen';
import BookmarksScreen from '../screens/BookmarksScreen/BookmarksScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';

import EventDetailScreen from '../screens/EventDetailScreen/EventDetailScreen';
import CommentsScreen from '../screens/CommentsScreen/CommentsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} />
      <HomeStack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ presentation: 'modal' }}
      />
    </HomeStack.Navigator>
  );
}

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'CreateEvent') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Bookmarks') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Map' }}
      />
      <Tab.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Create' }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ title: 'Bookmarks' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
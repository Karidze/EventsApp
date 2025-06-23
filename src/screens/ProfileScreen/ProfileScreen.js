import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  clearProfileError,
  clearAvatarUploadError,
} from '../../store/slices/profileSlice';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import styles from './ProfileScreenStyles';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { profile, isLoading, error, uploadingAvatar, avatarUploadError } = useSelector(state => state.profile);

  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    username: '',
    age: '',
    interests: '',
  });

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProfile(user.id));
    }
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (profile) {
      setEditableProfile({
        username: profile.username || '',
        age: profile.age ? String(profile.age) : '',
        interests: profile.interests || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearProfileError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (avatarUploadError) {
      Alert.alert('Avatar Upload Error', avatarUploadError);
      dispatch(clearAvatarUploadError());
    }
  }, [avatarUploadError, dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditableProfile({
        username: profile.username || '',
        age: profile.age ? String(profile.age) : '',
        interests: profile.interests || '',
      });
    }
  };

  const handleSave = () => {
    if (!user?.id) {
      Alert.alert('Error', 'User ID is unavailable.');
      return;
    }

    const updates = {
      username: editableProfile.username,
      age: editableProfile.age ? parseInt(editableProfile.age, 10) : null,
      interests: editableProfile.interests,
    };

    dispatch(updateUserProfile({ userId: user.id, updates }))
      .unwrap()
      .then(() => {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      })
      .catch((err) => {
        console.error('Failed to save profile:', err);
      });
  };

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'To upload an avatar, the app needs access to your media library.',
        [{ text: 'OK' }]
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];

      if (user?.id && selectedImage.uri && selectedImage.type) {
        dispatch(uploadAvatar({
          userId: user.id,
          imageUri: selectedImage.uri,
          fileType: selectedImage.type,
        }))
          .unwrap()
          .then(() => {
            Alert.alert('Success', 'Avatar uploaded successfully!');
          })
          .catch((err) => {
            console.error('Error sending uploadAvatar:', err);
          });
      } else {
        Alert.alert('Error', 'Failed to get data for the selected image.');
      }
    }
  };

  if ((isLoading && !profile) || uploadingAvatar) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {uploadingAvatar ? 'Uploading avatar...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Profile</Text>

      {profile || user ? (
        <>
          <TouchableOpacity onPress={isEditing ? handleChoosePhoto : null} disabled={uploadingAvatar}>
            <Image
              source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/default-avatar.png')}
              style={styles.avatar}
            />
            {isEditing && (
              <View style={styles.editAvatarOverlay}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editAvatarText}>Change</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <>
              <View style={styles.inputUnderlineContainer}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
                <TextInput
                  style={styles.inputUnderline}
                  placeholder="Username"
                  value={editableProfile.username}
                  onChangeText={(text) => setEditableProfile({ ...editableProfile, username: text })}
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.inputUnderlineContainer}>
                <MaterialCommunityIcons name="cake-variant-outline" size={20} color="#999" style={styles.icon} />
                <TextInput
                  style={styles.inputUnderline}
                  placeholder="Age"
                  value={editableProfile.age}
                  onChangeText={(text) => setEditableProfile({ ...editableProfile, age: text.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.inputUnderlineContainer}>
                <Ionicons name="sparkles-outline" size={20} color="#999" style={styles.icon} />
                <TextInput
                  style={[styles.inputUnderline, styles.interestsInput]}
                  placeholder="Interests"
                  value={editableProfile.interests}
                  onChangeText={(text) => setEditableProfile({ ...editableProfile, interests: text })}
                  multiline
                  scrollEnabled={false}
                  textAlignVertical='top'
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading || uploadingAvatar}>
                <Text style={styles.saveButtonText}>SAVE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.profileDetail}>Email: {profile?.email || user?.email || 'N/A'}</Text>
              <Text style={styles.profileDetail}>Username: {profile?.username || 'N/A'}</Text>
              <Text style={styles.profileDetail}>Age: {profile?.age || 'N/A'}</Text>
              <Text style={styles.profileDetail}>Interests: {profile?.interests || 'N/A'}</Text>

              <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                <Text style={styles.editButtonText}>EDIT PROFILE</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        <Text style={styles.loginText}>Please log in or register.</Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
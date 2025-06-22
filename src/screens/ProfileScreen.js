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
  ScrollView, // Добавляем ScrollView
  Platform, // Для textAlignVertical
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  clearProfileError,
  clearAvatarUploadError,
} from '../store/slices/profileSlice';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
              source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../assets/default-avatar.png')}
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
                  // scrollEnabled={false} удалено, так как это однострочное поле
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
                  // scrollEnabled={false} удалено, так как это однострочное поле
                />
              </View>

              <View style={styles.inputUnderlineContainer}>
                <Ionicons name="sparkles-outline" size={20} color="#999" style={styles.icon} />
                <TextInput
                  style={[styles.inputUnderline, styles.interestsInput]} // Применяем отдельный стиль для Interests
                  placeholder="Interests"
                  value={editableProfile.interests}
                  onChangeText={(text) => setEditableProfile({ ...editableProfile, interests: text })}
                  multiline
                  scrollEnabled={false} // Отключаем внутренний скролл для многострочного поля
                  textAlignVertical='top' // Для корректного выравнивания на Android
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollViewContent: {
    paddingHorizontal: 30,
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 40, // Добавьте отступ снизу, если содержимое может выходить за экран
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
    color: '#333',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F0E6FF',
    backgroundColor: '#ccc',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 5,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputUnderlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    paddingVertical: 6,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  inputUnderline: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 40, // Гарантируем минимальную высоту
    paddingVertical: 0, // Убираем внутренний вертикальный паддинг
  },
  interestsInput: { // Новый стиль для поля "Interests"
    minHeight: 100, // Увеличиваем высоту для многострочного поля
    textAlignVertical: 'top', // Выравнивание текста сверху
  },
  saveButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    borderColor: '#F0E6FF',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#F0E6FF',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  editButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30, // Увеличил отступ, чтобы кнопка logout не прилипала к другим элементам
    marginBottom: 40, // Добавил отступ снизу для ScrollView
    width: '100%',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileDetail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  loginText: {
    fontSize: 16,
    color: '#555',
    marginTop: 20,
  },
});

export default ProfileScreen;
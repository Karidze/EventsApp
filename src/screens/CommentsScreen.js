import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Keyboard,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../config/supabase';

const CommentsScreen = ({ route, navigation }) => {
  const { eventId, eventTitle } = route.params || {};

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [likedCommentIds, setLikedCommentIds] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);

  const flatListRef = useRef(null);
  const textInputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!eventId) {
      return;
    }
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        likes_count,
        parent_comment_id,
        profiles!comments_user_id_fkey(username, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments.');
    } else {
      setComments(data);
    }
  }, [eventId]);

  const fetchUserLikes = useCallback(async (userId) => {
    if (!userId) {
      setLikedCommentIds(new Set());
      return;
    }

    const { data, error } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user likes:', error);
    } else if (data) {
      setLikedCommentIds(new Set(data.map((like) => like.comment_id)));
    }
  }, []);

  useEffect(() => {
    const setup = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      if (sessionError) {
        console.error('Error fetching user session:', sessionError);
      }

      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: `user_${userId.substring(0, 8)}`,
            });

          if (insertError) {
            console.error('Error creating new profile:', insertError);
            Alert.alert('Profile Creation Error', 'Failed to create user profile. Please try again.');
            setCurrentUserId(null);
            return;
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          Alert.alert('Profile Error', 'Failed to load user profile.');
          setCurrentUserId(null);
          return;
        }
      }

      await fetchComments();
      if (userId) {
        await fetchUserLikes(userId);
      } else {
        setLikedCommentIds(new Set());
      }

      let commentsSubscription;
      if (eventId) {
        commentsSubscription = supabase
          .channel(`event_comments_${eventId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'comments', filter: `event_id=eq.${eventId}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const { data: newCommentData, error: fetchError } = await supabase
                  .from('comments')
                  .select(
                    `
                    id, content, created_at, likes_count, parent_comment_id,
                    profiles!comments_user_id_fkey(username, avatar_url)
                    `
                  )
                  .eq('id', payload.new.id)
                  .single();

                if (fetchError) {
                  console.error('Error fetching new comment data for Realtime:', fetchError);
                } else if (newCommentData) {
                  setComments((prevComments) => {
                    if (prevComments.some((c) => c.id === newCommentData.id)) {
                      return prevComments;
                    }
                    return [newCommentData, ...prevComments];
                  });
                  if (flatListRef.current) {
                    setTimeout(() => flatListRef.current.scrollToOffset({ offset: 0, animated: true }), 100);
                  }
                }
              } else if (payload.eventType === 'UPDATE') {
                setComments((prevComments) =>
                  prevComments.map((comment) =>
                    comment.id === payload.new.id
                      ? { ...comment, likes_count: payload.new.likes_count, content: payload.new.content }
                      : comment
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setComments((prevComments) => prevComments.filter((comment) => comment.id !== payload.old.id));
              }
            }
          )
          .subscribe();
      }

      let likesSubscription;
      if (userId) {
        likesSubscription = supabase
          .channel(`user_comment_likes_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'comment_likes', filter: `user_id=eq.${userId}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setLikedCommentIds((prev) => new Set(prev).add(payload.new.comment_id));
              } else if (payload.eventType === 'DELETE') {
                setLikedCommentIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(payload.old.comment_id);
                  return newSet;
                });
              }
            }
          )
          .subscribe();
      }

      return () => {
        if (commentsSubscription) {
          supabase.removeChannel(commentsSubscription);
        }
        if (likesSubscription) {
          supabase.removeChannel(likesSubscription);
        }
      };
    };

    if (eventId) {
      setup();
    }
  }, [eventId, fetchComments, fetchUserLikes]);

  const handleAddComment = async () => {
    if (!newCommentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
      return;
    }

    if (!currentUserId) {
      Alert.alert('Authentication Error', 'You must be logged in to comment.');
      return;
    }

    if (!eventId) {
      Alert.alert('Error', 'Cannot add comment: Event ID is missing.');
      return;
    }

    const parentCommentId = replyTo ? replyTo.id : null;

    const { error } = await supabase.from('comments').insert({
      event_id: eventId,
      user_id: currentUserId,
      content: newCommentText.trim(),
      parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment.');
    } else {
      setNewCommentText('');
      setReplyTo(null);
      Keyboard.dismiss();
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUserId) {
      Alert.alert('Authentication Error', 'You must be logged in to like comments.');
      return;
    }

    const isLiked = likedCommentIds.has(commentId);

    if (isLiked) {
      setLikedCommentIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, likes_count: Math.max(0, (comment.likes_count || 0) - 1) } : comment
        )
      );

      const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId);

      if (error) {
        console.error('Error unliking comment:', error);
        Alert.alert('Error', 'Failed to unlike comment.');
        setLikedCommentIds((prev) => new Set(prev).add(commentId));
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId ? { ...comment, likes_count: (comment.likes_count || 0) + 1 } : comment
          )
        );
      }
    } else {
      setLikedCommentIds((prev) => new Set(prev).add(commentId));
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, likes_count: (comment.likes_count || 0) + 1 } : comment
        )
      );

      const { error } = await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: currentUserId,
      });

      if (error) {
        if (error.code !== '23505') {
          console.error('Error liking comment:', error);
          Alert.alert('Error', 'Failed to like comment: ' + error.message);
          setLikedCommentIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === commentId ? { ...comment, likes_count: Math.max(0, (comment.likes_count || 0) - 1) } : comment
            )
          );
        }
      }
    }
  };

  const handleReplyToComment = (comment) => {
    setReplyTo(comment);
    setNewCommentText(`@${comment.profiles?.username || 'user'} `);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const renderCommentItem = ({ item }) => {
    const isLikedByUser = likedCommentIds.has(item.id);
    const userAvatar = item.profiles?.avatar_url ? { uri: item.profiles.avatar_url } : null;
    const repliedToComment = comments.find((c) => c.id === item.parent_comment_id);

    return (
      <View style={commentsStyles.commentItem}>
        <View style={commentsStyles.commentHeader}>
          {userAvatar ? (
            <Image source={userAvatar} style={commentsStyles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={30} color="#888" style={commentsStyles.avatarPlaceholder} />
          )}
          <Text style={commentsStyles.commentAuthor}>{item.profiles?.username || 'Unknown User'}</Text>
        </View>

        {repliedToComment && (
          <Text style={commentsStyles.replyingToCommentPrefix}>
            Replying to @{repliedToComment.profiles?.username || 'user'}:
          </Text>
        )}

        <Text style={commentsStyles.commentContent}>{item.content}</Text>
        <View style={commentsStyles.commentActions}>
          <TouchableOpacity style={commentsStyles.actionButton} onPress={() => handleReplyToComment(item)}>
            <Text style={commentsStyles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={commentsStyles.actionButton} onPress={() => handleLikeComment(item.id)}>
            <Ionicons name={isLikedByUser ? 'heart' : 'heart-outline'} size={18} color={isLikedByUser ? 'red' : '#888'} />
            <Text style={commentsStyles.likesCount}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={commentsStyles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={commentsStyles.safeAreaContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
        <View style={commentsStyles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commentsStyles.backButton}>
            <Ionicons name="arrow-back" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={commentsStyles.title} numberOfLines={1} ellipsizeMode="tail">
            Comments for "{eventTitle}"
          </Text>
          {/* Удаляем кнопку закрытия, так как теперь есть кнопка назад */}
        </View>

        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id.toString()}
          style={commentsStyles.commentsList}
          contentContainerStyle={commentsStyles.commentsListContent}
          inverted
          keyboardShouldPersistTaps="handled"
        />

        {replyTo && (
          <View style={commentsStyles.replyingToContainer}>
            <Text style={commentsStyles.replyingToText}>Replying to: @{replyTo.profiles?.username || 'user'}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        <View style={commentsStyles.commentInputContainer}>
          <TextInput
            ref={textInputRef}
            style={commentsStyles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#888"
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity onPress={handleAddComment} style={commentsStyles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const commentsStyles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Выравниваем элементы по центру по вертикали
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFF8F0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  backButton: {
    paddingRight: 10, // Отступ справа от стрелки
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1, // Позволяет заголовку занимать оставшееся пространство
    color: '#333',
    marginLeft: 5, // Небольшой отступ от кнопки назад
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 10,
  },
  commentItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    marginRight: 10,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
  },
  replyingToCommentPrefix: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
    marginLeft: 40,
  },
  commentContent: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    marginLeft: 40,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  likesCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  replyingToText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentsScreen;
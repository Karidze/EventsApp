import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Keyboard,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './CommentsScreenStyles';

const CommentsScreen = ({ route, navigation }) => {
  const { eventId, eventTitle, isModalFromRoot = false } = route.params || {};

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [likedCommentIds, setLikedCommentIds] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);

  const flatListRef = useRef(null);
  const textInputRef = useRef(null);

  const insets = useSafeAreaInsets();

  const fetchComments = useCallback(async () => {
    if (!eventId) {
      return;
    }
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        content,
        created_at,
        likes_count,
        parent_comment_id,
        profiles!comments_user_id_fkey(username, avatar_url)
        `
      )
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
      <View style={styles.commentItem}>
        <View style={styles.commentHeader}>
          {userAvatar ? (
            <Image source={userAvatar} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={30} color="#888" style={styles.avatarPlaceholder} />
          )}
          <Text style={styles.commentAuthor}>{item.profiles?.username || 'Unknown User'}</Text>
        </View>

        {repliedToComment && (
          <Text style={styles.replyingToCommentPrefix}>
            Replying to @{repliedToComment.profiles?.username || 'user'}:
          </Text>
        )}

        <Text style={styles.commentContent}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleReplyToComment(item)}>
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLikeComment(item.id)}>
            <Ionicons name={isLikedByUser ? 'heart' : 'heart-outline'} size={18} color={isLikedByUser ? 'red' : '#888'} />
            <Text style={styles.likesCount}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TAB_BAR_HEIGHT_ADJUSTMENT = isModalFromRoot ? 50 : 0;
  const iosBottomPadding = Platform.OS === 'ios' ? insets.bottom : 0;
  const androidBottomPadding = Platform.OS === 'android' ? 10 : 0;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          Comments for "{eventTitle}"
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.commentsList}
        contentContainerStyle={[
          styles.commentsListContent,
          { paddingBottom: TAB_BAR_HEIGHT_ADJUSTMENT + 20 }
        ]}
        inverted
        keyboardShouldPersistTaps="handled"
      />

      {replyTo && (
        <View style={styles.replyingToContainer}>
          <Text style={styles.replyingToText}>Replying to: @{replyTo.profiles?.username || 'user'}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT_ADJUSTMENT : -StatusBar.currentHeight + TAB_BAR_HEIGHT_ADJUSTMENT}
      >
        <View
          style={[
            styles.commentInputContainer,
            { paddingBottom: iosBottomPadding + androidBottomPadding + TAB_BAR_HEIGHT_ADJUSTMENT },
          ]}
        >
          <TextInput
            ref={textInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#888"
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CommentsScreen;
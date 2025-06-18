import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeSession, setSession } from '../store/slices/authSlice';
import { supabase } from '../config/supabase';

const useAuthSession = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeSession());

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        dispatch(setSession(currentSession));
        console.log('Supabase Auth State Changed:', event, currentSession?.user?.id);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [dispatch]);
};

export default useAuthSession;
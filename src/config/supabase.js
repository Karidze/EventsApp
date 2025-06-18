import 'react-native-url-polyfill/auto'; 
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';


const supabaseUrl = 'https://knnzuxhhdsksqesbzkxx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtubnp1eGhoZHNrc3Flc2J6a3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjgzNzAsImV4cCI6MjA2MzE0NDM3MH0.O2xTDz6QG2yuJBB4OTk7dz6XRO6Rty22Q_nA_iMehTA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
import { supabase, isSupabaseConfigured } from './supabase';
import type { StudyData } from '../types';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
}

// Register a new user
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  displayName: string,
  captchaToken?: string
): Promise<{ user: User; token: string }> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured - using offline mode');
  }

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
        avatar: '🎓'
      },
      captchaToken
    }
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Registration failed');

  // Create user profile in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      username,
      email,
      display_name: displayName,
      avatar: '🎓'
    });

  if (profileError && profileError.code !== '23505') {
    console.warn('Profile creation warning:', profileError);
  }

  return {
    user: {
      id: authData.user.id,
      username,
      email,
      displayName,
      avatar: '🎓'
    },
    token: authData.session?.access_token || ''
  };
};

// Login user
export const loginUser = async (
  email: string,
  password: string,
  captchaToken?: string
): Promise<{ user: User; token: string }> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured - using offline mode');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken
    }
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Login failed');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    user: {
      id: data.user.id,
      username: profile?.username || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || '',
      displayName: profile?.display_name || data.user.user_metadata?.display_name || 'Scholar',
      avatar: profile?.avatar || '🎓'
    },
    token: data.session?.access_token || ''
  };
};

// Check current session
export const checkSession = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    id: session.user.id,
    username: profile?.username || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    displayName: profile?.display_name || session.user.user_metadata?.display_name || 'Scholar',
    avatar: profile?.avatar || '🎓'
  };
};

// Logout
export const logoutUser = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
};

// Save study data
export const saveStudyData = async (userId: string, data: StudyData): Promise<void> => {
  if (!isSupabaseConfigured()) {
    localStorage.setItem('studyquest-data', JSON.stringify(data));
    return;
  }

  const { error } = await supabase
    .from('study_data')
    .upsert({
      user_id: userId,
      data: data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.warn('Failed to save to Supabase, saving locally:', error);
    localStorage.setItem('studyquest-data', JSON.stringify(data));
  }
};

// Load study data
export const loadStudyData = async (userId: string): Promise<StudyData | null> => {
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem('studyquest-data');
    return saved ? JSON.parse(saved) : null;
  }

  const { data, error } = await supabase
    .from('study_data')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Fall back to localStorage
    const saved = localStorage.getItem('studyquest-data');
    return saved ? JSON.parse(saved) : null;
  }

  return data.data as StudyData;
};

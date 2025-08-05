import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Welcome back!');
          // Update last seen
          if (session?.user) {
            await supabase
              .from('users')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('🔄 Starting sign up process...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      console.log('📊 Sign up response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ User created successfully');
        toast.success('Account created successfully!');
      }
      
      return { data, error: null };
    } catch (error: unknown) {
      console.error('❌ Sign up catch block:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      toast.error(errorMessage);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Starting sign in process...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Sign in response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
      return { data, error: null };
    } catch (error: unknown) {
      console.error('❌ Sign in catch block:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      toast.error(errorMessage);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign out';
      toast.error(errorMessage);
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
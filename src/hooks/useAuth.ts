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
      
      // Create user profile if it doesn't exist
      if (session?.user) {
        createUserProfile(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Welcome back!');
          // Create user profile and update last seen
          if (session?.user) {
            await createUserProfile(session.user);
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

  const createUserProfile = async (user: User) => {
    try {
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Extract username from metadata or email
        const username = user.user_metadata?.username || 
                        user.email?.split('@')[0] || 
                        'User';
        
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: username,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating user profile:', error);
          // Don't throw error, just log it
        }
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      // Don't throw error, just log it
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        toast.success('Account created successfully!');
      }
      
      return { data, error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };
  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
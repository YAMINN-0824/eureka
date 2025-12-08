'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// 認証情報の型
type AuthContextType = {
  user: User | null;
  userRole: string; // 追加
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Contextを作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Providerコンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user'); // 追加
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 初回のセッション確認
    checkUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // ユーザーがログインしている場合、roleを取得
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole('user'); // ログアウト時はuserにリセット
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ユーザーのroleを取得する関数
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Role取得エラー:', error);
        setUserRole('user'); // エラー時はuserにする
        return;
      }

      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Role取得エラー:', error);
      setUserRole('user');
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // ユーザーが存在する場合、roleを取得
      if (user) {
        await fetchUserRole(user.id);
      }
    } catch (error) {
      console.error('ユーザー確認エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      
      // ログイン時にroleを取得
      if (data.user) {
        await fetchUserRole(data.user.id);
      }
      
      console.log('✅ ログインしました！');
      router.push('/books');
    } catch (error) {
      console.error('❌ ログインエラー:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserRole('user'); // ログアウト時にroleをリセット
      console.log('❌ ログアウトしました！');
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, userRole, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuthフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
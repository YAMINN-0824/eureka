'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// import Header from '../components/Header';

interface Profile {
  username: string;
  bio: string | null;
  avatar_url: string | null;
  age_range: string | null;
  gender: string | null;
  location: string | null;
  reading_level: string;
  favorite_genres: string[] | null;
  favorite_authors: string[] | null;
  reading_goal: number;
  twitter_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booksRead, setBooksRead] = useState(0);
  const [booksReading, setBooksReading] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // ログイン確認
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // プロフィール取得
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);

      // 読んだ本の数を取得
      const { count: readCount } = await supabase
        .from('bookshelves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'read');

      setBooksRead(readCount || 0);

      // 読んでる本の数を取得
      const { count: readingCount } = await supabase
        .from('bookshelves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'reading');

      setBooksReading(readingCount || 0);

    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* <Header /> */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* <Header /> */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">プロフィールが見つかりません</div>
        </div>
      </div>
    );
  }

  // アバターの生成
  const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=2563eb&color=fff&size=200`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* プロフィール画像 */}
            <div className="flex flex-col items-center">
              <img 
                src={avatarUrl}
                alt={profile.username}
                className="w-32 h-32 rounded-full"
              />
            </div>

            {/* 基本情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{profile.username}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  📖 {profile.reading_level}
                </span>
              </div>
              
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}

              {/* 統計 */}
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{booksRead}</div>
                  <div className="text-sm text-gray-600">読んだ本</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{booksReading}</div>
                  <div className="text-sm text-gray-600">読んでる本</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  プロフィール編集
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="md:col-span-1 space-y-6">
            
            {/* 基本情報カード */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">👤 基本情報</h3>
              
              <div className="space-y-3 text-sm">
                {profile.age_range && (
                  <div>
                    <div className="text-gray-500">年齢層</div>
                    <div className="font-medium">{profile.age_range}</div>
                  </div>
                )}
                
                {profile.gender && (
                  <div>
                    <div className="text-gray-500">性別</div>
                    <div className="font-medium">{profile.gender}</div>
                  </div>
                )}
                
                {profile.location && (
                  <div>
                    <div className="text-gray-500">地域</div>
                    <div className="font-medium">{profile.location}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-gray-500">登録日</div>
                  <div className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
            </div>

            {/* ソーシャルリンク */}
            {(profile.twitter_url || profile.instagram_url || profile.facebook_url) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 ソーシャル</h3>
                
                <div className="space-y-3">
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      🐦 Twitter
                    </a>
                  )}
                  
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 hover:underline">
                      📷 Instagram
                    </a>
                  )}
                  
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      📘 Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* 右カラム */}
          <div className="md:col-span-2 space-y-6">
                    
          {/* 好きなジャンル */}
          {profile.favorite_genres && profile.favorite_genres.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📚 好きなジャンル</h3>
              
              <div className="flex flex-wrap gap-2">
                {profile.favorite_genres.map((genre, index) => {
                  // ジャンル名に基づいて色を決定
                  const getColorClassForGenre = (genreName: string) => {
                    const lowerGenre = genreName.toLowerCase();
                    if (lowerGenre.includes('恋愛') || lowerGenre.includes('ロマンス')) 
                      return 'bg-pink-100 text-pink-700';
                    if (lowerGenre.includes('ミステリー') || lowerGenre.includes('推理')) 
                      return 'bg-purple-100 text-purple-700';
                    if (lowerGenre.includes('sf') || lowerGenre.includes('サイエンス')) 
                      return 'bg-blue-100 text-blue-700';
                    if (lowerGenre.includes('ファンタジー') || lowerGenre.includes('冒険')) 
                      return 'bg-green-100 text-green-700';
                    if (lowerGenre.includes('歴史') || lowerGenre.includes('時代')) 
                      return 'bg-orange-100 text-orange-700';
                    if (lowerGenre.includes('ホラー') || lowerGenre.includes('怖い')) 
                      return 'bg-red-100 text-red-700';
                    if (lowerGenre.includes('ビジネス') || lowerGenre.includes('自己啓発')) 
                      return 'bg-yellow-100 text-yellow-700';
                    // デフォルト
                    return 'bg-gray-100 text-gray-700';
                  };
                  
                  return (
                    <span key={index} className={`px-4 py-2 rounded-full ${getColorClassForGenre(genre)}`}>
                      {genre}
                    </span>
                  );
                })}
              </div>
            </div>
          )}


            {/* 好きな著者 */}
            {profile.favorite_authors && profile.favorite_authors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✍️ 好きな著者</h3>
                
                <div className="flex flex-wrap gap-3">
                  {profile.favorite_authors.map((author, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                      {author}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 読書目標 */}
            {profile.reading_goal > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 2025年の読書目標</h3>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">今年の目標：{profile.reading_goal}冊</span>
                    <span className="font-bold text-blue-600">{booksRead} / {profile.reading_goal}冊</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((booksRead / profile.reading_goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {booksRead >= profile.reading_goal 
                    ? '🎉 目標達成！おめでとうございます！'
                    : `💪 あと${profile.reading_goal - booksRead}冊で目標達成です！`
                  }
                </p>
              </div>
            )}

          {/* 読書統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 読書統計</h3>
            
            {profile.favorite_genres && profile.favorite_genres.length > 0 ? (
              <div className="space-y-3">
                {profile.favorite_genres.map((genre, index) => {
                  // 各ジャンルのパーセンテージを計算（仮のデータ）
                  const percentage = Math.max(10, 100 - (index * 15));
                  
                  // ジャンル名に基づいて色を決定
                  const getColorForGenre = (genreName: string) => {
                    const lowerGenre = genreName.toLowerCase();
                    if (lowerGenre.includes('恋愛') || lowerGenre.includes('ロマンス')) return 'bg-pink-500';
                    if (lowerGenre.includes('ミステリー') || lowerGenre.includes('推理')) return 'bg-purple-500';
                    if (lowerGenre.includes('sf') || lowerGenre.includes('サイエンス')) return 'bg-blue-500';
                    if (lowerGenre.includes('ファンタジー') || lowerGenre.includes('冒険')) return 'bg-green-500';
                    if (lowerGenre.includes('歴史') || lowerGenre.includes('時代')) return 'bg-orange-500';
                    if (lowerGenre.includes('ホラー') || lowerGenre.includes('怖い')) return 'bg-red-500';
                    if (lowerGenre.includes('ビジネス') || lowerGenre.includes('自己啓発')) return 'bg-yellow-500';
                    // デフォルト
                    return 'bg-gray-500';
                  };
                  
                  const color = getColorForGenre(genre);
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{genre}</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                
                <p className="text-xs text-gray-400 mt-4">
                  ※ これは仮のデータです。将来的に実際の読書データから統計を表示します。
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">好きなジャンルを設定すると、読書統計が表示されます</p>
            )}
          </div>

          </div>
        </div>

      </div>
    </div>
  );
}
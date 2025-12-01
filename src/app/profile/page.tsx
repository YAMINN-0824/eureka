'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ImageCropModal from '@/app/components/ImageCropModal';

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
  const [userId, setUserId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      
      const url = profileData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username)}&background=A0C878&color=fff&size=200`;
      setAvatarUrl(url);

      const { count: readCount } = await supabase
        .from('bookshelves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'read');

      setBooksRead(readCount || 0);

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

  const handleImageUploaded = (url: string) => {
    setAvatarUrl(url);
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const getGenreColor = (genreName: string) => {
    const lower = genreName.toLowerCase();
    if (lower.includes('恋愛') || lower.includes('ロマンス') || lower.includes('romance')) 
      return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
    if (lower.includes('ミステリー') || lower.includes('推理') || lower.includes('mystery')) 
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    if (lower.includes('sf') || lower.includes('サイエンス') || lower.includes('science')) 
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    if (lower.includes('ファンタジー') || lower.includes('冒険') || lower.includes('fantasy')) 
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (lower.includes('歴史') || lower.includes('時代') || lower.includes('history')) 
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    if (lower.includes('ホラー') || lower.includes('怖い') || lower.includes('horror')) 
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    if (lower.includes('ビジネス') || lower.includes('自己啓発') || lower.includes('business')) 
      return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
    if (lower.includes('青春') || lower.includes('学園') || lower.includes('youth')) 
      return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
    if (lower.includes('コメディ') || lower.includes('comedy')) 
      return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    return 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600">プロフィールが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* プロフィールヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-10 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* プロフィール画像 */}
            <div className="flex-shrink-0">
              <div 
                className="relative w-40 h-40 rounded-full overflow-hidden shadow-2xl cursor-pointer group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setIsModalOpen(true)}
              >
                <img 
                  src={avatarUrl}
                  alt={profile.username}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                
                {/* ホバーオーバーレイ */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovering ? 1 : 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(160, 200, 120, 0.9) 0%, rgba(123, 158, 95, 0.9) 100%)',
                  }}
                >
                  <div className="text-center text-white">
                    <div className="text-4xl mb-1">📷</div>
                    <div className="text-sm font-bold">変更</div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 基本情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-4xl font-bold text-gray-900">{profile.username}</h2>
                <span className="px-4 py-2 rounded-full text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  📖 {profile.reading_level}
                </span>
              </div>
              
              {profile.bio && (
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">{profile.bio}</p>
              )}

              {/* 統計 */}
              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1" style={{ color: '#A0C878' }}>
                    {booksRead}
                  </div>
                  <div className="text-sm text-gray-600">読んだ本</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1" style={{ color: '#A0C878' }}>
                    {booksReading}
                  </div>
                  <div className="text-sm text-gray-600">読んでる本</div>
                </div>
              </div>

              <Link
                href="/profile/edit"
                className="inline-block px-8 py-3 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                ✏️ Edit Profile
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="md:col-span-1 space-y-6">
            
            {/* 基本情報カード */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#7B9E5F' }}>
                👤 Basic Info
              </h3>
              
              <div className="space-y-4 text-sm">
                {profile.age_range && (
                  <div>
                    <div className="text-gray-500 text-xs mb-1">年齢層</div>
                    <div className="font-semibold text-gray-900">{profile.age_range}</div>
                  </div>
                )}
                
                {profile.gender && (
                  <div>
                    <div className="text-gray-500 text-xs mb-1">性別</div>
                    <div className="font-semibold text-gray-900">{profile.gender}</div>
                  </div>
                )}
                
                {profile.location && (
                  <div>
                    <div className="text-gray-500 text-xs mb-1">地域</div>
                    <div className="font-semibold text-gray-900">{profile.location}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-gray-500 text-xs mb-1">登録日</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ソーシャルリンク */}
            {(profile.twitter_url || profile.instagram_url || profile.facebook_url) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B9E5F' }}>
                  🔗 Social Links
                </h3>
                
                <div className="space-y-3">
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition">
                      🐦 Twitter
                    </a>
                  )}
                  
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold transition">
                      📷 Instagram
                    </a>
                  )}
                  
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition">
                      📘 Facebook
                    </a>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* 右カラム */}
          <div className="md:col-span-2 space-y-6">
                    
            {/* 好きなジャンル */}
            {profile.favorite_genres && profile.favorite_genres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B9E5F' }}>
                  📚 Favorite Genres
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {profile.favorite_genres.map((genre, index) => (
                    <span 
                      key={index} 
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{
                        background: getGenreColor(genre)
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 好きな著者 */}
            {profile.favorite_authors && profile.favorite_authors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B9E5F' }}>
                  ✍️ Favorite Authors
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_authors.map((author, index) => (
                    <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">
                      {author}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 読書目標 */}
            {profile.reading_goal > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: '#7B9E5F' }}>
                  🎯 Reading Goal 2025
                </h3>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600 font-medium">今年の目標：{profile.reading_goal}冊</span>
                    <span className="font-bold text-lg" style={{ color: '#A0C878' }}>
                      {booksRead} / {profile.reading_goal}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-4 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((booksRead / profile.reading_goal) * 100, 100)}%`,
                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)'
                      }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm font-semibold" style={{ color: '#7B9E5F' }}>
                  {booksRead >= profile.reading_goal 
                    ? '🎉 目標達成！おめでとうございます！'
                    : `💪 あと${profile.reading_goal - booksRead}冊で目標達成です！`
                  }
                </p>
              </motion.div>
            )}

            {/* 読書統計 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
                📊 Reading Statistics
              </h3>
              
              {profile.favorite_genres && profile.favorite_genres.length > 0 ? (
                <div className="space-y-4">
                  {profile.favorite_genres.map((genre, index) => {
                    const percentage = Math.max(10, 100 - (index * 15));
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700 font-medium">{genre}</span>
                          <span className="font-bold" style={{ color: '#A0C878' }}>{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              background: getGenreColor(genre)
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <p className="text-xs text-gray-400 mt-6">
                    ※ これは仮のデータです。将来的に実際の読書データから統計を表示します。
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">好きなジャンルを設定すると、読書統計が表示されます</p>
              )}
            </motion.div>

          </div>
        </div>

      </div>

      {/* 画像アップロードモーダル */}
      <ImageCropModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageUploaded={handleImageUploaded}
        userId={userId}
      />
    </div>
  );
}
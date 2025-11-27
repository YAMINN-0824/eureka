'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // フォームの状態
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [readingLevel, setReadingLevel] = useState('初心者');
  const [readingGoal, setReadingGoal] = useState(0);
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  
  // ジャンルと著者（複数選択）
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

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

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
      setAgeRange(profileData.age_range || '');
      setGender(profileData.gender || '');
      setLocation(profileData.location || '');
      setReadingLevel(profileData.reading_level || '初心者');
      setReadingGoal(profileData.reading_goal || 0);
      setTwitterUrl(profileData.twitter_url || '');
      setInstagramUrl(profileData.instagram_url || '');
      setFacebookUrl(profileData.facebook_url || '');
      setSelectedGenres(profileData.favorite_genres || []);
      setSelectedAuthors(profileData.favorite_authors || []);

    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          age_range: ageRange || null,
          gender: gender || null,
          location: location || null,
          reading_level: readingLevel,
          reading_goal: readingGoal,
          favorite_genres: selectedGenres.length > 0 ? selectedGenres : null,
          favorite_authors: selectedAuthors.length > 0 ? selectedAuthors : null,
          twitter_url: twitterUrl || null,
          instagram_url: instagramUrl || null,
          facebook_url: facebookUrl || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('保存しました!');
      setTimeout(() => {
        router.push('/profile');
      }, 1000);

    } catch (error: any) {
      console.error('保存エラー:', error);
      toast.error(error.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (newGenre && !selectedGenres.includes(newGenre)) {
      setSelectedGenres([...selectedGenres, newGenre]);
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const addAuthor = () => {
    if (newAuthor && !selectedAuthors.includes(newAuthor)) {
      setSelectedAuthors([...selectedAuthors, newAuthor]);
      setNewAuthor('');
    }
  };

  const removeAuthor = (author: string) => {
    setSelectedAuthors(selectedAuthors.filter(a => a !== author));
  };

  // ジャンル別の色を返す関数
  const getGenreColor = (genreName: string) => {
    const lower = genreName.toLowerCase();
    if (lower.includes('恋愛') || lower.includes('ロマンス') || lower.includes('romance')) 
      return 'bg-pink-100 text-pink-700';
    if (lower.includes('ミステリー') || lower.includes('推理') || lower.includes('mystery')) 
      return 'bg-purple-100 text-purple-700';
    if (lower.includes('sf') || lower.includes('サイエンス') || lower.includes('science')) 
      return 'bg-blue-100 text-blue-700';
    if (lower.includes('ファンタジー') || lower.includes('冒険') || lower.includes('fantasy')) 
      return 'bg-green-100 text-green-700';
    if (lower.includes('歴史') || lower.includes('時代') || lower.includes('history')) 
      return 'bg-orange-100 text-orange-700';
    if (lower.includes('ホラー') || lower.includes('怖い') || lower.includes('horror')) 
      return 'bg-red-100 text-red-700';
    if (lower.includes('ビジネス') || lower.includes('自己啓発') || lower.includes('business')) 
      return 'bg-yellow-100 text-yellow-700';
    if (lower.includes('青春') || lower.includes('学園') || lower.includes('youth')) 
      return 'bg-cyan-100 text-cyan-700';
    if (lower.includes('コメディ') || lower.includes('comedy')) 
      return 'bg-orange-100 text-orange-600';
    return 'bg-emerald-100 text-emerald-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/profile" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition mb-4">
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            ✏️ Edit Profile
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* 基本情報 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
              👤 Basic Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ユーザー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  自己紹介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="自己紹介を書いてください..."
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    年齢層
                  </label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] bg-white transition-colors"
                  >
                    <option value="">選択してください</option>
                    <option value="10代">10代</option>
                    <option value="20代">20代</option>
                    <option value="30代">30代</option>
                    <option value="40代">40代</option>
                    <option value="50代以上">50代以上</option>
                    <option value="答えたくない">答えたくない</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    性別
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] bg-white transition-colors"
                  >
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="答えたくない">答えたくない</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    読書レベル
                  </label>
                  <select
                    value={readingLevel}
                    onChange={(e) => setReadingLevel(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] bg-white transition-colors"
                  >
                    <option value="初心者">初心者</option>
                    <option value="中級者">中級者</option>
                    <option value="上級者">上級者</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  地域
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：大阪府、日本"
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>
            </div>
          </motion.div>

          {/* 読書関連 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
              📚 Reading Preferences
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  年間読書目標（冊数）
                </label>
                <input
                  type="number"
                  value={readingGoal}
                  onChange={(e) => setReadingGoal(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>

              {/* 好きなジャンル */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  好きなジャンル
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="ジャンルを入力..."
                    className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={addGenre}
                    className="px-6 py-3 text-white rounded-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    追加
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGenres.map((genre, index) => (
                    <span
                      key={index}
                      className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${getGenreColor(genre)}`}
                    >
                      {genre}
                      <button
                        type="button"
                        onClick={() => removeGenre(genre)}
                        className="hover:opacity-70 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 好きな著者 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  好きな著者
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="著者名を入力..."
                    className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={addAuthor}
                    className="px-6 py-3 text-white rounded-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    追加
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAuthors.map((author, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 font-medium"
                    >
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(author)}
                        className="hover:opacity-70 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ソーシャルリンク */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
              🔗 Social Links
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🐦 Twitter URL
                </label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📷 Instagram URL
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📘 Facebook URL
                </label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>
            </div>
          </motion.div>

          {/* ボタン */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex-1 px-8 py-4 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              {saving ? '保存中...' : '✓ 保存する'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => router.push('/profile')}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold text-lg transition-all"
            >
              キャンセル
            </motion.button>
          </motion.div>
        </form>

      </div>
    </div>
  );
}
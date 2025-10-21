'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// import Header from '../../components/Header';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

      // フォームに値をセット
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

      console.log('読み込んだジャンル:', profileData.favorite_genres);
      console.log('読み込んだ著者:', profileData.favorite_authors);

    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      setError('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('保存するジャンル:', selectedGenres);
      console.log('保存する著者:', selectedAuthors);

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

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1500);

    } catch (error: any) {
      console.error('保存エラー:', error);
      setError(error.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (newGenre && !selectedGenres.includes(newGenre)) {
      setSelectedGenres([...selectedGenres, newGenre]);
      setNewGenre('');
      console.log('ジャンル追加:', newGenre);
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const addAuthor = () => {
    if (newAuthor && !selectedAuthors.includes(newAuthor)) {
      setSelectedAuthors([...selectedAuthors, newAuthor]);
      setNewAuthor('');
      console.log('著者追加:', newAuthor);
    }
  };

  const removeAuthor = (author: string) => {
    setSelectedAuthors(selectedAuthors.filter(a => a !== author));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">プロフィール編集</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              保存しました！プロフィールページに戻ります...
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 基本情報 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザー名 *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="自己紹介を書いてください..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年齢層
                    </label>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性別
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                      <option value="答えたくない">答えたくない</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      読書レベル
                    </label>
                    <select
                      value={readingLevel}
                      onChange={(e) => setReadingLevel(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="初心者">初心者</option>
                      <option value="中級者">中級者</option>
                      <option value="上級者">上級者</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    地域
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="例：大阪府、日本"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 読書関連 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">読書関連</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年間読書目標（冊数）
                  </label>
                  <input
                    type="number"
                    value={readingGoal}
                    onChange={(e) => setReadingGoal(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 好きなジャンル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    好きなジャンル
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      placeholder="ジャンルを入力..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    />
                    <button
                      type="button"
                      onClick={addGenre}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedGenres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-2"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 好きな著者 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    好きな著者
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="著者名を入力..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                    />
                    <button
                      type="button"
                      onClick={addAuthor}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAuthors.map((author, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
                      >
                        {author}
                        <button
                          type="button"
                          onClick={() => removeAuthor(author)}
                          className="text-gray-700 hover:text-gray-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ソーシャルリンク */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ソーシャルリンク</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter URL
                  </label>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Author {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  author_bio: string | null;
  created_at: string;
  story_count: number;
  follower_count: number;
  latest_story_title: string | null;
  latest_story_date: string | null;
}

type SortOption = 'newest' | 'followers' | 'stories';

export default function AuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      setLoading(true);

      // 全プロフィールを取得
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, bio, author_bio, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // 各著者の統計を取得
      const authorsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // 作品数
          const { count: storyCount } = await supabase
            .from('user_stories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .eq('status', 'published');

          // フォロワー数
          const { count: followerCount } = await supabase
            .from('author_follows')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', profile.user_id);

          // 最新作品
          const { data: latestStory } = await supabase
            .from('user_stories')
            .select('title, created_at')
            .eq('user_id', profile.user_id)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...profile,
            story_count: storyCount || 0,
            follower_count: followerCount || 0,
            latest_story_title: latestStory?.title || null,
            latest_story_date: latestStory?.created_at || null,
          };
        })
      );

      setAuthors(authorsWithStats);
    } catch (error) {
      console.error('Authors fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ソート処理
  const sortedAuthors = [...authors].sort((a, b) => {
    switch (sortBy) {
      case 'followers':
        return b.follower_count - a.follower_count;
      case 'stories':
        return b.story_count - a.story_count;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateBio = (bio: string | null) => {
    if (!bio) return null;
    const lines = bio.split('\n').slice(0, 2);
    const text = lines.join(' ');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition">
              <span>←</span>
              <span>Home</span>
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
              ✍️ Authors
            </h1>
            <div className="w-20"></div> {/* スペーサー */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* ソートオプション */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold">並び順：</span>
            <div className="flex gap-3">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  sortBy === 'newest'
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={
                  sortBy === 'newest'
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                🆕 新しい順
              </button>
              <button
                onClick={() => setSortBy('followers')}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  sortBy === 'followers'
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={
                  sortBy === 'followers'
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                👥 フォロワー数順
              </button>
              <button
                onClick={() => setSortBy('stories')}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  sortBy === 'stories'
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={
                  sortBy === 'stories'
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                📚 作品数順
              </button>
            </div>
          </div>
        </motion.div>

        {/* 著者カード一覧 */}
        {sortedAuthors.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">✍️</div>
            <p className="text-gray-600 text-lg">まだ著者がいません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAuthors.map((author, index) => (
              <motion.div
                key={author.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl border-2 border-gray-100 hover:border-[#A0C878] shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                onClick={() => router.push(`/authors/${author.user_id}`)}
              >
                {/* ヘッダー部分 */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-4 mb-4">
                    {/* アバター */}
                    <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                      {author.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <span className="text-3xl">✍️</span>
                        </div>
                      )}
                    </div>

                    {/* 名前 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate mb-1">
                        {author.username}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-white inline-block"
                        style={{
                          background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                        }}
                      >
                        ✍️ Author
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {truncateBio(author.author_bio || author.bio) && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {truncateBio(author.author_bio || author.bio)}
                    </p>
                  )}
                </div>

                {/* 統計 */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <div className="flex justify-around mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#A0C878' }}>
                        {author.story_count}
                      </div>
                      <div className="text-gray-600 text-xs">Stories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: '#A0C878' }}>
                        {author.follower_count}
                      </div>
                      <div className="text-gray-600 text-xs">Followers</div>
                    </div>
                  </div>

                  {/* 最新作品 */}
                  {author.latest_story_title && (
                    <div className="pt-4 border-t border-emerald-200">
                      <div className="text-xs text-gray-500 mb-1">📖 Latest Story</div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {author.latest_story_title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(author.latest_story_date!)}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Story {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  author_name?: string;
  chapter_count?: number;
}

export default function StoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全て');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'likes'>('latest');

  const genres = [
    '全て', '小説', '恋愛', 'ファンタジー', 'ミステリー', 'SF',
    'ホラー', '歴史', '青春', 'コメディ', 'その他'
  ];

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    filterAndSortStories();
  }, [searchQuery, selectedGenre, sortBy, stories]);

  const loadStories = async () => {
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      const storiesWithDetails = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', story.user_id)
            .single();

          const { count } = await supabase
            .from('story_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return {
            ...story,
            author_name: profileData?.username || '匿名',
            chapter_count: count || 0
          };
        })
      );

      setStories(storiesWithDetails);
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStories = () => {
    let filtered = stories;

    if (selectedGenre !== '全て') {
      filtered = filtered.filter(s => s.genre === selectedGenre);
    }

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title.includes(searchQuery) ||
        s.synopsis.includes(searchQuery) ||
        s.author_name?.includes(searchQuery)
      );
    }

    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => b.view_count - a.view_count);
    } else if (sortBy === 'likes') {
      filtered.sort((a, b) => b.like_count - a.like_count);
    }

    setFilteredStories(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                Discover Stories
              </h1>
              <p className="text-gray-600 text-sm">世界中の物語を探そう</p>
            </div>
            {user && (
              <Link
                href="/write"
                className="px-8 py-3 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg flex items-center gap-2 font-bold"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                <span className="text-xl">✨</span>
                <span>Write</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* 統計カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#A0C878' }}>
              {stories.length}
            </div>
            <div className="text-gray-600 text-sm font-medium">Stories</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="text-3xl mb-2">✍️</div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#A0C878' }}>
              {new Set(stories.map(s => s.user_id)).size}
            </div>
            <div className="text-gray-600 text-sm font-medium">Authors</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="text-3xl mb-2">📖</div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#A0C878' }}>
              {stories.reduce((sum, s) => sum + (s.chapter_count || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm font-medium">Chapters</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="text-3xl mb-2">💖</div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#A0C878' }}>
              {stories.reduce((sum, s) => sum + s.like_count, 0)}
            </div>
            <div className="text-gray-600 text-sm font-medium">Likes</div>
          </div>
        </motion.div>

        {/* 検索・フィルター */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索 */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
              />
            </div>

            {/* ジャンル */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] bg-white transition-colors"
            >
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* ソート */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] bg-white transition-colors"
            >
              <option value="latest">最新順</option>
              <option value="popular">人気順（閲覧数）</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </motion.div>

        {/* 作品一覧 */}
        {filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg p-16 text-center"
          >
            <div className="text-8xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No stories found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedGenre !== '全て'
                ? '検索条件を変更してみてください'
                : 'まだ作品が投稿されていません'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
                onClick={() => router.push(`/story/${story.id}`)}
              >
                {/* カバー画像 */}
                <div className="relative h-56">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-7xl">📖</span>
                    </div>
                  )}
                  
                  {/* ジャンルバッジ */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-bold shadow-md">
                      {story.genre}
                    </span>
                  </div>
                </div>

                {/* 作品情報 */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {story.synopsis}
                  </p>

                  {/* 作者 */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/author/${story.user_id}`);
                    }}
                    className="flex items-center gap-2 mb-3 text-sm hover:text-[#A0C878] transition-colors cursor-pointer"
                    style={{ color: '#7B9E5F' }}
                  >
                    <span>✍️</span>
                    <span className="font-semibold">{story.author_name}</span>
                  </div>

                  {/* 統計 */}
                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span>📖</span>
                        <span className="font-semibold">{story.chapter_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👁️</span>
                        <span className="font-semibold">{story.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>💖</span>
                        <span className="font-semibold">{story.like_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* 公開日 */}
                  <div className="text-xs text-gray-400 mt-2">
                    {formatDate(story.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
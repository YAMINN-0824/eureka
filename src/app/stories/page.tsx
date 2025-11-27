'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
      // 公開作品を取得
      const { data: storiesData, error: storiesError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // 各作品の作者名と章数を取得
      const storiesWithDetails = await Promise.all(
        (storiesData || []).map(async (story) => {
          // 作者名を取得
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', story.user_id)
            .single();

          // 章数を取得
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

    // ジャンルでフィルター
    if (selectedGenre !== '全て') {
      filtered = filtered.filter(s => s.genre === selectedGenre);
    }

    // 検索クエリでフィルター
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title.includes(searchQuery) ||
        s.synopsis.includes(searchQuery) ||
        s.author_name?.includes(searchQuery)
      );
    }

    // ソート
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📝</span>
              <span>作品を探す</span>
            </h1>
            {user && (
              <Link
                href="/write"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
              >
                <span className="text-xl">✨</span>
                <span>作品を書く</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📚</span>
              <span className="text-3xl font-bold text-blue-600">{stories.length}</span>
            </div>
            <div className="text-gray-600 font-medium">公開作品</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">✍️</span>
              <span className="text-3xl font-bold text-green-600">
                {new Set(stories.map(s => s.user_id)).size}
              </span>
            </div>
            <div className="text-gray-600 font-medium">作家</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">👁️</span>
              <span className="text-3xl font-bold text-purple-600">
                {stories.reduce((sum, s) => sum + s.view_count, 0)}
              </span>
            </div>
            <div className="text-gray-600 font-medium">総閲覧数</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">💖</span>
              <span className="text-3xl font-bold text-pink-600">
                {stories.reduce((sum, s) => sum + s.like_count, 0)}
              </span>
            </div>
            <div className="text-gray-600 font-medium">総いいね</div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索 */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="作品を検索..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* ジャンル */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* ソート */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="latest">最新順</option>
              <option value="popular">人気順（閲覧数）</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </div>

        {/* 作品一覧 */}
        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">作品が見つかりません</h3>
            <p className="text-gray-600">
              {searchQuery || selectedGenre !== '全て'
                ? '検索条件を変更してみてください'
                : 'まだ作品が投稿されていません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/story/${story.id}`)}
              >
                {/* カバー画像 */}
                <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl">📖</span>
                    </div>
                  )}
                  
                  {/* ジャンルバッジ */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-white bg-opacity-90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-bold shadow-lg">
                      {story.genre}
                    </span>
                  </div>
                </div>

                {/* 作品情報 */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {story.synopsis}
                  </p>

                  {/* 作者 - クリックイベントで処理 */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // 親のクリックイベントを止める
                      router.push(`/author/${story.user_id}`);
                    }}
                    className="flex items-center gap-2 mb-3 text-sm text-gray-500 hover:text-blue-600 transition cursor-pointer"
                  >
                    <span>✍️</span>
                    <span className="font-medium">{story.author_name}</span>
                  </div>

                  {/* 統計 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span>📖</span>
                        <span className="font-medium">{story.chapter_count}章</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👁️</span>
                        <span className="font-medium">{story.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>💖</span>
                        <span className="font-medium">{story.like_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* 公開日 */}
                  <div className="text-xs text-gray-400 mt-3">
                    {formatDate(story.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
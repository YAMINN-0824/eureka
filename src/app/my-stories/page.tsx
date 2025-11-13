'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  chapter_count?: number;
}

export default function MyStoriesPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadStories();
  }, [isLoggedIn]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 各作品の章数を取得
      const storiesWithChapters = await Promise.all(
        (data || []).map(async (story) => {
          const { count } = await supabase
            .from('story_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return { ...story, chapter_count: count || 0 };
        })
      );

      setStories(storiesWithChapters);
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm('この作品を削除しますか？章も全て削除されます。')) return;

    try {
      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      alert('削除しました！');
      await loadStories();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const togglePublish = async (storyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('user_stories')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', storyId);

      if (error) throw error;

      alert(newStatus === 'published' ? '公開しました！' : '下書きに戻しました');
      await loadStories();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
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
              <span>✍️</span>
              <span>私の作品</span>
            </h1>
            <Link
              href="/write"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              <span className="text-xl">✨</span>
              <span>新しい作品を書く</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📚</span>
              <span className="text-3xl font-bold text-blue-600">{stories.length}</span>
            </div>
            <div className="text-gray-600 font-medium">全作品</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">✅</span>
              <span className="text-3xl font-bold text-green-600">
                {stories.filter(s => s.status === 'published').length}
              </span>
            </div>
            <div className="text-gray-600 font-medium">公開中</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📝</span>
              <span className="text-3xl font-bold text-orange-600">
                {stories.filter(s => s.status === 'draft').length}
              </span>
            </div>
            <div className="text-gray-600 font-medium">下書き</div>
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
        </div>

        {/* 作品一覧 */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">まだ作品がありません</h3>
            <p className="text-gray-600 mb-6">
              あなたの物語を書き始めましょう！
            </p>
            <Link
              href="/write"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
            >
              新しい作品を書く
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {stories.map((story) => (
              <div 
                key={story.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-6"
              >
                <div className="flex gap-6">
                  {/* カバー画像 */}
                  <div className="flex-shrink-0">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-32 h-48 object-cover rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl shadow-md flex items-center justify-center">
                        <span className="text-5xl">📖</span>
                      </div>
                    )}
                  </div>

                  {/* 作品情報 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{story.title}</h3>
                          {story.status === 'published' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                              ✅ 公開中
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                              📝 下書き
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                            {story.genre}
                          </span>
                          <span>📅 {formatDate(story.updated_at)}</span>
                          <span>📖 {story.chapter_count}章</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{story.synopsis}</p>

                    {/* 統計 */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👁️</span>
                        <span className="font-bold text-gray-900">{story.view_count}</span>
                        <span className="text-gray-500 text-sm">閲覧</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">💖</span>
                        <span className="font-bold text-gray-900">{story.like_count}</span>
                        <span className="text-gray-500 text-sm">いいね</span>
                      </div>
                    </div>

                    {/* アクション */}
                    <div className="flex gap-2">
                      <Link
                        href={`/write?id=${story.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                      >
                        ✏️ 編集
                      </Link>
                      <Link
                        href={`/story/${story.id}`}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium"
                      >
                        👁️ プレビュー
                      </Link>
                      <button
                        onClick={() => togglePublish(story.id, story.status)}
                        className={`px-4 py-2 rounded-lg transition font-medium ${
                          story.status === 'published'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {story.status === 'published' ? '📝 下書きに戻す' : '✅ 公開する'}
                      </button>
                      <button
                        onClick={() => deleteStory(story.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium ml-auto"
                      >
                        🗑️ 削除
                      </button>
                    </div>
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
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Story {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
  status: 'published' | 'draft';
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
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadStories();
  }, [isLoggedIn]);

  const loadStories = async () => {
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (storiesError) throw storiesError;

      const storiesWithChapters = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { count } = await supabase
            .from('story_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return {
            ...story,
            chapter_count: count || 0
          };
        })
      );

      setStories(storiesWithChapters);
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
      toast.error('作品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm('本当にこの作品を削除しますか？')) return;

    try {
      await supabase.from('story_chapters').delete().eq('story_id', storyId);
      const { error } = await supabase.from('user_stories').delete().eq('id', storyId);
      if (error) throw error;
      toast.success('削除しました!');
      await loadStories();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
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
      toast.success(newStatus === 'published' ? '公開しました!' : '下書きに戻しました');
      await loadStories();
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('更新に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredStories = stories.filter(story => {
    if (activeTab === 'all') return true;
    return story.status === activeTab;
  });

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
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                My Stories
              </h1>
              <p className="text-gray-600">あなたの作品を管理しよう</p>
            </div>
            <Link
              href="/write"
              className="px-8 py-3 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg flex items-center gap-2 font-bold text-lg"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              <span className="text-xl">✨</span>
              <span>New Story</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 統計 + タブ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 mb-8"
        >
          {/* 統計 */}
          <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#A0C878' }}>
                {stories.length}
              </div>
              <div className="text-gray-600 font-medium">Total Stories</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#A0C878' }}>
                {stories.filter(s => s.status === 'published').length}
              </div>
              <div className="text-gray-600 font-medium">Published</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: '#A0C878' }}>
                {stories.reduce((sum, s) => sum + s.like_count, 0)}
              </div>
              <div className="text-gray-600 font-medium">Total Likes</div>
            </div>
          </div>

          {/* タブ */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'all'
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'all'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              📚 All ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'published'
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'published'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              ✅ Published ({stories.filter(s => s.status === 'published').length})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'draft'
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'draft'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              📝 Drafts ({stories.filter(s => s.status === 'draft').length})
            </button>
          </div>
        </motion.div>

        {/* 作品一覧 */}
        {filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg p-16 text-center"
          >
            <div className="text-8xl mb-6">✍️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {activeTab === 'all' ? 'No stories yet' : 
               activeTab === 'published' ? 'No published stories' : 
               'No drafts'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {activeTab === 'all' ? 'あなたの物語を書き始めましょう!' : 
               activeTab === 'published' ? '作品を公開してみましょう!' : 
               '新しい作品を書き始めましょう!'}
            </p>
            <Link
              href="/write"
              className="inline-block px-10 py-4 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg font-bold text-lg"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              Start Writing
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="flex gap-6 p-6">
                  {/* カバー画像 */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-44 rounded-xl overflow-hidden shadow-lg">
                      {story.cover_image_url ? (
                        <img
                          src={story.cover_image_url}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <span className="text-5xl">📖</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 作品情報 */}
                  <div className="flex-1 flex flex-col">
                    {/* タイトルとステータス */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{story.title}</h3>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-sm font-bold text-white"
                            style={{
                              background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                            }}
                          >
                            {story.genre}
                          </span>
                          {story.status === 'published' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                              ✅ Published
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                              📝 Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* あらすじ */}
                    <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {story.synopsis}
                    </p>

                    {/* 統計 */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📖</span>
                        <span className="font-bold text-gray-900">{story.chapter_count}</span>
                        <span className="text-gray-500 text-sm">chapters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💖</span>
                        <span className="font-bold text-gray-900">{story.like_count}</span>
                        <span className="text-gray-500 text-sm">likes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📅</span>
                        <span className="text-gray-500 text-sm">{formatDate(story.updated_at)}</span>
                      </div>
                    </div>

                    {/* ボタン */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/write?id=${story.id}`}
                        className="px-6 py-2.5 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                        }}
                      >
                        ✏️ Edit
                      </Link>
                      <Link
                        href={`/story/${story.id}`}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                      >
                        👁️ View
                      </Link>
                      <button
                        onClick={() => togglePublish(story.id, story.status)}
                        className={`px-6 py-2.5 rounded-xl transition-all font-semibold ${
                          story.status === 'published'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {story.status === 'published' ? '📝 To Draft' : '✅ Publish'}
                      </button>
                      <button
                        onClick={() => deleteStory(story.id)}
                        className="px-6 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
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
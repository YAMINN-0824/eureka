'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Chapter {
  id?: string;
  chapter_number: number;
  chapter_title: string;
  content: string;
}

export default function WritePage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('小説');
  const [synopsis, setSynopsis] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([
    { chapter_number: 1, chapter_title: '第1章', content: '' }
  ]);
  const [activeChapter, setActiveChapter] = useState(0);

  const genres = [
    '小説', '恋愛', 'ファンタジー', 'ミステリー', 'SF',
    'ホラー', '歴史', '青春', 'コメディ', 'その他'
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (editId) {
      loadStory();
    }
  }, [isLoggedIn, editId]);

  const loadStory = async () => {
    if (!editId) return;

    try {
      setLoading(true);

      const { data: storyData, error: storyError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('id', editId)
        .eq('user_id', user?.id)
        .single();

      if (storyError) throw storyError;

      setTitle(storyData.title);
      setGenre(storyData.genre);
      setSynopsis(storyData.synopsis);
      setCoverImageUrl(storyData.cover_image_url || '');

      const { data: chaptersData, error: chaptersError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', editId)
        .order('chapter_number');

      if (chaptersError) throw chaptersError;

      if (chaptersData && chaptersData.length > 0) {
        setChapters(chaptersData);
      }
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
      toast.error('作品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      chapter_number: chapters.length + 1,
      chapter_title: `第${chapters.length + 1}章`,
      content: ''
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(chapters.length);
  };

  const deleteChapter = (index: number) => {
    if (chapters.length === 1) {
      toast.error('最低1つの章が必要です');
      return;
    }
    if (!confirm('この章を削除しますか？')) return;

    const newChapters = chapters.filter((_, i) => i !== index);
    newChapters.forEach((ch, i) => {
      ch.chapter_number = i + 1;
    });
    setChapters(newChapters);
    if (activeChapter >= newChapters.length) {
      setActiveChapter(newChapters.length - 1);
    }
  };

  const updateChapter = (index: number, field: 'chapter_title' | 'content', value: string) => {
    const newChapters = [...chapters];
    newChapters[index][field] = value;
    setChapters(newChapters);
  };

  const saveDraft = async () => {
    await saveStory('draft');
  };

  const publish = async () => {
    await saveStory('published');
  };

  const saveStory = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }
    if (!synopsis.trim()) {
      toast.error('あらすじを入力してください');
      return;
    }
    if (chapters.some(ch => !ch.content.trim())) {
      toast.error('全ての章に内容を入力してください');
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        const { error: storyError } = await supabase
          .from('user_stories')
          .update({
            title,
            genre,
            synopsis,
            cover_image_url: coverImageUrl || null,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);

        if (storyError) throw storyError;

        await supabase.from('story_chapters').delete().eq('story_id', editId);

        const chaptersToInsert = chapters.map(ch => ({
          story_id: editId,
          chapter_number: ch.chapter_number,
          chapter_title: ch.chapter_title,
          content: ch.content
        }));

        const { error: chaptersError } = await supabase
          .from('story_chapters')
          .insert(chaptersToInsert);

        if (chaptersError) throw chaptersError;

        toast.success(status === 'published' ? '公開しました!' : '下書きを保存しました!');
        router.push('/my-stories');

      } else {
        const { data: storyData, error: storyError } = await supabase
          .from('user_stories')
          .insert({
            user_id: user?.id,
            title,
            genre,
            synopsis,
            cover_image_url: coverImageUrl || null,
            status
          })
          .select()
          .single();

        if (storyError) throw storyError;

        const chaptersToInsert = chapters.map(ch => ({
          story_id: storyData.id,
          chapter_number: ch.chapter_number,
          chapter_title: ch.chapter_title,
          content: ch.content
        }));

        const { error: chaptersError } = await supabase
          .from('story_chapters')
          .insert(chaptersToInsert);

        if (chaptersError) throw chaptersError;

        toast.success(status === 'published' ? '公開しました!' : '下書きを保存しました!');
        router.push('/my-stories');
      }

    } catch (error) {
      console.error('保存エラー:', error);
      toast.error('保存に失敗しました');
    } finally {
      setLoading(false);
    }
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/my-stories" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition">
                <span>←</span>
                <span>Back</span>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                {editId ? '✏️ Edit Story' : '✨ Write New Story'}
              </h1>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveDraft}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition font-semibold disabled:opacity-50"
              >
                📝 Save Draft
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={publish}
                disabled={loading}
                className="px-8 py-2.5 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                ✅ Publish
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        
        {/* 作品情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
            📖 Story Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your story title..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] text-lg transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] text-lg bg-white transition-colors"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] transition-colors"
                />
              </div>
            </div>

            {coverImageUrl && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <img src={coverImageUrl} alt="Preview" className="w-20 h-28 object-cover rounded-lg shadow-md" />
                <span className="text-sm text-gray-600">Cover Preview</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Synopsis <span className="text-red-500">*</span>
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Describe your story in a few sentences..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none text-lg transition-colors"
                rows={4}
              />
              <div className="text-sm text-gray-500 mt-2">
                {synopsis.length} characters
              </div>
            </div>
          </div>
        </motion.div>

        {/* 章の管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
              📝 Chapters
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addChapter}
              className="px-6 py-2.5 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              ➕ Add Chapter
            </motion.button>
          </div>

          {/* 章のタブ */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {chapters.map((chapter, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveChapter(index)}
                className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeChapter === index
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  activeChapter === index
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                Chapter {chapter.chapter_number}
              </motion.button>
            ))}
          </div>

          {/* 章の編集 */}
          {chapters[activeChapter] && (
            <motion.div
              key={activeChapter}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={chapters[activeChapter].chapter_title}
                  onChange={(e) => updateChapter(activeChapter, 'chapter_title', e.target.value)}
                  placeholder="Enter chapter title..."
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] text-lg transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ 
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      color: 'white'
                    }}
                  >
                    {chapters[activeChapter].content.length} characters
                  </span>
                </div>
                <textarea
                  value={chapters[activeChapter].content}
                  onChange={(e) => updateChapter(activeChapter, 'content', e.target.value)}
                  placeholder="Write your story here..."
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none font-serif text-lg leading-relaxed transition-colors"
                  rows={20}
                />
              </div>

              {chapters.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => deleteChapter(activeChapter)}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold"
                >
                  🗑️ Delete Chapter
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

      // 作品情報を取得
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

      // 章を取得
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
      alert('作品の読み込みに失敗しました');
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
      alert('最低1つの章が必要です');
      return;
    }
    if (!confirm('この章を削除しますか？')) return;

    const newChapters = chapters.filter((_, i) => i !== index);
    // 章番号を振り直す
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
      alert('タイトルを入力してください');
      return;
    }
    if (!synopsis.trim()) {
      alert('あらすじを入力してください');
      return;
    }
    if (chapters.some(ch => !ch.content.trim())) {
      alert('全ての章に内容を入力してください');
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        // 既存作品を更新
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

        // 既存の章を削除
        await supabase
          .from('story_chapters')
          .delete()
          .eq('story_id', editId);

        // 新しい章を追加
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

        alert(status === 'published' ? '公開しました！' : '下書きを保存しました！');
        router.push('/my-stories');

      } else {
        // 新規作品を作成
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

        // 章を追加
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

        alert(status === 'published' ? '公開しました！' : '下書きを保存しました！');
        router.push('/my-stories');
      }

    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center gap-4">
              <Link href="/my-stories" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
                <span>←</span>
                <span>私の作品に戻る</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>✍️</span>
                <span>{editId ? '作品を編集' : '新しい作品を書く'}</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveDraft}
                disabled={loading}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition font-medium disabled:opacity-50"
              >
                📝 下書き保存
              </button>
              <button
                onClick={publish}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
              >
                ✅ 公開する
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 作品情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📖 作品情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 春の物語"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ジャンル <span className="text-red-500">*</span>
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg bg-white"
              >
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                あらすじ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="この物語について簡単に説明してください..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-lg"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                表紙画像URL（オプション）
              </label>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              {coverImageUrl && (
                <div className="mt-2">
                  <img src={coverImageUrl} alt="プレビュー" className="w-32 h-48 object-cover rounded-lg shadow-md" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 章の管理 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">📝 章</h2>
            <button
              onClick={addChapter}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              ➕ 章を追加
            </button>
          </div>

          {/* 章のタブ */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => setActiveChapter(index)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  activeChapter === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                第{chapter.chapter_number}章
              </button>
            ))}
          </div>

          {/* 章の編集 */}
          {chapters[activeChapter] && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  章のタイトル
                </label>
                <input
                  type="text"
                  value={chapters[activeChapter].chapter_title}
                  onChange={(e) => updateChapter(activeChapter, 'chapter_title', e.target.value)}
                  placeholder="例: 出会い"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  本文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={chapters[activeChapter].content}
                  onChange={(e) => updateChapter(activeChapter, 'content', e.target.value)}
                  placeholder="物語を書いてください..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-serif text-lg leading-relaxed"
                  rows={20}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {chapters[activeChapter].content.length}文字
                </div>
              </div>

              {chapters.length > 1 && (
                <button
                  onClick={() => deleteChapter(activeChapter)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                >
                  🗑️ この章を削除
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
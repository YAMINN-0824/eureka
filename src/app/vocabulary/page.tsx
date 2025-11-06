'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VocabularyWord {
  id: string;
  word: string;
  reading: string;
  old_meaning: string;
  modern_meaning: string;
  example: string;
  notes: string;
  book_id: string;
  book_title: string;
  saved_date: string;
  review_count: number;
  last_reviewed_at: string | null;
  is_mastered: boolean;
}

export default function VocabularyPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'learning'>('all');
  
  // 統計
  const [totalWords, setTotalWords] = useState(0);
  const [thisWeekWords, setThisWeekWords] = useState(0);
  const [masteredWords, setMasteredWords] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadVocabulary();
  }, [isLoggedIn]);

  useEffect(() => {
    filterWords();
  }, [searchQuery, filterStatus, words]);

  const loadVocabulary = async () => {
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .eq('user_id', user?.id)
        .order('saved_date', { ascending: false });

      if (error) throw error;

      setWords(data || []);
      
      // 統計を計算
      setTotalWords(data?.length || 0);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = data?.filter(w => new Date(w.saved_date) >= oneWeekAgo).length || 0;
      setThisWeekWords(thisWeek);
      
      const mastered = data?.filter(w => w.is_mastered).length || 0;
      setMasteredWords(mastered);
      
    } catch (error) {
      console.error('単語の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWords = () => {
    let filtered = words;

    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter(w => 
        w.word.includes(searchQuery) ||
        w.reading?.includes(searchQuery) ||
        w.old_meaning?.includes(searchQuery) ||
        w.modern_meaning?.includes(searchQuery)
      );
    }

    // ステータスフィルター
    if (filterStatus === 'mastered') {
      filtered = filtered.filter(w => w.is_mastered);
    } else if (filterStatus === 'learning') {
      filtered = filtered.filter(w => !w.is_mastered);
    }

    setFilteredWords(filtered);
  };

  const deleteWord = async (wordId: string) => {
    if (!confirm('この単語を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .delete()
        .eq('id', wordId);

      if (error) throw error;

      alert('削除しました！');
      await loadVocabulary();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const toggleMastered = async (wordId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .update({ 
          is_mastered: !currentStatus,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', wordId);

      if (error) throw error;

      await loadVocabulary();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/my-bookshelf" className="text-blue-600 hover:underline font-medium">
                ← 本棚に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📖 私の単語帳</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* 統計 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 mb-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-6">📊 学習統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">{totalWords}個</div>
              <div className="text-sm opacity-90">保存した単語</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">{thisWeekWords}個</div>
              <div className="text-sm opacity-90">今週の新しい単語</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">{masteredWords}個</div>
              <div className="text-sm opacity-90">マスター済み</div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 単語を検索..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-6 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-lg bg-white"
            >
              <option value="all">全て</option>
              <option value="learning">学習中</option>
              <option value="mastered">マスター済み</option>
            </select>
          </div>
        </div>

        {/* 単語リスト */}
        {filteredWords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">単語がありません</h3>
            <p className="text-gray-600">
              {searchQuery ? '検索結果が見つかりませんでした' : '本を読みながら気になった言葉を保存しましょう！'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWords.map((word) => (
              <div 
                key={word.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6"
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      📝 {word.word}
                      {word.reading && (
                        <span className="text-lg text-gray-500 ml-3">（{word.reading}）</span>
                      )}
                    </h3>
                    {word.is_mastered && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        ✓ マスター済み
                      </span>
                    )}
                  </div>
                </div>

                {/* 意味 */}
                <div className="space-y-3 mb-4">
                  {word.old_meaning && (
                    <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <h4 className="font-bold text-blue-700 mb-1 text-sm">📚 明治時代の意味</h4>
                      <p className="text-gray-800">{word.old_meaning}</p>
                    </div>
                  )}
                  
                  {word.modern_meaning && (
                    <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
                      <h4 className="font-bold text-green-700 mb-1 text-sm">📖 現代の意味</h4>
                      <p className="text-gray-800">{word.modern_meaning}</p>
                    </div>
                  )}
                  
                  {word.example && (
                    <div className="p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
                      <h4 className="font-bold text-purple-700 mb-1 text-sm">💡 例文</h4>
                      <p className="text-gray-800 italic">「{word.example}」</p>
                    </div>
                  )}
                  
                  {word.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">ℹ️ 補足：</span> {word.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* メタ情報 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {word.book_title && (
                    <div className="flex items-center gap-1">
                      <span>📕</span>
                      <Link 
                        href={`/reader/${word.book_id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {word.book_title}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{formatDate(word.saved_date)}</span>
                  </div>
                </div>

                {/* アクション */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMastered(word.id, word.is_mastered)}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition ${
                      word.is_mastered
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {word.is_mastered ? '↩️ 学習中に戻す' : '✓ マスター'}
                  </button>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
                  >
                    🗑️ 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
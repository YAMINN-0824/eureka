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
  
  // 学習履歴統計
  const [todayLookups, setTodayLookups] = useState(0);
  const [thisWeekLookups, setThisWeekLookups] = useState(0);
  const [thisMonthLookups, setThisMonthLookups] = useState(0);
  const [topWords, setTopWords] = useState<Array<{word: string, count: number, last_looked_up: string}>>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadVocabulary();
    loadLookupStats();
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

  const loadLookupStats = async () => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 今日の検索回数
      const { count: todayCount } = await supabase
        .from('word_lookup_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('looked_up_at', startOfToday.toISOString());

      setTodayLookups(todayCount || 0);

      // 今週の検索回数
      const { count: weekCount } = await supabase
        .from('word_lookup_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('looked_up_at', startOfWeek.toISOString());

      setThisWeekLookups(weekCount || 0);

      // 今月の検索回数
      const { count: monthCount } = await supabase
        .from('word_lookup_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('looked_up_at', startOfMonth.toISOString());

      setThisMonthLookups(monthCount || 0);

      // よく調べる単語ランキング
      const { data: historyData } = await supabase
        .from('word_lookup_history')
        .select('word, looked_up_at')
        .eq('user_id', user?.id)
        .order('looked_up_at', { ascending: false })
        .limit(1000);

      if (historyData && historyData.length > 0) {
        // 単語ごとにカウント
        const wordCounts: { [key: string]: { count: number, lastLookup: string } } = {};
        
        historyData.forEach(item => {
          if (!wordCounts[item.word]) {
            wordCounts[item.word] = { count: 0, lastLookup: item.looked_up_at };
          }
          wordCounts[item.word].count++;
          if (new Date(item.looked_up_at) > new Date(wordCounts[item.word].lastLookup)) {
            wordCounts[item.word].lastLookup = item.looked_up_at;
          }
        });

        // 配列に変換してソート
        const sortedWords = Object.entries(wordCounts)
          .map(([word, data]) => ({
            word,
            count: data.count,
            last_looked_up: data.lastLookup
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopWords(sortedWords);
      }
    } catch (error) {
      console.error('学習統計の読み込みエラー:', error);
    }
  };

  const filterWords = () => {
    let filtered = words;

    if (searchQuery) {
      filtered = filtered.filter(w => 
        w.word.includes(searchQuery) ||
        w.reading?.includes(searchQuery) ||
        w.old_meaning?.includes(searchQuery) ||
        w.modern_meaning?.includes(searchQuery)
      );
    }

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

      alert('更新しました！');
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return `${Math.floor(diffDays / 30)}ヶ月前`;
  };

  const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/my-bookshelf" 
                className="px-4 py-2 rounded-xl font-medium transition-all text-white"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                ← 本棚
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📚</span>
                <span>私の単語帳</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* 学習進捗バー */}
        {totalWords > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: '#7B9E5F' }}>
                学習進捗
              </h3>
              <span className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
                {masteryPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${masteryPercentage}%`,
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600 text-center">
              {masteredWords} / {totalWords} 単語をマスター
            </div>
          </div>
        )}
        
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📖</span>
              <span className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>{totalWords}</span>
            </div>
            <div className="text-gray-600 font-medium">保存した単語</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">✨</span>
              <span className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>{thisWeekWords}</span>
            </div>
            <div className="text-gray-600 font-medium">今週追加</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">✅</span>
              <span className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>{masteredWords}</span>
            </div>
            <div className="text-gray-600 font-medium">マスター済み</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">🔥</span>
              <span className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>{todayLookups}</span>
            </div>
            <div className="text-gray-600 font-medium">今日調べた</div>
          </div>
        </div>

        {/* 学習履歴セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 検索履歴 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>検索履歴</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                }}
              >
                <span className="text-gray-700 font-medium">今日</span>
                <span className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>{todayLookups}回</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                }}
              >
                <span className="text-gray-700 font-medium">今週</span>
                <span className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>{thisWeekLookups}回</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                }}
              >
                <span className="text-gray-700 font-medium">今月</span>
                <span className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>{thisMonthLookups}回</span>
              </div>
            </div>
          </div>

          {/* よく調べる単語 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🏆</span>
              <span>よく調べる言葉 TOP5</span>
            </h3>
            {topWords.length > 0 ? (
              <div className="space-y-2">
                {topWords.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:shadow-md transition"
                    style={{
                      background: index === 0 
                        ? 'linear-gradient(to right, #fef3c7, #fde68a)' 
                        : index === 1 
                        ? 'linear-gradient(to right, #e5e7eb, #d1d5db)'
                        : index === 2
                        ? 'linear-gradient(to right, #fed7aa, #fdba74)'
                        : 'linear-gradient(to right, #f0fdf4, #dcfce7)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{item.word}</div>
                        <div className="text-xs text-gray-500">最後: {formatTimeAgo(item.last_looked_up)}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-700 shadow-sm">
                      {item.count}回
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📚</div>
                <div>まだ単語を調べていません</div>
                <div className="text-sm mt-1">本を読んで言葉を調べてみましょう！</div>
              </div>
            )}
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="単語を検索..."
                className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none text-lg"
                style={{
                  borderColor: '#A0C878',
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-6 py-3 border-2 rounded-xl focus:outline-none text-lg bg-white font-medium"
              style={{
                borderColor: '#A0C878',
              }}
            >
              <option value="all">すべて</option>
              <option value="learning">学習中</option>
              <option value="mastered">マスター済み</option>
            </select>
          </div>
        </div>

        {/* 単語リスト */}
        {filteredWords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">単語がありません</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? '検索結果が見つかりませんでした' : '本を読みながら気になった言葉を保存しましょう！'}
            </p>
            {!searchQuery && (
              <Link
                href="/my-bookshelf"
                className="inline-block px-6 py-3 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                本棚に戻る
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredWords.map((word) => (
              <div 
                key={word.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6"
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{word.word}</h3>
                      {word.reading && (
                        <span className="text-lg text-gray-500">（{word.reading}）</span>
                      )}
                      {word.is_mastered && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                          style={{
                            background: 'linear-gradient(to right, #dcfce7, #bbf7d0)',
                            color: '#15803d',
                          }}
                        >
                          <span>✓</span>
                          <span>マスター</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {word.book_title && (
                        <Link 
                          href={`/reader/${word.book_id}`}
                          className="hover:underline flex items-center gap-1"
                          style={{ color: '#7B9E5F' }}
                        >
                          <span>📕</span>
                          <span>{word.book_title}</span>
                        </Link>
                      )}
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{formatDate(word.saved_date)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 意味 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {word.old_meaning && (
                    <div className="p-4 rounded-xl border-l-4"
                      style={{
                        background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                        borderColor: '#A0C878'
                      }}
                    >
                      <h4 className="font-bold mb-1 text-sm" style={{ color: '#7B9E5F' }}>
                        📚 明治時代
                      </h4>
                      <p className="text-gray-800">{word.old_meaning}</p>
                    </div>
                  )}
                  
                  {word.modern_meaning && (
                    <div className="p-4 rounded-xl border-l-4"
                      style={{
                        background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                        borderColor: '#A0C878'
                      }}
                    >
                      <h4 className="font-bold mb-1 text-sm" style={{ color: '#7B9E5F' }}>
                        📖 現代
                      </h4>
                      <p className="text-gray-800">{word.modern_meaning}</p>
                    </div>
                  )}
                </div>

                {word.example && (
                  <div className="p-4 rounded-xl border-l-4 mb-4"
                    style={{
                      background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                      borderColor: '#f59e0b'
                    }}
                  >
                    <h4 className="font-bold mb-1 text-sm text-amber-700">💡 例文</h4>
                    <p className="text-gray-800 italic">「{word.example}」</p>
                  </div>
                )}

                {word.notes && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
                    <p className="text-gray-600 text-sm">
                      <span className="font-semibold">ℹ️ 補足：</span> {word.notes}
                    </p>
                  </div>
                )}

                {/* アクション */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMastered(word.id, word.is_mastered)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold transition shadow-lg hover:shadow-xl"
                    style={{
                      background: word.is_mastered
                        ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                        : 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      color: word.is_mastered ? '#374151' : 'white'
                    }}
                  >
                    {word.is_mastered ? '↩️ 学習中に戻す' : '✓ マスターした！'}
                  </button>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="px-6 py-3 rounded-xl transition font-bold shadow-lg hover:shadow-xl text-white"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    }}
                  >
                    🗑️
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
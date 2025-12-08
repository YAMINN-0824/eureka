'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Word {
  id: string;
  word: string;
  reading: string;
  old_meaning: string;
  modern_meaning: string;
  example: string;
  notes: string;
  created_at: string;
}

export default function AdminDictionaryPage() {
  const { user, userRole, isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  // フォームの状態
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    old_meaning: '',
    modern_meaning: '',
    example: '',
    notes: ''
  });

  // 権限チェック
  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (userRole !== 'admin') {
      toast.error('管理者権限が必要です');
      router.push('/');
      return;
    }

    loadWords();
  }, [isLoggedIn, userRole, authLoading, router]);

  // 単語を読み込む
  const loadWords = async () => {
    try {
      const { data, error } = await supabase
        .from('word_dictionary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWords(data || []);
    } catch (error) {
      console.error('単語の読み込みエラー:', error);
      toast.error('単語の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 単語を追加
  const addWord = async () => {
    console.log('🔵 addWord function called');
    console.log('📝 Form data:', formData);
    
    if (!formData.word.trim() || !formData.reading.trim()) {
      console.log('❌ Validation failed');
      toast.error('単語と読み方は必須です');
      return;
    }

    console.log('✅ Validation passed');

    try {
      console.log('📤 Inserting to database...');
      const { data, error } = await supabase
        .from('word_dictionary')
        .insert([formData])
        .select();

      console.log('📥 Database response:', { data, error });

      if (error) throw error;

      toast.success('✅ 単語を追加しました!');
      resetForm();
      setShowAddForm(false);
      await loadWords();
    } catch (error: any) {
      console.error('❌ Error:', error);
      if (error.code === '23505') {
        toast.error('この単語は既に登録されています');
      } else {
        toast.error('追加に失敗しました: ' + error.message);
      }
    }
  };

  // 単語を更新
  const updateWord = async () => {
    if (!editingWord) return;

    console.log('🔵 updateWord function called');

    try {
      const { error } = await supabase
        .from('word_dictionary')
        .update(formData)
        .eq('id', editingWord.id);

      if (error) throw error;

      toast.success('✅ 更新しました!');
      resetForm();
      setEditingWord(null);
      await loadWords();
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('更新に失敗しました');
    }
  };

  // 単語を削除
  const deleteWord = async (wordId: string) => {
    console.log('🔵 deleteWord function called:', wordId);
    
    if (!confirm('本当にこの単語を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('word_dictionary')
        .delete()
        .eq('id', wordId);

      if (error) throw error;

      toast.success('🗑️ 削除しました!');
      await loadWords();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
    }
  };

  // 編集モードに切り替え
  const startEditing = (word: Word) => {
    console.log('🔵 startEditing function called:', word.word);
    
    setEditingWord(word);
    setFormData({
      word: word.word,
      reading: word.reading,
      old_meaning: word.old_meaning,
      modern_meaning: word.modern_meaning,
      example: word.example,
      notes: word.notes
    });
    setShowAddForm(true);
  };

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      word: '',
      reading: '',
      old_meaning: '',
      modern_meaning: '',
      example: '',
      notes: ''
    });
    setEditingWord(null);
  };

  // 検索フィルター
  const filteredWords = words.filter(w =>
    w.word.includes(searchQuery) ||
    w.reading.includes(searchQuery) ||
    w.old_meaning?.includes(searchQuery) ||
    w.modern_meaning?.includes(searchQuery)
  );

  // 認証loading中
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // 管理者でない場合
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-6">この機能は管理者のみ利用できます</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-white rounded-xl font-medium"
            style={{ background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }}
          >
            ホームに戻る
          </Link>
        </div>
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
                style={{ background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }}
              >
                ← 本棚
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔧</span>
                <span>辞書管理</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-xl">
              <span className="text-amber-700 font-bold">👑 管理者モード</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* 統計と検索 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>
                  {words.length}
                </div>
                <div className="text-sm text-gray-600">登録済み単語</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {filteredWords.length}
                </div>
                <div className="text-sm text-gray-600">検索結果</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                console.log('🔘 Add button clicked');
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }}
            >
              ➕ 新しい単語を追加
            </button>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="単語を検索..."
              className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none"
              style={{ borderColor: '#A0C878' }}
            />
          </div>
        </div>

        {/* 追加/編集フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
              {editingWord ? '📝 単語を編集' : '➕ 新しい単語を追加'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  単語 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  placeholder="書生"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  読み方 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reading}
                  onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                  placeholder="しょせい"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                明治時代の意味
              </label>
              <textarea
                value={formData.old_meaning}
                onChange={(e) => setFormData({ ...formData, old_meaning: e.target.value })}
                placeholder="学問をする学生、または住み込みで働く学生"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                現代の意味
              </label>
              <textarea
                value={formData.modern_meaning}
                onChange={(e) => setFormData({ ...formData, modern_meaning: e.target.value })}
                placeholder="勉強する学生"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                例文
              </label>
              <input
                type="text"
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                placeholder="私は書生として先生の家に出入りした"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878]"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                メモ・補足
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="明治時代特有の言葉"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('🔘 Cancel button clicked');
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  console.log('🔘 Submit button clicked!');
                  console.log('editingWord:', editingWord);
                  if (editingWord) {
                    updateWord();
                  } else {
                    addWord();
                  }
                }}
                type="button"
                className="flex-1 px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }}
              >
                {editingWord ? '✓ 更新する' : '➕ 追加する'}
              </button>
            </div>
          </div>
        )}

        {/* 単語リスト */}
        {filteredWords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">単語がありません</h3>
            <p className="text-gray-600">
              {searchQuery ? '検索結果が見つかりませんでした' : '新しい単語を追加しましょう！'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{word.word}</h3>
                      <span className="text-lg text-gray-500">（{word.reading}）</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {word.old_meaning && (
                        <div className="p-3 rounded-lg border-l-4"
                          style={{
                            background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                            borderColor: '#A0C878'
                          }}
                        >
                          <h4 className="font-bold text-xs mb-1" style={{ color: '#7B9E5F' }}>
                            📚 明治時代
                          </h4>
                          <p className="text-sm text-gray-800">{word.old_meaning}</p>
                        </div>
                      )}

                      {word.modern_meaning && (
                        <div className="p-3 rounded-lg border-l-4"
                          style={{
                            background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                            borderColor: '#A0C878'
                          }}
                        >
                          <h4 className="font-bold text-xs mb-1" style={{ color: '#7B9E5F' }}>
                            📖 現代
                          </h4>
                          <p className="text-sm text-gray-800">{word.modern_meaning}</p>
                        </div>
                      )}
                    </div>

                    {word.example && (
                      <div className="p-3 rounded-lg border-l-4 mb-3"
                        style={{
                          background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                          borderColor: '#f59e0b'
                        }}
                      >
                        <h4 className="font-bold text-xs mb-1 text-amber-700">💡 例文</h4>
                        <p className="text-sm text-gray-800 italic">「{word.example}」</p>
                      </div>
                    )}

                    {word.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">ℹ️ 補足：</span> {word.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(word)}
                      className="px-4 py-2 text-white rounded-lg font-medium transition-all shadow hover:shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                    >
                      ✏️ 編集
                    </button>
                    <button
                      onClick={() => deleteWord(word.id)}
                      className="px-4 py-2 text-white rounded-lg font-medium transition-all shadow hover:shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                    >
                      🗑️
                    </button>
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
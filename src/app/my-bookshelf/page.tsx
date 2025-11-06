'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: 'want_to_read' | 'reading' | 'read' | 'paused';
  rating: number | null;
  memo: string | null;
  page_count: number | null;
  started_date: string | null;
  finished_date: string | null;
  tags: string[] | null;
  created_at: string;
  // ✨ NEW
  aozora_book_id: string | null;
  preview_link: string | null;
  buy_link: string | null;
}

export default function MyBookshelfPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'want_to_read' | 'reading' | 'read'>('want_to_read');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [newTag, setNewTag] = useState('');
  const [totalWords, setTotalWords] = useState(0); // 単語数

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadBooks();
    loadWordCount(); // 単語数を取得
  }, [isLoggedIn]);

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('bookshelves')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('本の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWordCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (error) throw error;
      setTotalWords(count || 0);
    } catch (error) {
      console.error('単語数の取得エラー:', error);
    }
  };

  const updateBook = async () => {
    if (!editBook) return;

    try {
      const { error } = await supabase
        .from('bookshelves')
        .update({
          status: editBook.status,
          rating: editBook.rating,
          memo: editBook.memo,
          page_count: editBook.page_count,
          started_date: editBook.started_date,
          finished_date: editBook.finished_date,
          tags: editBook.tags
        })
        .eq('id', editBook.id);

      if (error) throw error;

      alert('保存しました！');
      setShowDetailModal(false);
      setSelectedBook(null);
      setEditBook(null);
      await loadBooks();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('保存に失敗しました');
    }
  };

  const deleteBook = async () => {
    if (!editBook) return;

    if (!confirm('本当にこの本を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('bookshelves')
        .delete()
        .eq('id', editBook.id);

      if (error) throw error;

      alert('削除しました！');
      setShowDetailModal(false);
      setSelectedBook(null);
      setEditBook(null);
      await loadBooks();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const addTag = () => {
    if (!editBook || !newTag.trim()) return;
    
    const currentTags = editBook.tags || [];
    if (currentTags.includes(newTag.trim())) {
      alert('このタグは既に追加されています');
      return;
    }
    
    setEditBook({
      ...editBook,
      tags: [...currentTags, newTag.trim()]
    });
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!editBook) return;
    
    setEditBook({
      ...editBook,
      tags: (editBook.tags || []).filter(tag => tag !== tagToRemove)
    });
  };

  const filteredBooks = books.filter(book => book.status === activeTab);

  const getBooksByStatus = (status: string) => {
    return books.filter(book => book.status === status).length;
  };

  const openBookDetails = (book: Book) => {
    setSelectedBook(book);
    setEditBook({ ...book });
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'want_to_read': return 'bg-blue-500';
      case 'reading': return 'bg-green-500';
      case 'read': return 'bg-purple-500';
      case 'paused': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">私の本棚</h1>
              <p className="text-gray-600">読書の記録を管理しましょう</p>
            </div>
            
            {/* 単語帳ボタン */}
            <Link
              href="/vocabulary"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              <span className="text-xl">📚</span>
              <span>私の単語帳</span>
              {totalWords > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                  totalWords > 0
                    ? 'bg-pink-300 text-gray-900'
                    : 'bg-white bg-opacity-30 text-white'
                }`}>
                  {totalWords}
                </span>
              )}
            </Link>
          </div>

          {/* ✨ タブ - Droppedを削除 */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setActiveTab('want_to_read')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
                activeTab === 'want_to_read'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              To Read 📚 
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'want_to_read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
                  
              }`}>
                {getBooksByStatus('want_to_read')}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('reading')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
                activeTab === 'reading'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Reading 📖 
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'reading'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {getBooksByStatus('reading')}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('read')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
                activeTab === 'read'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Read ✅ 
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {getBooksByStatus('read')}
              </span>
            </button>
          </div>

          {/* 本のグリッド */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg mb-6">まだ本が追加されていません</p>
              <button
                onClick={() => router.push('/books')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                本を探す
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <div key={book.id} className="group">
                  <div 
                    className="relative cursor-pointer mb-3"
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 rounded-2xl shadow-lg flex items-center justify-center">
                        <span className="text-7xl">📕</span>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 w-8 h-8 ${getStatusColor(book.status)} rounded-full flex items-center justify-center shadow-md`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                      </svg>
                    </div>
                  </div>

                  {/* ✨ 本の情報とボタン */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{book.title}</h3>
                    <p className="text-gray-500 text-xs truncate">{book.author}</p>
                    
                    {/* ✨ 評価表示 */}
                    {book.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-sm">
                            {i < book.rating! ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* ✨ アクションボタン */}
                    <div className="space-y-1">
                      {/* 青空文庫の本なら「読む」ボタン */}
                      {book.aozora_book_id && (
                        <Link
                          href={`/reader/${book.aozora_book_id}`}
                          className="block w-full px-2 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-center text-xs font-semibold transition"
                        >
                          📖 読む
                        </Link>
                      )}

                      {/* Google Booksのプレビュー */}
                      {book.preview_link && !book.aozora_book_id && (
                        <a
                          href={book.preview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-2 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center text-xs font-semibold transition"
                        >
                          🔗 プレビュー
                        </a>
                      )}

                      {/* 購入リンク */}
                      {book.buy_link && (
                        <a
                          href={book.buy_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-2 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center text-xs font-semibold transition"
                        >
                          🛒 購入
                        </a>
                      )}

                      {/* 詳細ボタン */}
                      <button
                        onClick={() => openBookDetails(book)}
                        className="w-full px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-xs font-semibold transition"
                      >
                        📝 詳細
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* フローティングボタン */}
      {books.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 w-20 h-20 bg-blue-500 rounded-full shadow-2xl hover:scale-105 transition flex flex-col items-center justify-center"
        >
          <span className="text-white text-4xl font-light leading-none">+</span>
          <span className="text-white text-xs font-medium mt-1">Add Book</span>
        </button>
      )}

      {/* 詳細モーダル */}
      {showDetailModal && selectedBook && editBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              
              {/* 本情報ヘッダー */}
              <div className="flex gap-6 mb-8">
                {selectedBook.cover_url ? (
                  <img 
                    src={selectedBook.cover_url} 
                    alt={selectedBook.title} 
                    className="w-40 h-60 object-cover rounded-2xl shadow-xl"
                  />
                ) : (
                  <div className="w-40 h-60 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 rounded-2xl shadow-xl flex items-center justify-center">
                    <span className="text-6xl">📕</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedBook.title}</h2>
                  <p className="text-gray-400 text-lg mb-6">{selectedBook.author}</p>
                  
                  {/* 読書状態 */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">読書状態</label>
                    <select
                      value={editBook.status}
                      onChange={(e) => setEditBook({ ...editBook, status: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="want_to_read">📚 読みたい</option>
                      <option value="reading">📖 読んでる</option>
                      <option value="read">✅ 読んだ</option>
                      <option value="paused">⏸️ 中断中</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reading Period */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reading Period</h3>
                
                {/* 星評価 */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">評価</label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditBook({ ...editBook, rating: star })}
                          className="text-3xl transition hover:scale-110"
                        >
                          {(editBook.rating || 0) >= star ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">Your Rating</span>
                  </div>
                </div>

                {/* 日付 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Started</label>
                    <input
                      type="date"
                      value={editBook.started_date || ''}
                      onChange={(e) => setEditBook({ ...editBook, started_date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Finished</label>
                    <input
                      type="date"
                      value={editBook.finished_date || ''}
                      onChange={(e) => setEditBook({ ...editBook, finished_date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* タグ */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">タグ</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(editBook.tags || []).map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium text-sm flex items-center gap-2"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-white hover:bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="新しいタグを追加..."
                    className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* Memo & Notes */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Memo & Notes</h3>
                <textarea
                  value={editBook.memo || ''}
                  onChange={(e) => setEditBook({ ...editBook, memo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  rows={6}
                  placeholder="この本についての感想やメモを書いてください..."
                />
              </div>

              {/* Page Count */}
              <div className="mb-8">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-xl">
                  <span className="font-bold text-gray-900 text-lg">Page Count</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editBook.page_count || ''}
                      onChange={(e) => setEditBook({ ...editBook, page_count: parseInt(e.target.value) || null })}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-right text-2xl font-bold focus:outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    <span className="text-gray-400">pages</span>
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex items-center justify-between">
                <button
                  onClick={deleteBook}
                  className="text-red-500 hover:text-red-600 font-medium transition"
                >
                  Delete Book
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedBook(null);
                      setEditBook(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={updateBook}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-4">本を追加</h2>
            <p className="text-gray-600 mb-4">「本を探す」ページから本を追加してください</p>
            <button
              onClick={() => {
                setShowAddModal(false);
                router.push('/books');
              }}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 mb-3"
            >
              本を探すページへ
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
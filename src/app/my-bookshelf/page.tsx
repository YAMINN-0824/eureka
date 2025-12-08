'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
  aozora_book_id: string | null;
  preview_link: string | null;
  buy_link: string | null;
}

export default function MyBookshelfPage() {
  const { user, userRole, isLoggedIn } = useAuth(); // ← userRoleを追加
  console.log('👤 User:', user?.email);
  console.log('🔑 Role:', userRole);
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'want_to_read' | 'reading' | 'read'>('want_to_read');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [newTag, setNewTag] = useState('');
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadBooks();
    loadWordCount();
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

      toast.success('保存しました!');
      setShowDetailModal(false);
      setSelectedBook(null);
      setEditBook(null);
      await loadBooks();
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('保存に失敗しました');
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

      toast.success('削除しました!');
      setShowDetailModal(false);
      setSelectedBook(null);
      setEditBook(null);
      await loadBooks();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
    }
  };

  const addTag = () => {
    if (!editBook || !newTag.trim()) return;
    
    const currentTags = editBook.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error('このタグは既に追加されています');
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

  const getBookCover = (book: Book, index: number) => {
    if (book.cover_url) {
      return <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />;
    }
    
    const gradients = [
      'from-emerald-300 via-emerald-400 to-emerald-500',
      'from-green-300 via-green-400 to-green-500',
      'from-teal-300 via-teal-400 to-teal-500',
      'from-lime-300 via-lime-400 to-lime-500',
    ];
    
    const gradient = gradients[index % gradients.length];
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-7xl">📕</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          
          {/* ヘッダー */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                My Library
              </h1>
              <p className="text-gray-600">あなたの読書記録を管理しよう</p>
            </div>
            
            {/* 単語帳ボタン */}
            <Link
              href="/vocabulary"
              className="px-6 py-3 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg flex items-center gap-2 font-semibold"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              <span className="text-xl">📚</span>
              <span>Vocabulary</span>
              {totalWords > 0 && (
                <span className="px-3 py-1 bg-white/30 rounded-full text-sm font-bold">
                  {totalWords}
                </span>
              )}
            </Link>
          </motion.div>

          {/* タブ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mb-8"
          >
            <button
              onClick={() => setActiveTab('want_to_read')}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'want_to_read'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeTab === 'want_to_read'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              📚 Want to Read
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'want_to_read'
                  ? 'bg-white/30 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {getBooksByStatus('want_to_read')}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('reading')}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'reading'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeTab === 'reading'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              📖 Reading
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'reading'
                  ? 'bg-white/30 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {getBooksByStatus('reading')}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('read')}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'read'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeTab === 'read'
                  ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                  : {}
              }
            >
              ✅ Read
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'read'
                  ? 'bg-white/30 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {getBooksByStatus('read')}
              </span>
            </button>
          </motion.div>

          {/* 本のグリッド */}
          {filteredBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-4">📚</div>
              <p className="text-gray-500 text-lg mb-6">まだ本がありません</p>
              <button
                onClick={() => router.push('/books')}
                className="px-8 py-4 text-white rounded-2xl hover:shadow-xl transition-all shadow-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                Find Books
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  {/* 本の表紙 */}
                  <div className="relative cursor-pointer mb-3">
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow">
                      {getBookCover(book, index)}
                    </div>
                  </div>

                  {/* 本の情報 */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{book.title}</h3>
                    <p className="text-gray-500 text-xs truncate">{book.author}</p>
                    
                    {/* 評価表示 */}
                    {book.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-sm">
                            {i < book.rating! ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* アクションボタン */}
                    <div className="space-y-1.5">
                      {book.aozora_book_id && (
                        <Link
                          href={`/reader/${book.aozora_book_id}`}
                          className="block w-full px-3 py-2 text-white rounded-xl hover:shadow-md text-center text-xs font-semibold transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                          }}
                        >
                          📖 Read
                        </Link>
                      )}

                      {book.preview_link && !book.aozora_book_id && (
                        <a
                          href={book.preview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-center text-xs font-semibold transition"
                        >
                          🔗 Preview
                        </a>
                      )}

                      {book.buy_link && (
                        <a
                          href={book.buy_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-center text-xs font-semibold transition"
                        >
                          🛒 Buy
                        </a>
                      )}

                      <button
                        onClick={() => openBookDetails(book)}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-center text-xs font-semibold transition"
                      >
                        📝 Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {showDetailModal && selectedBook && editBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10">
                
                {/* 本情報ヘッダー */}
                <div className="flex gap-6 mb-8">
                  <div className="w-40 flex-shrink-0">
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-xl">
                      {getBookCover(selectedBook, 0)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedBook.title}</h2>
                    <p className="text-gray-500 text-lg mb-6">{selectedBook.author}</p>
                    
                    {/* 読書状態 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                      <select
                        value={editBook.status}
                        onChange={(e) => setEditBook({ ...editBook, status: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] font-medium"
                      >
                        <option value="want_to_read">📚 Want to Read</option>
                        <option value="reading">📖 Reading</option>
                        <option value="read">✅ Read</option>
                        <option value="paused">⏸️ Paused</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reading Period */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Reading Period</h3>
                  
                  {/* 星評価 */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Rating</label>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditBook({ ...editBook, rating: star })}
                            className="text-3xl transition"
                          >
                            {(editBook.rating || 0) >= star ? '⭐' : '☆'}
                          </motion.button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">Your Rating</span>
                    </div>
                  </div>

                  {/* 日付 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Started</label>
                      <input
                        type="date"
                        value={editBook.started_date || ''}
                        onChange={(e) => setEditBook({ ...editBook, started_date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Finished</label>
                      <input
                        type="date"
                        value={editBook.finished_date || ''}
                        onChange={(e) => setEditBook({ ...editBook, finished_date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878]"
                      />
                    </div>
                  </div>
                </div>

                {/* タグ */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editBook.tags || []).map((tag, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="px-4 py-2 text-white rounded-xl font-medium text-sm flex items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                        }}
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition"
                        >
                          ×
                        </button>
                      </motion.span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-[#A0C878]"
                    />
                    <button
                      onClick={addTag}
                      className="px-6 py-3 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Memo & Notes */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Memo & Notes</h3>
                  <textarea
                    value={editBook.memo || ''}
                    onChange={(e) => setEditBook({ ...editBook, memo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none"
                    rows={6}
                    placeholder="Write your thoughts about this book..."
                  />
                </div>

                {/* Page Count */}
                <div className="mb-8">
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                    <span className="font-bold text-gray-900 text-lg">Page Count</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editBook.page_count || ''}
                        onChange={(e) => setEditBook({ ...editBook, page_count: parseInt(e.target.value) || null })}
                        className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl text-right text-2xl font-bold focus:outline-none focus:border-[#A0C878]"
                        placeholder="0"
                      />
                      <span className="text-gray-500">pages</span>
                    </div>
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    onClick={deleteBook}
                    className="text-red-500 hover:text-red-600 font-semibold transition"
                  >
                    🗑️ Delete Book
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedBook(null);
                        setEditBook(null);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateBook}
                      className="px-8 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
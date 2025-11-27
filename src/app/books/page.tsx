'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  category?: string;
  price?: number | null;
  buyLink?: string;
  isPublicDomain?: boolean;
  previewLink?: string;
}

// カテゴリー別の本のデータ
const BOOK_CATEGORIES = {
  popular: {
    title: '🔥 Popular Japanese Literature',
    subtitle: '人気の日本文学',
    books: [
      {
        id: 'pop-1',
        title: 'こころ',
        author: '夏目漱石',
        cover_url: 'https://m.media-amazon.com/images/I/91EyNHRJtZL._AC_UL480_FMwebp_QL65_.jpg',
        description: '明治時代の日本を舞台に、友情と裏切り、愛と罪悪感を描いた名作',
        category: 'popular',
        isPublicDomain: false
      },
      {
        id: 'pop-2',
        title: '人間失格',
        author: '太宰治',
        cover_url: 'https://m.media-amazon.com/images/I/81T0U8V-7FS._AC_UL480_FMwebp_QL65_.jpg',
        description: '人間性を失っていく主人公の苦悩を描いた自伝的小説',
        category: 'popular',
        isPublicDomain: false
      },
      {
        id: 'pop-3',
        title: '坊っちゃん',
        author: '夏目漱石',
        cover_url: 'https://covers.openlibrary.org/b/id/12583098-L.jpg',
        description: '江戸っ子気質の主人公が地方の中学校で巻き起こす騒動を描く',
        category: 'popular',
        isPublicDomain: false
      },
      {
        id: 'pop-4',
        title: '走れメロス',
        author: '太宰治',
        cover_url: 'https://m.media-amazon.com/images/I/71iSzDd9HIL._AC_UL480_FMwebp_QL65_.jpg',
        description: '友情と信頼をテーマにした短編小説の傑作',
        category: 'popular',
        isPublicDomain: false
      },
      {
        id: 'pop-5',
        title: '雪国',
        author: '川端康成',
        cover_url: 'https://m.media-amazon.com/images/I/81y6Y+BiJIL._AC_UL480_FMwebp_QL65_.jpg',
        description: 'ノーベル賞作家による美しい日本の風景と人間模様',
        category: 'popular',
        isPublicDomain: false
      },
      // {
      //   id: 'pop-6',
      //   title: '伊豆の踊子',
      //   author: '川端康成',
      //   cover_url: 'https://m.media-amazon.com/images/I/61gtcnK18-L._AC_UL480_FMwebp_QL65_.jpg',
      //   description: '旅芸人の踊子との淡い恋を描いた青春小説',
      //   category: 'popular',
      //   isPublicDomain: false
      // },
    ]
  },
  classics: {
    title: '📚 Classic Masterpieces',
    subtitle: '日本文学の名作',
    books: [
      {
        id: 'cls-1',
        title: '吾輩は猫である',
        author: '夏目漱石',
        cover_url: 'https://m.media-amazon.com/images/I/71mrYjYkw7L._AC_UL480_FMwebp_QL65_.jpg',
        description: '猫の視点から人間社会を風刺した長編小説',
        category: 'classics',
        isPublicDomain: false
      },
      {
        id: 'cls-2',
        title: '銀河鉄道の夜',
        author: '宮沢賢治',
        cover_url: 'https://m.media-amazon.com/images/I/71hF1DDSHaL._AC_UL480_FMwebp_QL65_.jpg',
        description: '少年ジョバンニの幻想的な銀河鉄道の旅を描いた童話',
        category: 'classics',
        isPublicDomain: false
      },
      {
        id: 'cls-3',
        title: '羅生門',
        author: '芥川龍之介',
        cover_url: 'https://m.media-amazon.com/images/I/71G17az7Y-L._AC_UL480_FMwebp_QL65_.jpg',
        description: '平安時代の羅生門を舞台に人間のエゴイズムを描く',
        category: 'classics',
        isPublicDomain: false
      },
      {
        id: 'cls-4',
        title: '蜘蛛の糸',
        author: '芥川龍之介',
        cover_url: 'https://m.media-amazon.com/images/I/71MQHZ5F7aL._AC_UL480_FMwebp_QL65_.jpg',
        description: '地獄に落ちた男が蜘蛛の糸を登ろうとする物語',
        category: 'classics',
        isPublicDomain: false
      },
      {
        id: 'cls-5',
        title: '舞姫',
        author: '森鴎外',
        cover_url: 'https://m.media-amazon.com/images/I/513M3302GEL._AC_UL480_FMwebp_QL65_.jpg',
        description: 'ドイツ留学中の日本人青年の悲恋を描いた作品',
        category: 'classics',
        isPublicDomain: false
      },
      // {
      //   id: 'cls-6',
      //   title: '山月記',
      //   author: '中島敦',
      //   cover_url: 'https://m.media-amazon.com/images/I/71oAje5bxYL._AC_UL480_FMwebp_QL65_.jpg',
      //   description: '詩人が虎に変身する中国の伝説を基にした短編',
      //   category: 'classics',
      //   isPublicDomain: false
      // },
    ]
  },
  mystery: {
    title: '🕵️ Mystery & Detective',
    subtitle: 'ミステリー・推理小説',
    books: [
      {
        id: 'mys-1',
        title: '十角館の殺人',
        author: '綾辻行人',
        cover_url: 'https://m.media-amazon.com/images/I/81IJXzdIndL._AC_UL480_FMwebp_QL65_.jpg',
        description: '孤島の館で起こる連続殺人事件',
        category: 'mystery',
        isPublicDomain: false
      },
      {
        id: 'mys-2',
        title: '容疑者Xの献身',
        author: '東野圭吾',
        cover_url: 'https://m.media-amazon.com/images/I/71+DGasBeuL._AC_UL480_FMwebp_QL65_.jpg',
        description: '天才数学者による完全犯罪の謎',
        category: 'mystery',
        isPublicDomain: false
      },
      {
        id: 'mys-3',
        title: '火車',
        author: '宮部みゆき',
        cover_url: 'https://m.media-amazon.com/images/I/71x5jDZfNoL._AC_UL480_FMwebp_QL65_.jpg',
        description: '失踪した女性の謎を追う社会派ミステリー',
        category: 'mystery',
        isPublicDomain: false
      },
    ]
  },
  romance: {
    title: '💖 Romance',
    subtitle: '恋愛・ロマンス',
    books: [
      {
        id: 'rom-1',
        title: '君の名は。',
        author: '新海誠',
        cover_url: 'https://m.media-amazon.com/images/I/71VsVSYmegL._AC_UL480_FMwebp_QL65_.jpg',
        description: '時空を超えた二人の奇跡的な恋の物語',
        category: 'romance',
        isPublicDomain: false
      },
      {
        id: 'rom-2',
        title: 'ナミヤ雑貨店の奇蹟',
        author: '東野圭吾',
        cover_url: 'https://m.media-amazon.com/images/I/81WYIvrWsEL._AC_UL480_FMwebp_QL65_.jpg',
        description: '時を超えた手紙が繋ぐ人々の想い',
        category: 'romance',
        isPublicDomain: false
      },
      {
        id: 'rom-3',
        title: '恋愛中毒',
        author: '山本文緒',
        cover_url: 'https://m.media-amazon.com/images/I/614ueDxSvpL._AC_UL480_FMwebp_QL65_.jpg',
        description: '愛に溺れる女性の心理を描いた恋愛小説',
        category: 'romance',
        isPublicDomain: false
      },
    ]
  },
  scifi: {
    title: '🚀 Sci-Fi & Fantasy',
    subtitle: 'SF・ファンタジー',
    books: [
      {
        id: 'sf-1',
        title: '新世界より',
        author: '貴志祐介',
        cover_url: 'https://m.media-amazon.com/images/I/91AsNkqL7IL._AC_UL480_FMwebp_QL65_.jpg',
        description: '千年後の日本を舞台にした壮大なSF',
        category: 'scifi',
        isPublicDomain: false
      },
      {
        id: 'sf-2',
        title: '虐殺器官',
        author: '伊藤計劃',
        cover_url: 'https://m.media-amazon.com/images/I/81aSkGUDhxL._AC_UL480_FMwebp_QL65_.jpg',
        description: '近未来の戦争と言語の謎を描くSFスリラー',
        category: 'scifi',
        isPublicDomain: false
      },
    ]
  }
};

export default function BooksPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [aozoraBooks, setAozoraBooks] = useState<Book[]>([]);
  const [loadingAozora, setLoadingAozora] = useState(true);

  useEffect(() => {
    fetchAozoraBooks();
  }, []);

  const fetchAozoraBooks = async () => {
    try {
      setLoadingAozora(true);
      const { data, error } = await supabase
        .from('aozora_books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const books: Book[] = data.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url || '',
        description: book.description || '',
        isPublicDomain: book.is_free,
      }));

      setAozoraBooks(books);
    } catch (error) {
      console.error('❌ 青空文庫の本の取得エラー:', error);
    } finally {
      setLoadingAozora(false);
    }
  };

  const searchBooks = async (loadMore = false) => {
    if (!searchQuery.trim()) {
      setIsShowingSearchResults(false);
      setSearchResults([]);
      return;
    }

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setIsSearching(true);
      setCurrentPage(0);
    }

    try {
      const startIndex = loadMore ? (currentPage + 1) * 12 : 0;
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}`
      );
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data = await response.json();
      
      const books: Book[] = data.books.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.authors?.join(', ') || '不明な著者',
        cover_url: book.thumbnail || '',
        description: book.description || '',
        price: book.price,
        buyLink: book.buyLink,
        isPublicDomain: book.isPublicDomain,
        previewLink: book.previewLink
      }));

      if (loadMore) {
        setSearchResults(prev => [...prev, ...books]);
        setCurrentPage(prev => prev + 1);
      } else {
        setSearchResults(books);
        setIsShowingSearchResults(true);
        setCurrentPage(0);
      }
      
      setTotalResults(data.totalItems || 0);
    } catch (error) {
      console.error('検索エラー:', error);
      alert('本の検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
      setLoadingMore(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === '') {
      setIsShowingSearchResults(false);
      setSearchResults([]);
    }
  };

  const addToBookshelf = async (book: Book, status: string) => {
    if (!isLoggedIn) {
      alert('ログインしてください');
      router.push('/login');
      return;
    }

    try {
      setAdding(book.id);

      const bookData = {
        user_id: user?.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        status: status,
        aozora_book_id: book.isPublicDomain ? book.id : null,
        preview_link: book.previewLink || null,
        buy_link: book.buyLink || null,
      };

      const { data, error } = await supabase
        .from('bookshelves')
        .insert([bookData]);

      if (error) throw error;

      alert(`「${book.title}」を本棚に追加しました！`);
      setShowStatusModal(false);
      setSelectedBook(null);
    } catch (error) {
      console.error('本棚への追加エラー:', error);
      alert('本棚への追加に失敗しました');
    } finally {
      setAdding(null);
    }
  };

  const openStatusModal = (book: Book) => {
    if (!isLoggedIn) {
      alert('ログインしてください');
      router.push('/login');
      return;
    }
    setSelectedBook(book);
    setShowStatusModal(true);
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
      'from-cyan-300 via-cyan-400 to-cyan-500',
      'from-sky-300 via-sky-400 to-sky-500'
    ];
    
    const gradient = gradients[index % gradients.length];
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-6xl">📕</span>
      </div>
    );
  };

  const BookCard = ({ book, index }: { book: Book; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.05 }}
      onClick={() => setSelectedBook(book)}
      className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
    >
      {/* 本の表紙 - より大きく */}
      <div className="aspect-[3/4] overflow-hidden relative">
        {getBookCover(book, index)}
        
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <div className="text-white">
            <p className="text-sm font-semibold">Click to see details</p>
          </div>
        </div>

        {/* Free バッジ */}
        {book.isPublicDomain && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-emerald-600 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
              ✨ FREE
            </span>
          </div>
        )}

        {/* Price バッジ */}
        {book.price && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full font-bold shadow-lg" style={{ color: '#A0C878' }}>
              ¥{book.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* タイトルと著者 - シンプルに */}
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A0C878] transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600">{book.author}</p>
      </div>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Book Library
          </h1>
          <p className="text-xl text-gray-600">お気に入りの本を見つけよう</p>
        </motion.div>

        {/* 検索バー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex gap-4">
            <div className="relative flex-1">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Search books by title or author..."
                className="w-full px-16 py-5 bg-white rounded-2xl focus:outline-none transition text-lg shadow-md border-2 focus:border-[#A0C878]"
                style={{ 
                  borderColor: '#e5e7eb',
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => searchBooks()}
              disabled={isSearching}
              className="px-10 py-5 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              }}
            >
              {isSearching ? '検索中...' : 'Search'}
            </motion.button>
          </div>
        </motion.div>

        {isShowingSearchResults ? (
          <div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-gray-900 mb-8"
            >
              Search Results: 「{searchQuery}」 
              <span className="text-xl text-gray-500 ml-3">{totalResults} books</span>
            </motion.h2>
            
            {searchResults.length > 0 ? (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8"
                >
                  {searchResults.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </motion.div>

                {searchResults.length < totalResults && (
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => searchBooks(true)}
                      disabled={loadingMore}
                      className="px-10 py-4 bg-white text-lg rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 border-2"
                      style={{
                        borderColor: '#A0C878',
                        color: '#7B9E5F',
                      }}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </motion.button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-500 text-xl">No books found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {/* 青空文庫 */}
            {aozoraBooks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#7B9E5F' }}>
                    📖 Aozora Bunko
                  </h2>
                  <p className="text-gray-600">青空文庫 - {aozoraBooks.length}冊の名作</p>
                </div>
                {loadingAozora ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                  >
                    {aozoraBooks.map((book, index) => (
                      <BookCard key={book.id} book={book} index={index} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* カテゴリー別 */}
            {Object.entries(BOOK_CATEGORIES).map(([key, category], catIndex) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + catIndex * 0.1 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#7B9E5F' }}>
                    {category.title}
                  </h2>
                  <p className="text-gray-600">{category.subtitle} - {category.books.length}冊</p>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                >
                  {category.books.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* 本の詳細モーダル */}
      {selectedBook && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedBook(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 本の情報 */}
            <div className="p-8">
              <div className="flex gap-6 mb-6">
                {/* 表紙画像 */}
                <div className="w-48 flex-shrink-0">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                    {getBookCover(selectedBook, 0)}
                  </div>
                </div>

                {/* 詳細情報 */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-gray-900">{selectedBook.title}</h2>
                  <p className="text-xl text-gray-600 mb-4">{selectedBook.author}</p>

                  {/* バッジ */}
                  <div className="flex gap-2 mb-4">
                    {selectedBook.isPublicDomain && (
                      <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-sm px-4 py-2 rounded-full font-bold">
                        ✨ Free to Read
                      </span>
                    )}
                    {selectedBook.price && (
                      <span className="text-2xl font-bold" style={{ color: '#A0C878' }}>
                        ¥{selectedBook.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* 説明 */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">About this book:</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedBook.description}</p>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="space-y-3 border-t pt-6">
                {selectedBook.isPublicDomain && (
                  <Link
                    href={`/reader/${selectedBook.id}`}
                    className="block w-full px-6 py-4 text-white rounded-2xl text-center text-lg font-bold transition-all shadow-lg hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    📖 Read Now
                  </Link>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowStatusModal(true)}
                  disabled={adding === selectedBook.id}
                  className={`w-full px-6 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg ${
                    adding === selectedBook.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-white border-2 hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: adding === selectedBook.id ? '#e5e7eb' : '#A0C878',
                    color: adding === selectedBook.id ? '#6b7280' : '#7B9E5F',
                  }}
                >
                  {adding === selectedBook.id ? '追加中...' : '📚 Add to My Library'}
                </motion.button>

                {selectedBook.buyLink && (
                  <a
                    href={selectedBook.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 text-center text-lg font-bold transition-all shadow-lg"
                  >
                    🛒 Buy this Book
                  </a>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedBook(null)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-semibold transition-all"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ステータス選択モーダル */}
      {showStatusModal && selectedBook && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setShowStatusModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{selectedBook.title}</h2>
            <p className="text-gray-600 mb-6">Choose reading status:</p>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  addToBookshelf(selectedBook, 'want_to_read');
                  setShowStatusModal(false);
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-2xl text-left transition-all flex items-center gap-4"
              >
                <span className="text-3xl">📚</span>
                <div>
                  <div className="font-bold text-gray-900">Want to Read</div>
                  <div className="text-sm text-gray-600">読みたい本</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  addToBookshelf(selectedBook, 'reading');
                  setShowStatusModal(false);
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200 border-2 border-emerald-200 rounded-2xl text-left transition-all flex items-center gap-4"
              >
                <span className="text-3xl">📖</span>
                <div>
                  <div className="font-bold text-gray-900">Currently Reading</div>
                  <div className="text-sm text-gray-600">今読んでいる本</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  addToBookshelf(selectedBook, 'read');
                  setShowStatusModal(false);
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-2xl text-left transition-all flex items-center gap-4"
              >
                <span className="text-3xl">✅</span>
                <div>
                  <div className="font-bold text-gray-900">Finished</div>
                  <div className="text-sm text-gray-600">読み終わった本</div>
                </div>
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowStatusModal(false)}
              className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-semibold transition-all"
            >
              Cancel
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
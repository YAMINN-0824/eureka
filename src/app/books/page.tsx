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
    title: '🔥 人気の日本文学',
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
      {
        id: 'pop-6',
        title: '伊豆の踊子',
        author: '川端康成',
        cover_url: 'https://m.media-amazon.com/images/I/61gtcnK18-L._AC_UL480_FMwebp_QL65_.jpg',
        description: '旅芸人の踊子との淡い恋を描いた青春小説',
        category: 'popular',
        isPublicDomain: false
      },
    ]
  },
  classics: {
    title: '📚 日本文学の名作',
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
      {
        id: 'cls-6',
        title: '山月記',
        author: '中島敦',
        cover_url: 'https://m.media-amazon.com/images/I/71oAje5bxYL._AC_UL480_FMwebp_QL65_.jpg',
        description: '詩人が虎に変身する中国の伝説を基にした短編',
        category: 'classics',
        isPublicDomain: false
      },
    ]
  },
  mystery: {
    title: '🕵️ ミステリー・推理小説',
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
    title: '💖 恋愛・ロマンス',
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
    title: '🚀 SF・ファンタジー',
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

  // ✨ 修正：本棚に追加する時に追加情報も保存
const addToBookshelf = async (book: Book, status: string) => {
  if (!isLoggedIn) {
    alert('ログインが必要です');
    router.push('/login');
    return;
  }

  try {
    setAdding(book.id);

    // ✨ デバッグ：送信するデータを確認
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

    console.log('📤 送信するデータ:', bookData);

    const { data, error } = await supabase
      .from('bookshelves')
      .insert([bookData]);

    if (error) {
      console.error('❌ エラーの詳細:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      console.error('エラー詳細:', error.details);
      throw error;
    }

    console.log('✅ 成功:', data);
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
      alert('ログインが必要です');
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
      'from-blue-300 via-blue-400 to-blue-500',
      'from-purple-300 via-purple-400 to-purple-500',
      'from-pink-300 via-pink-400 to-pink-500',
      'from-green-300 via-green-400 to-green-500',
      'from-orange-300 via-orange-400 to-orange-500',
      'from-red-300 via-red-400 to-red-500'
    ];
    
    const gradient = gradients[index % gradients.length];
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-6xl">📕</span>
      </div>
    );
  };

  const BookCard = ({ book, index }: { book: Book; index: number }) => (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition hover:-translate-y-1">
      <div className="aspect-[2/3] overflow-hidden">
        {getBookCover(book, index)}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-500 mb-2">{book.author}</p>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{book.description}</p>
        
        {book.isPublicDomain && (
          <div className="mb-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              📖 無料で読める
            </span>
          </div>
        )}

        {book.price && (
          <p className="text-sm font-bold text-blue-600 mb-2">
            ¥{book.price.toLocaleString()}
          </p>
        )}
        
        <div className="space-y-2">
          {book.isPublicDomain && (
            <Link
              href={`/reader/${book.id}`}
              className="block w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-center text-sm font-semibold transition"
            >
              📖 読む
            </Link>
          )}
          
          <button
            onClick={() => openStatusModal(book)}
            disabled={adding === book.id}
            className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition ${
              adding === book.id
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {adding === book.id ? '追加中...' : '📚 本棚に追加'}
          </button>

          {book.buyLink && (
            <a
              href={book.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center text-sm font-semibold transition"
            >
              🛒 購入
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📖 本を探す</h1>
          <p className="text-gray-600">お気に入りの本を見つけて本棚に追加しましょう</p>
        </div>

        <div className="mb-8 flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
            placeholder="🔍 本のタイトルや著者名で検索..."
            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition text-lg"
          />
          <button
            onClick={() => searchBooks()}
            disabled={isSearching}
            className="px-8 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition font-semibold disabled:opacity-50"
          >
            {isSearching ? '検索中...' : '検索'}
          </button>
        </div>

        {isShowingSearchResults ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              検索結果: 「{searchQuery}」 {totalResults}件
            </h2>
            
            {searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                  {searchResults.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </div>

                {searchResults.length < totalResults && (
                  <div className="text-center">
                    <button
                      onClick={() => searchBooks(true)}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-semibold disabled:opacity-50"
                    >
                      {loadingMore ? '読み込み中...' : 'もっと読み込む'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">検索結果が見つかりませんでした</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {aozoraBooks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📖 青空文庫 ({aozoraBooks.length}冊)
                </h2>
                {loadingAozora ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">読み込み中...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {aozoraBooks.map((book, index) => (
                      <BookCard key={book.id} book={book} index={index} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {Object.entries(BOOK_CATEGORIES).map(([key, category]) => (
              <div key={key}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.title} ({category.books.length}冊)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {category.books.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {showStatusModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-2">{selectedBook.title}</h2>
            <p className="text-gray-500 mb-6">{selectedBook.author}</p>

            <h3 className="font-semibold text-gray-700 mb-4">読書状態を選択してください：</h3>

            <div className="space-y-3">
              <button
                onClick={() => addToBookshelf(selectedBook, 'want_to_read')}
                className="w-full px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl text-left transition flex items-center gap-3"
              >
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-semibold text-gray-900">読みたい</div>
                  <div className="text-sm text-gray-500">後で読む予定の本</div>
                </div>
              </button>

              <button
                onClick={() => addToBookshelf(selectedBook, 'reading')}
                className="w-full px-6 py-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl text-left transition flex items-center gap-3"
              >
                <span className="text-2xl">📖</span>
                <div>
                  <div className="font-semibold text-gray-900">読んでる</div>
                  <div className="text-sm text-gray-500">今読んでいる本</div>
                </div>
              </button>

              <button
                onClick={() => addToBookshelf(selectedBook, 'read')}
                className="w-full px-6 py-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl text-left transition flex items-center gap-3"
              >
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-gray-900">読んだ</div>
                  <div className="text-sm text-gray-500">読み終わった本</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedBook(null);
              }}
              className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




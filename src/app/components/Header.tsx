'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

export default function Header() {
  const { isLoggedIn, logout, user } = useAuth();
  const [showExploreMenu, setShowExploreMenu] = useState(false);
  const [showMyPageMenu, setShowMyPageMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link href="/" className="text-2xl font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition">
            <span className="text-3xl">📚</span> 
            <span>Eureka</span>
          </Link>

          <div className="flex gap-4 items-center">
            
            {/* 探すメニュー */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowExploreMenu(true)}
                onMouseLeave={() => setShowExploreMenu(false)}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition flex items-center gap-2 font-medium"
              >
                <span>🔍</span>
                <span>探す</span>
                <span className="text-xs">▼</span>
              </button>

              {showExploreMenu && (
                <div
                  onMouseEnter={() => setShowExploreMenu(true)}
                  onMouseLeave={() => setShowExploreMenu(false)}
                  className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border py-2 z-50"
                >
                  <Link
                    href="/books"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                  >
                    <span className="text-xl">📖</span>
                    <div>
                      <div className="font-medium">本を探す</div>
                      <div className="text-xs text-gray-500">青空文庫</div>
                    </div>
                  </Link>
                  <Link
                    href="/stories"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                  >
                    <span className="text-xl">✍️</span>
                    <div>
                      <div className="font-medium">作品を探す</div>
                      <div className="text-xs text-gray-500">ユーザー作品</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <>
                {/* マイページメニュー */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowMyPageMenu(true)}
                    onMouseLeave={() => setShowMyPageMenu(false)}
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition flex items-center gap-2 font-medium"
                  >
                    <span>👤</span>
                    <span>マイページ</span>
                    <span className="text-xs">▼</span>
                  </button>

                  {showMyPageMenu && (
                    <div
                      onMouseEnter={() => setShowMyPageMenu(true)}
                      onMouseLeave={() => setShowMyPageMenu(false)}
                      className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border py-2 z-50"
                    >
                      <Link
                        href="/write"
                        className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition flex items-center gap-3 border-b"
                      >
                        <span className="text-xl">✨</span>
                        <div>
                          <div className="font-bold text-blue-600">新しい作品を書く</div>
                          <div className="text-xs text-gray-500">執筆を始める</div>
                        </div>
                      </Link>
                      <Link
                        href="/my-bookshelf"
                        className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                      >
                        <span className="text-xl">📖</span>
                        <div>
                          <div className="font-medium">私の本棚</div>
                          <div className="text-xs text-gray-500">読書記録</div>
                        </div>
                      </Link>
                      <Link
                        href="/my-stories"
                        className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                      >
                        <span className="text-xl">✍️</span>
                        <div>
                          <div className="font-medium">私の作品</div>
                          <div className="text-xs text-gray-500">執筆・管理</div>
                        </div>
                      </Link>
                      <Link
                        href="/vocabulary"
                        className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                      >
                        <span className="text-xl">📚</span>
                        <div>
                          <div className="font-medium">私の単語帳</div>
                          <div className="text-xs text-gray-500">学習記録</div>
                        </div>
                      </Link>
                      <div className="border-t my-2"></div>
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                      >
                        <span className="text-xl">⚙️</span>
                        <div>
                          <div className="font-medium">プロフィール</div>
                          <div className="text-xs text-gray-500">設定</div>
                        </div>
                      </Link>
                      {user && (
                        <Link
                          href={`/author/${user.id}`}
                          className="block px-4 py-3 text-gray-700 hover:bg-blue-50 transition flex items-center gap-3"
                        >
                          <span className="text-xl">🎨</span>
                          <div>
                            <div className="font-medium">作家ページ</div>
                            <div className="text-xs text-gray-500">公開プロフィール</div>
                          </div>
                        </Link>
                      )}
                      <div className="border-t my-2"></div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition flex items-center gap-3"
                      >
                        <span className="text-xl">🚪</span>
                        <div className="font-medium">ログアウト</div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="px-5 py-2 text-blue-600 hover:text-blue-700 transition font-medium"
                >
                  ログイン
                </Link>
                <Link 
                  href="/register"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
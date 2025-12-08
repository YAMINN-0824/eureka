'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { isLoggedIn, logout, user } = useAuth();
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);

  // サイドバーの外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      if (
        showSidebar &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        hamburger &&
        !hamburger.contains(e.target as Node)
      ) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar]);

  const menuItems = [
    { icon: '🏠', label: 'Home', href: '/', subtitle: 'ホーム' },
    { icon: '📖', label: 'Books', href: '/books', subtitle: '本を探す' },
    { icon: '✍️', label: 'Stories', href: '/stories', subtitle: '作品を読む' },
    { icon: '👥', label: 'Authors', href: '/authors', subtitle: '著者を探す' },
  ];

  const myPageItems = isLoggedIn ? [
    { icon: '✨', label: 'Write', href: '/write', subtitle: '作品を書く', highlight: true },
    { icon: '📚', label: 'My Library', href: '/my-bookshelf', subtitle: '私の本棚' },
    { icon: '📝', label: 'My Stories', href: '/my-stories', subtitle: '私の作品' },
    { icon: '📖', label: 'My Vocabulary', href: '/vocabulary', subtitle: '私の単語帳' },
  ] : [];

  const settingsItems = isLoggedIn ? [
    { icon: '⚙️', label: 'Profile', href: '/profile', subtitle: 'プロフィール' },
    { icon: '🎨', label: 'My Author Page', href: `/authors/${user?.id}`, subtitle: '私の作家ページ' },
  ] : [];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ヘッダー */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* 左側: ハンバーガー + ロゴ */}
            <div className="flex items-center gap-4">
              {/* ハンバーガーメニュー */}
              <button
                id="hamburger"
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <motion.div
                  animate={showSidebar ? 'open' : 'closed'}
                  className="w-6 h-6 flex flex-col justify-center gap-1"
                >
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: 45, y: 8 },
                    }}
                    className="w-full h-0.5 rounded-full transition-all"
                    style={{ backgroundColor: '#A0C878' }}
                  />
                  <motion.span
                    variants={{
                      closed: { opacity: 1 },
                      open: { opacity: 0 },
                    }}
                    className="w-full h-0.5 rounded-full transition-all"
                    style={{ backgroundColor: '#A0C878' }}
                  />
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: -45, y: -8 },
                    }}
                    className="w-full h-0.5 rounded-full transition-all"
                    style={{ backgroundColor: '#A0C878' }}
                  />
                </motion.div>
              </button>

              {/* ロゴ */}
              <Link 
                href="/" 
                className="text-2xl font-bold text-gray-900 flex items-center gap-2 hover:opacity-80 transition"
              >
                <span className="text-3xl">📚</span>
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Eureka
                </span>
              </Link>
            </div>

            {/* 右側: ユーザーアクション */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  {/* 通知ベル */}
                  <button className="p-2 rounded-xl hover:bg-gray-100 transition-all relative">
                    <span className="text-2xl">🔔</span>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {/* アバター */}
                  <Link
                    href="/profile"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    <span className="text-lg">👤</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2 text-gray-700 hover:text-gray-900 transition font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* オーバーレイ */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* サイドバー */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            id="sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-72 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* ロゴ */}
              <Link
                href="/"
                onClick={() => setShowSidebar(false)}
                className="flex items-center gap-3 mb-8"
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  <span className="text-white text-2xl">📚</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Eureka
                </span>
              </Link>

              {/* メインメニュー */}
              <nav className="space-y-2 mb-6">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowSidebar(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? 'text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={
                      isActive(item.href)
                        ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                        : {}
                    }
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className={`text-xs ${isActive(item.href) ? 'text-white/80' : 'text-gray-500'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </Link>
                ))}
              </nav>

              {/* マイページセクション */}
              {isLoggedIn && (
                <>
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-4">
                      My Page
                    </h3>
                    <nav className="space-y-2">
                      {myPageItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowSidebar(false)}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                            isActive(item.href)
                              ? 'text-white shadow-md'
                              : item.highlight
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={
                            isActive(item.href)
                              ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                              : {}
                          }
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <div className={`font-bold ${item.highlight && !isActive(item.href) ? 'text-blue-700' : ''}`}>
                              {item.label}
                            </div>
                            <div className={`text-xs ${isActive(item.href) ? 'text-white/80' : 'text-gray-500'}`}>
                              {item.subtitle}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {/* 設定セクション */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <nav className="space-y-2">
                      {settingsItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowSidebar(false)}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                            isActive(item.href)
                              ? 'text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={
                            isActive(item.href)
                              ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                              : {}
                          }
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <div className="font-bold">{item.label}</div>
                            <div className={`text-xs ${isActive(item.href) ? 'text-white/80' : 'text-gray-500'}`}>
                              {item.subtitle}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {/* ログアウトボタン */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => {
                        logout();
                        setShowSidebar(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                    >
                      <span className="text-2xl">🚪</span>
                      <div className="font-bold text-left">Logout</div>
                    </button>
                  </div>
                </>
              )}

              {/* ログインしていない場合 */}
              {!isLoggedIn && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setShowSidebar(false)}
                    className="block w-full px-4 py-3 text-center bg-white border-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                    style={{ borderColor: '#A0C878' }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowSidebar(false)}
                    className="block w-full px-4 py-3 text-center text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
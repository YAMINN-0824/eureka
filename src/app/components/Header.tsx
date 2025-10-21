'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

export default function Header() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">📚</span> Eureka
          </Link>
          <div className="flex gap-6 items-center">
            <Link 
              href="/books"
              className="text-gray-700 hover:text-blue-600 transition flex items-center gap-2"
            >
              <span className="text-xl">🔍</span> 本を探す
            </Link>

            {isLoggedIn ? (
              <>
                <Link 
                  href="/my-bookshelf"
                  className="text-gray-700 hover:text-blue-600 transition flex items-center gap-2"
                >
                  <span className="text-xl">📖</span> 私の本棚
                </Link>
                
                <Link 
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600 transition flex items-center gap-2"
                >
                  <span className="text-xl">👤</span> プロフィール
                </Link>

                <button
                  onClick={logout}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="px-5 py-2 text-blue-600 hover:text-blue-700 transition"
                >
                  ログイン
                </Link>
                <Link 
                  href="/register"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
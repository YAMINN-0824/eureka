'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // アニメーション設定
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 背景のアニメーション円 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="max-w-5xl mx-auto"
        >
          {/* メインタイトル */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut' as const,
              }}
              className="inline-block text-8xl mb-6"
            >
              📚
            </motion.div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Eureka
            </h1>
            <p className="text-2xl text-gray-700 font-medium">
              あなただけの読書体験を
            </p>
          </motion.div>

          {/* ボタン */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-4 mb-20"
          >
            <Link href="/books">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
              >
                📖 本を探す
              </motion.button>
            </Link>
            <Link href="/stories">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
              >
                ✍️ 作品を読む
              </motion.button>
            </Link>
          </motion.div>

          {/* 特徴カード - Pinterestスタイル */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* カード1 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                rotateZ: 2,
                transition: { duration: 0.2 },
              }}
            >
              <Link href="/books">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer border border-white/50">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    📖
                  </motion.div>
                  <h3 className="font-bold text-2xl mb-3 text-gray-900">
                    青空文庫
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    名作文学を自由に読める
                    <br />
                    古語辞書で学習できる
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* カード2 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                rotateZ: -2,
                transition: { duration: 0.2 },
              }}
            >
              <Link href="/stories">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer border border-white/50">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    ✍️
                  </motion.div>
                  <h3 className="font-bold text-2xl mb-3 text-gray-900">
                    作品投稿
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    自分の作品を書いて公開
                    <br />
                    読者とつながる
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* カード3 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                rotateZ: 2,
                transition: { duration: 0.2 },
              }}
            >
              <Link href="/my-bookshelf">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer border border-white/50">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    📚
                  </motion.div>
                  <h3 className="font-bold text-2xl mb-3 text-gray-900">
                    マイページ
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    本棚、作品、単語帳
                    <br />
                    あなただけの空間
                  </p>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* 追加の特徴 - 2列グリッド */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-2 gap-6 mt-6"
          >
            {/* カード4 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 },
              }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow border border-blue-200">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-5xl"
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    🗺️
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-gray-900">
                      物語の舞台マップ
                    </h3>
                    <p className="text-gray-600 text-sm">
                      作品の舞台を地図で探索できる
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* カード5 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 },
              }}
            >
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow border border-purple-200">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-5xl"
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    💬
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-gray-900">
                      コメント機能
                    </h3>
                    <p className="text-gray-600 text-sm">
                      作家と読者がつながる
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* フッター */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-20 text-gray-500"
          >
            <p className="text-sm">
              © 2025 Eureka - あなたの読書体験をもっと豊かに
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      {/* 背景のアニメーション円 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-60"
          style={{ backgroundColor: '#A0C878' }}
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
          className="absolute top-40 right-10 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl opacity-50"
          style={{ backgroundColor: '#7B9E5F' }}
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
          className="absolute -bottom-20 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl opacity-40"
          style={{ backgroundColor: '#B5D89A' }}
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
          className="max-w-6xl mx-auto"
        >
          {/* メインタイトル */}
          <motion.div variants={itemVariants} className="text-center mb-16">
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
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              Eureka
            </h1>
            <p className="text-2xl text-gray-700 font-medium mb-4">
              Discover Your Reading Journey
            </p>
            <p className="text-lg text-gray-600">
              あなたの読書の旅をもっと楽しく
            </p>
          </motion.div>

          {/* ボタン */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-6 mb-24"
          >
            <Link href="/books">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 text-lg font-bold rounded-2xl shadow-2xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  color: 'white',
                }}
              >
                📖 Find Books
              </motion.button>
            </Link>
            <Link href="/stories">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-lg font-bold rounded-2xl shadow-2xl transition-all border-2"
                style={{
                  borderColor: '#A0C878',
                  color: '#7B9E5F',
                }}
              >
                ✍️ Read Stories
              </motion.button>
            </Link>
          </motion.div>

          {/* 特徴カード - 3列 */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            {/* カード1 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.08,
                rotateZ: 2,
                transition: { duration: 0.3 },
              }}
            >
              <Link href="/books">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-[#A0C878] h-full">
                  <motion.div
                    className="text-6xl mb-6"
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
                  <h3 className="font-bold text-2xl mb-4" style={{ color: '#7B9E5F' }}>
                    Classic Books
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    青空文庫の名作を読もう
                  </p>
                  <p className="text-sm text-gray-500">
                    日本の古い文学作品を自由に楽しめます
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* カード2 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.08,
                rotateZ: -2,
                transition: { duration: 0.3 },
              }}
            >
              <Link href="/stories">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-[#A0C878] h-full">
                  <motion.div
                    className="text-6xl mb-6"
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
                  <h3 className="font-bold text-2xl mb-4" style={{ color: '#7B9E5F' }}>
                    Write & Share
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    自分の作品を書いて公開しよう
                  </p>
                  <p className="text-sm text-gray-500">
                    誰でも作家になれる場所です
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* カード3 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.08,
                rotateZ: 2,
                transition: { duration: 0.3 },
              }}
            >
              <Link href="/my-bookshelf">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-[#A0C878] h-full">
                  <motion.div
                    className="text-6xl mb-6"
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
                  <h3 className="font-bold text-2xl mb-4" style={{ color: '#7B9E5F' }}>
                    My Library
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    あなただけの本棚を作ろう
                  </p>
                  <p className="text-sm text-gray-500">
                    読んだ本を記録して管理できます
                  </p>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* 追加の特徴 - 2列グリッド */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-2 gap-8 mb-20"
          >
            {/* カード4 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                x: 10,
                transition: { duration: 0.2 },
              }}
            >
              <Link href="/reader/1">
                <div 
                  className="rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(160, 200, 120, 0.1) 0%, rgba(123, 158, 95, 0.2) 100%)',
                  }}
                >
                  <div className="flex items-center gap-6">
                    <motion.div
                      className="text-6xl"
                      animate={{
                        y: [0, -8, 0],
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
                      <h3 className="font-bold text-2xl mb-2" style={{ color: '#7B9E5F' }}>
                        Story Map
                      </h3>
                      <p className="text-gray-600">
                        物語の場所を地図で見つけよう
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        作品の舞台を実際の地図で探索できます
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* カード5 */}
            <motion.div
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                x: -10,
                transition: { duration: 0.2 },
              }}
            >
              <Link href="/vocabulary">
                <div 
                  className="rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(160, 200, 120, 0.2) 0%, rgba(123, 158, 95, 0.1) 100%)',
                  }}
                >
                  <div className="flex items-center gap-6">
                    <motion.div
                      className="text-6xl"
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: 'easeInOut' as const,
                      }}
                    >
                      📝
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-2xl mb-2" style={{ color: '#7B9E5F' }}>
                        Word Collection
                      </h3>
                      <p className="text-gray-600">
                        難しい言葉を集めて学ぼう
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        古い日本語を楽しく学習できます
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* 統計セクション */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border-2"
            style={{ borderColor: '#A0C878' }}
          >
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: '#7B9E5F' }}>
              Join Our Community
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  style={{ color: '#A0C878' }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  1000+
                </motion.div>
                <p className="text-gray-600 font-medium">Classic Books</p>
                <p className="text-sm text-gray-500 mt-1">青空文庫の名作</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  style={{ color: '#A0C878' }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.2,
                    repeat: Infinity,
                  }}
                >
                  500+
                </motion.div>
                <p className="text-gray-600 font-medium">User Stories</p>
                <p className="text-sm text-gray-500 mt-1">みんなの作品</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  style={{ color: '#A0C878' }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.4,
                    repeat: Infinity,
                  }}
                >
                  10K+
                </motion.div>
                <p className="text-gray-600 font-medium">Words Learned</p>
                <p className="text-sm text-gray-500 mt-1">学んだ言葉</p>
              </motion.div>
            </div>
          </motion.div>

          {/* フッター */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16 text-gray-500"
          >
            <p className="text-sm">
              © 2025 Eureka - Making Reading More Enjoyable
            </p>
            <p className="text-xs mt-1">
              もっと楽しい読書体験を
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
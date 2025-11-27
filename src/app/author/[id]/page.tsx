'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface AuthorProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  author_bio: string | null;
  author_social_links: any;
}

interface Story {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  chapter_count?: number;
}

export default function AuthorPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const authorId = params.id as string;

  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    loadAuthor();
    if (user) {
      checkFollowStatus();
    }
  }, [authorId, user]);

  const loadAuthor = async () => {
    try {
      console.log('Loading author:', authorId);

      // 作家情報を取得（エラーが出てもOK）
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authorId)
        .maybeSingle(); // single() の代わりに maybeSingle() を使用

      console.log('Author query result:', { authorData, authorError });

      // プロフィールがない場合はデフォルト値を使う
      if (!authorData || authorError) {
        console.log('No profile found, using default values');
        setAuthor({
          user_id: authorId,
          username: 'Anonymous Author',
          avatar_url: null,
          bio: null,
          author_bio: null,
          author_social_links: null
        });
      } else {
        console.log('Profile found:', authorData);
        setAuthor(authorData);
      }

      // 作品を取得
      const { data: storiesData, error: storiesError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', authorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Stories fetch error:', storiesError);
        // エラーが出ても空配列で続行
        setStories([]);
      } else {
        console.log('Stories data:', storiesData);

        // 各作品の章数を取得
        const storiesWithChapters = await Promise.all(
          (storiesData || []).map(async (story) => {
            const { count } = await supabase
              .from('story_chapters')
              .select('*', { count: 'exact', head: true })
              .eq('story_id', story.id);

            return { ...story, chapter_count: count || 0 };
          })
        );

        setStories(storiesWithChapters);

        // 統計を計算
        const likes = storiesWithChapters.reduce((sum, s) => sum + (s.like_count || 0), 0);
        setTotalLikes(likes);
      }

      // フォロワー数を取得
      const { count } = await supabase
        .from('author_follows')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId);

      setFollowerCount(count || 0);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('ページの読み込みに失敗しました');
      // エラーが出てもページは表示する
      setAuthor({
        user_id: authorId,
        username: 'Unknown Author',
        avatar_url: null,
        bio: null,
        author_bio: null,
        author_social_links: null
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('author_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('author_id', authorId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Follow status check error:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    if (user.id === authorId) {
      toast.error('自分自身はフォローできません');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('author_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('author_id', authorId);

        setIsFollowing(false);
        setFollowerCount(Math.max(0, followerCount - 1));
        toast.success('フォローを解除しました');
      } else {
        await supabase
          .from('author_follows')
          .insert({ follower_id: user.id, author_id: authorId });

        setIsFollowing(true);
        setFollowerCount(followerCount + 1);
        toast.success('フォローしました!');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('フォローに失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Author not found</h2>
          <Link href="/stories" className="text-blue-600 hover:underline">
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Link href="/stories" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition">
            <span>←</span>
            <span>Back to Stories</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 作家プロフィール */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-10 mb-8"
        >
          <div className="flex gap-8 mb-6">
            {/* アバター */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-5xl">✍️</span>
                  </div>
                )}
              </div>
            </div>

            {/* 情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{author.username}</h1>
                <span className="px-4 py-2 rounded-full text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  ✍️ Author
                </span>
              </div>

              {/* 統計 */}
              <div className="flex items-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#A0C878' }}>
                    {stories.length}
                  </div>
                  <div className="text-gray-600 text-sm">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#A0C878' }}>
                    {followerCount}
                  </div>
                  <div className="text-gray-600 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#A0C878' }}>
                    {totalLikes}
                  </div>
                  <div className="text-gray-600 text-sm">Total Likes</div>
                </div>
              </div>

              {/* フォローボタン */}
              {user && user.id !== authorId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFollow}
                  className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'text-white hover:shadow-xl'
                  }`}
                  style={
                    !isFollowing
                      ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                      : {}
                  }
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </motion.button>
              )}

              {user && user.id === authorId && (
                <Link
                  href="/profile/edit"
                  className="inline-block px-8 py-3 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  ✏️ Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {(author.bio || author.author_bio) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📝 Bio</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {author.author_bio || author.bio}
              </p>
            </div>
          )}

          {/* SNSリンク */}
          {author.author_social_links && Object.keys(author.author_social_links).length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔗 Social Links</h3>
              <div className="flex gap-3">
                {author.author_social_links.twitter && (
                  <a
                    href={author.author_social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                  >
                    🐦 Twitter
                  </a>
                )}
                {author.author_social_links.instagram && (
                  <a
                    href={author.author_social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition font-medium"
                  >
                    📷 Instagram
                  </a>
                )}
                {author.author_social_links.website && (
                  <a
                    href={author.author_social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 作品一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-10"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
            📚 Stories
          </h2>

          {stories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">📝</div>
              <p className="text-gray-600 text-lg">まだ作品が投稿されていません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl border-2 border-gray-100 hover:border-[#A0C878] shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/story/${story.id}`)}
                >
                  {/* カバー画像 */}
                  <div className="relative h-48">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-6xl">📖</span>
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {story.synopsis}
                    </p>

                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span>📖</span>
                          <span className="font-semibold">{story.chapter_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💖</span>
                          <span className="font-semibold">{story.like_count}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(story.created_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
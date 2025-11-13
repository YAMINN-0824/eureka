'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthorProfile {
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  author_bio: string | null;
  author_social_links: any;
  created_at: string;
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
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    loadAuthor();
    if (user) {
      checkFollowStatus();
    }
  }, [authorId, user]);

  const loadAuthor = async () => {
    try {
      // 作家情報を取得
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authorId)
        .single();

      if (authorError) throw authorError;

      setAuthor(authorData);

      // 作品を取得
      const { data: storiesData, error: storiesError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', authorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

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
      const views = storiesWithChapters.reduce((sum, s) => sum + s.view_count, 0);
      const likes = storiesWithChapters.reduce((sum, s) => sum + s.like_count, 0);
      setTotalViews(views);
      setTotalLikes(likes);

      // フォロワー数を取得
      const { count } = await supabase
        .from('author_follows')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId);

      setFollowerCount(count || 0);

    } catch (error) {
      console.error('作家情報の読み込みエラー:', error);
      alert('作家情報の読み込みに失敗しました');
      router.push('/stories');
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
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // エラーは無視（フォローしていない）
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (user.id === authorId) {
      alert('自分自身はフォローできません');
      return;
    }

    try {
      if (isFollowing) {
        // フォロー解除
        await supabase
          .from('author_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('author_id', authorId);

        setIsFollowing(false);
        setFollowerCount(followerCount - 1);
        alert('フォローを解除しました');
      } else {
        // フォロー
        await supabase
          .from('author_follows')
          .insert({ follower_id: user.id, author_id: authorId });

        setIsFollowing(true);
        setFollowerCount(followerCount + 1);
        alert('フォローしました！');
      }
    } catch (error) {
      console.error('フォローエラー:', error);
      alert('フォローに失敗しました');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!author) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/stories" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
              <span>←</span>
              <span>作品一覧に戻る</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 作家プロフィール */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex gap-8 mb-6">
            {/* アバター */}
            <div className="flex-shrink-0">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.username}
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-5xl">✍️</span>
                </div>
              )}
            </div>

            {/* 情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{author.username}</h1>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                  ✍️ 作家
                </span>
              </div>

              {/* 統計 */}
              <div className="flex items-center gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{stories.length}</span>
                  <span className="text-gray-600">作品</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{followerCount}</span>
                  <span className="text-gray-600">フォロワー</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{totalViews}</span>
                  <span className="text-gray-600">総閲覧数</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{totalLikes}</span>
                  <span className="text-gray-600">総いいね</span>
                </div>
              </div>

              {/* フォローボタン */}
              {user && user.id !== authorId && (
                <button
                  onClick={toggleFollow}
                  className={`px-6 py-3 rounded-xl font-bold transition shadow-lg hover:shadow-xl ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                  }`}
                >
                  {isFollowing ? '✓ フォロー中' : '+ フォローする'}
                </button>
              )}

              {user && user.id === authorId && (
                <Link
                  href="/profile/edit"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-bold"
                >
                  ✏️ プロフィールを編集
                </Link>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {(author.bio || author.author_bio) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📝 自己紹介</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {author.author_bio || author.bio}
              </p>
            </div>
          )}

          {/* SNSリンク */}
          {author.author_social_links && Object.keys(author.author_social_links).length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔗 SNS</h3>
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
        </div>

        {/* 作品一覧 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 作品一覧</h2>

          {stories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600">まだ作品が投稿されていません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/story/${story.id}`}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden border"
                >
                  {/* カバー画像 */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">📖</span>
                      </div>
                    )}
                    
                    {/* ジャンルバッジ */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-white bg-opacity-90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-bold shadow-lg">
                        {story.genre}
                      </span>
                    </div>
                  </div>

                  {/* 作品情報 */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {story.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {story.synopsis}
                    </p>

                    {/* 統計 */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span>📖</span>
                          <span className="font-medium">{story.chapter_count}章</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👁️</span>
                          <span className="font-medium">{story.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💖</span>
                          <span className="font-medium">{story.like_count}</span>
                        </div>
                      </div>
                    </div>

                    {/* 公開日 */}
                    <div className="text-xs text-gray-400 mt-3">
                      {formatDate(story.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
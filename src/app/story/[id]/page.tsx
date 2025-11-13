'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Story {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  author_name?: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_title: string;
  content: string;
}

export default function StoryPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // コメント機能
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    loadStory();
    if (user) {
      checkLikeStatus();
      checkBookmarkStatus();
    }
    loadComments();
  }, [storyId, user]);

  useEffect(() => {
    // 閲覧数を増やす（初回のみ）
    if (story) {
      incrementViews();
    }
  }, [story]);

  const loadStory = async () => {
    try {
      // 作品情報を取得
      const { data: storyData, error: storyError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      // 下書きは作者以外見れない
      if (storyData.status === 'draft' && storyData.user_id !== user?.id) {
        alert('この作品は非公開です');
        router.push('/stories');
        return;
      }

      // 作者名を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', storyData.user_id)
        .single();

      setStory({
        ...storyData,
        author_name: profileData?.username || '匿名'
      });

      // 章を取得
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number');

      if (chaptersError) throw chaptersError;

      setChapters(chaptersData || []);
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
      alert('作品の読み込みに失敗しました');
      router.push('/stories');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_story_views', { story_uuid: storyId });
    } catch (error) {
      console.error('閲覧数の更新エラー:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('story_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // エラーは無視（いいねしていない）
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('story_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single();

      setIsBookmarked(!!data);
    } catch (error) {
      // エラーは無視（ブックマークしていない）
    }
  };

  const toggleLike = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    try {
      if (isLiked) {
        // いいねを解除
        await supabase
          .from('story_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);

        // カウントを減らす
        await supabase
          .from('user_stories')
          .update({ like_count: (story?.like_count || 1) - 1 })
          .eq('id', storyId);

        setIsLiked(false);
        if (story) {
          setStory({ ...story, like_count: story.like_count - 1 });
        }
      } else {
        // いいねを追加
        await supabase
          .from('story_likes')
          .insert({ user_id: user.id, story_id: storyId });

        // カウントを増やす
        await supabase
          .from('user_stories')
          .update({ like_count: (story?.like_count || 0) + 1 })
          .eq('id', storyId);

        setIsLiked(true);
        if (story) {
          setStory({ ...story, like_count: story.like_count + 1 });
        }
      }
    } catch (error) {
      console.error('いいねエラー:', error);
      alert('いいねに失敗しました');
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    try {
      if (isBookmarked) {
        // ブックマークを解除
        await supabase
          .from('story_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);

        setIsBookmarked(false);
        alert('ブックマークを解除しました');
      } else {
        // ブックマークを追加
        await supabase
          .from('story_bookmarks')
          .insert({ user_id: user.id, story_id: storyId });

        setIsBookmarked(true);
        alert('ブックマークしました！');
      }
    } catch (error) {
      console.error('ブックマークエラー:', error);
      alert('ブックマークに失敗しました');
    }
  };

  const loadComments = async () => {
    try {
      // まずコメントを取得
      const { data: commentsData, error: commentsError } = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('コメント取得エラー:', commentsError);
        return;
      }

      // 各コメントのユーザー情報を個別に取得
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profileData || { username: '匿名', avatar_url: null }
          };
        })
      );

      // コメントを親子関係で整理
      const parentComments = commentsWithProfiles.filter(c => !c.parent_comment_id);
      const commentsWithReplies = parentComments.map(parent => ({
        ...parent,
        replies: commentsWithProfiles.filter(c => c.parent_comment_id === parent.id)
      }));

      setComments(commentsWithReplies);
      setCommentCount(commentsData?.length || 0);
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
    }
  };

  const postComment = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (!commentContent.trim()) {
      alert('コメントを入力してください');
      return;
    }

    try {
      const { error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: user.id,
          content: commentContent.trim()
        });

      if (error) throw error;

      setCommentContent('');
      alert('コメントを投稿しました！');
      await loadComments();
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      alert('コメントの投稿に失敗しました');
    }
  };

  const postReply = async (parentCommentId: string) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (!replyContent.trim()) {
      alert('返信を入力してください');
      return;
    }

    try {
      const { error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: user.id,
          parent_comment_id: parentCommentId,
          content: replyContent.trim()
        });

      if (error) throw error;

      setReplyContent('');
      setReplyTo(null);
      alert('返信しました！');
      await loadComments();
    } catch (error) {
      console.error('返信エラー:', error);
      alert('返信に失敗しました');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('story_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      alert('削除しました！');
      await loadComments();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
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

  if (!story) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/stories" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
                <span>←</span>
                <span>作品一覧に戻る</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                  isLiked
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{isLiked ? '💖' : '🤍'}</span>
                <span>{story.like_count}</span>
              </button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2 font-medium text-gray-700">
                <span>💬</span>
                <span>{commentCount}</span>
              </div>
              <button
                onClick={toggleBookmark}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isBookmarked
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? '🔖' : '📑'} ブックマーク
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        
        {/* 作品情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex gap-6 mb-6">
            {/* カバー画像 */}
            <div className="flex-shrink-0">
              {story.cover_image_url ? (
                <img
                  src={story.cover_image_url}
                  alt={story.title}
                  className="w-48 h-72 object-cover rounded-xl shadow-lg"
                />
              ) : (
                <div className="w-48 h-72 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl shadow-lg flex items-center justify-center">
                  <span className="text-8xl">📖</span>
                </div>
              )}
            </div>

            {/* 情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-gray-900">{story.title}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                  {story.genre}
                </span>
              </div>

              <Link
                href={`/author/${story.user_id}`}
                className="flex items-center gap-2 mb-4 text-gray-600 hover:text-blue-600 transition"
              >
                <span>✍️</span>
                <span className="font-medium">{story.author_name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm">{formatDate(story.created_at)}</span>
              </Link>

              <p className="text-gray-700 mb-6 leading-relaxed">{story.synopsis}</p>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span>📖</span>
                  <span className="font-medium">{chapters.length}章</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👁️</span>
                  <span className="font-medium">{story.view_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💖</span>
                  <span className="font-medium">{story.like_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 章の選択 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📖 章を選ぶ</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setCurrentChapter(index)}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  currentChapter === index
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                第{chapter.chapter_number}章
              </button>
            ))}
          </div>
        </div>

        {/* 章の内容 */}
        {chapters[currentChapter] && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              第{chapters[currentChapter].chapter_number}章
            </h2>
            <h3 className="text-xl text-gray-600 mb-8">
              {chapters[currentChapter].chapter_title}
            </h3>

            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-lg">
                {chapters[currentChapter].content}
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t">
              {currentChapter > 0 ? (
                <button
                  onClick={() => setCurrentChapter(currentChapter - 1)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                >
                  ← 前の章
                </button>
              ) : (
                <div></div>
              )}

              {currentChapter < chapters.length - 1 ? (
                <button
                  onClick={() => setCurrentChapter(currentChapter + 1)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                >
                  次の章 →
                </button>
              ) : (
                <div className="text-gray-500 font-medium">
                  完 - 最終章
                </div>
              )}
            </div>
          </div>
        )}

        {/* コメントセクション */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>💬</span>
            <span>コメント ({commentCount})</span>
          </h2>

          {/* コメント投稿フォーム */}
          {user ? (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="コメントを書く..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={postComment}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                >
                  投稿する
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl text-center">
              <p className="text-gray-600 mb-4">コメントするにはログインが必要です</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
              >
                ログイン
              </Link>
            </div>
          )}

          {/* コメント一覧 */}
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600">まだコメントがありません</p>
              <p className="text-gray-500 text-sm">最初のコメントを書いてみましょう！</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6 last:border-b-0">
                  {/* メインコメント */}
                  <div className="flex gap-4">
                    {/* アバター */}
                    <Link href={`/author/${comment.user_id}`}>
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                    </Link>

                    {/* コメント内容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/author/${comment.user_id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 transition"
                        >
                          {comment.profiles?.username || '匿名'}
                        </Link>
                        {story?.user_id === comment.user_id && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            作者
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-gray-800 whitespace-pre-wrap mb-3">{comment.content}</p>

                      {/* アクション */}
                      <div className="flex items-center gap-4">
                        {user && (
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            💬 返信
                          </button>
                        )}
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            🗑️ 削除
                          </button>
                        )}
                      </div>

                      {/* 返信フォーム */}
                      {replyTo === comment.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="返信を書く..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyTo(null);
                                setReplyContent('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => postReply(comment.id)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                              返信する
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 返信一覧 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-8 space-y-4">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-3">
                              {/* 返信アバター */}
                              <Link href={`/author/${reply.user_id}`}>
                                {reply.profiles?.avatar_url ? (
                                  <img
                                    src={reply.profiles.avatar_url}
                                    alt={reply.profiles.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                                    <span className="text-lg">👤</span>
                                  </div>
                                )}
                              </Link>

                              {/* 返信内容 */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Link
                                    href={`/author/${reply.user_id}`}
                                    className="font-bold text-gray-900 hover:text-blue-600 transition text-sm"
                                  >
                                    {reply.profiles?.username || '匿名'}
                                  </Link>
                                  {story?.user_id === reply.user_id && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                      作者
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleDateString('ja-JP', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                <p className="text-gray-800 whitespace-pre-wrap text-sm mb-2">{reply.content}</p>

                                {/* 返信の削除 */}
                                {user && user.id === reply.user_id && (
                                  <button
                                    onClick={() => deleteComment(reply.id)}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                  >
                                    🗑️ 削除
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
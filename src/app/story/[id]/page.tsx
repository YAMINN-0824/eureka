'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Story {
  id: string;
  user_id: string;
  title: string;
  genre: string;
  synopsis: string;
  cover_image_url: string | null;
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
    if (story) {
      incrementViews();
    }
  }, [story]);

  const loadStory = async () => {
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('user_stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      if (storyData.status === 'draft' && storyData.user_id !== user?.id) {
        toast.error('この作品は非公開です');
        router.push('/stories');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', storyData.user_id)
        .single();

      setStory({
        ...storyData,
        author_name: profileData?.username || '匿名'
      });

      const { data: chaptersData, error: chaptersError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number');

      if (chaptersError) throw chaptersError;

      setChapters(chaptersData || []);
    } catch (error) {
      console.error('作品の読み込みエラー:', error);
      toast.error('作品の読み込みに失敗しました');
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
    } catch (error) {}
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
    } catch (error) {}
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('story_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);

        await supabase
          .from('user_stories')
          .update({ like_count: (story?.like_count || 1) - 1 })
          .eq('id', storyId);

        setIsLiked(false);
        if (story) {
          setStory({ ...story, like_count: story.like_count - 1 });
        }
      } else {
        await supabase
          .from('story_likes')
          .insert({ user_id: user.id, story_id: storyId });

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
      toast.error('いいねに失敗しました');
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    try {
      if (isBookmarked) {
        await supabase
          .from('story_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);
        setIsBookmarked(false);
        toast.success('ブックマークを解除しました');
      } else {
        await supabase
          .from('story_bookmarks')
          .insert({ user_id: user.id, story_id: storyId });
        setIsBookmarked(true);
        toast.success('ブックマークしました!');
      }
    } catch (error) {
      console.error('ブックマークエラー:', error);
      toast.error('ブックマークに失敗しました');
    }
  };

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('コメント取得エラー:', commentsError);
        return;
      }

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
      toast.error('ログインが必要です');
      return;
    }

    if (!commentContent.trim()) {
      toast.error('コメントを入力してください');
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
      toast.success('コメントを投稿しました!');
      await loadComments();
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      toast.error('コメントの投稿に失敗しました');
    }
  };

  const postReply = async (parentCommentId: string) => {
    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('返信を入力してください');
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
      toast.success('返信しました!');
      await loadComments();
    } catch (error) {
      console.error('返信エラー:', error);
      toast.error('返信に失敗しました');
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

      toast.success('削除しました!');
      await loadComments();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
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
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/stories" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition">
              <span>←</span>
              <span>Back to Stories</span>
            </Link>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLike}
                className={`px-5 py-2.5 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                  isLiked
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                }`}
              >
                <span>{isLiked ? '💖' : '🤍'}</span>
                <span>{story.like_count}</span>
              </motion.button>
              
              <div className="px-5 py-2.5 bg-white rounded-xl shadow-md flex items-center gap-2 font-semibold text-gray-700">
                <span>💬</span>
                <span>{commentCount}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleBookmark}
                className={`px-5 py-2.5 rounded-xl transition-all font-semibold ${
                  isBookmarked
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                }`}
                style={
                  isBookmarked
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                {isBookmarked ? '🔖 Saved' : '📑 Save'}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        
        {/* 作品情報カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-10 mb-8"
        >
          <div className="flex gap-8">
            {/* カバー画像 */}
            <div className="flex-shrink-0">
              <div className="w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                {story.cover_image_url ? (
                  <img
                    src={story.cover_image_url}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-8xl">📖</span>
                  </div>
                )}
              </div>
            </div>

            {/* 情報 */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 flex-1">{story.title}</h1>
                <span className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  {story.genre}
                </span>
              </div>

              <Link
                href={`/author/${story.user_id}`}
                className="flex items-center gap-2 mb-6 text-gray-600 hover:text-[#A0C878] transition-colors group"
              >
                <span>✍️</span>
                <span className="font-semibold group-hover:underline">{story.author_name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm">{formatDate(story.created_at)}</span>
              </Link>

              <p className="text-gray-700 mb-6 leading-relaxed text-lg">{story.synopsis}</p>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  <div>
                    <div className="font-bold text-2xl" style={{ color: '#A0C878' }}>{chapters.length}</div>
                    <div className="text-xs text-gray-500">Chapters</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💖</span>
                  <div>
                    <div className="font-bold text-2xl" style={{ color: '#A0C878' }}>{story.like_count}</div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 章の選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold mb-6" style={{ color: '#7B9E5F' }}>
            📖 Chapters
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {chapters.map((chapter, index) => (
              <motion.button
                key={chapter.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentChapter(index)}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  currentChapter === index
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  currentChapter === index
                    ? { background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)' }
                    : {}
                }
              >
                {chapter.chapter_number}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 章の内容 */}
        <AnimatePresence mode="wait">
          {chapters[currentChapter] && (
            <motion.div
              key={currentChapter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-xl p-10 mb-8"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Chapter {chapters[currentChapter].chapter_number}
                </h2>
                <h3 className="text-xl text-gray-600">
                  {chapters[currentChapter].chapter_title}
                </h3>
              </div>

              <div className="prose prose-lg max-w-none mb-10">
                <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-lg">
                  {chapters[currentChapter].content}
                </div>
              </div>

              {/* ナビゲーション */}
              <div className="flex items-center justify-between pt-8 border-t-2">
                {currentChapter > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentChapter(currentChapter - 1)}
                    className="px-8 py-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    ← Previous
                  </motion.button>
                ) : (
                  <div></div>
                )}

                {currentChapter < chapters.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentChapter(currentChapter + 1)}
                    className="px-8 py-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                    }}
                  >
                    Next →
                  </motion.button>
                ) : (
                  <div className="text-gray-500 font-semibold text-lg">
                    完 The End
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* コメントセクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-10"
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3" style={{ color: '#7B9E5F' }}>
            <span>💬</span>
            <span>Comments</span>
            <span className="text-xl text-gray-500">({commentCount})</span>
          </h2>

          {/* コメント投稿フォーム */}
          {user ? (
            <div className="mb-10 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none bg-white"
                rows={4}
              />
              <div className="flex justify-end mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={postComment}
                  className="px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                  }}
                >
                  Post Comment
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="mb-10 p-8 bg-gray-50 rounded-2xl text-center">
              <p className="text-gray-600 mb-4">ログインしてコメントしよう</p>
              <Link
                href="/login"
                className="inline-block px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                Login
              </Link>
            </div>
          )}

          {/* コメント一覧 */}
          {comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-4">💬</div>
              <p className="text-gray-600 text-lg">No comments yet</p>
              <p className="text-gray-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-8 last:border-b-0">
                  <div className="flex gap-4">
                    <Link href={`/author/${comment.user_id}`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md">
                        {comment.profiles?.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          href={`/author/${comment.user_id}`}
                          className="font-bold text-gray-900 hover:text-[#A0C878] transition"
                        >
                          {comment.profiles?.username || '匿名'}
                        </Link>
                        {story?.user_id === comment.user_id && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{
                              background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                            }}
                          >
                            Author
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-gray-800 whitespace-pre-wrap mb-4 leading-relaxed">{comment.content}</p>

                      <div className="flex items-center gap-4">
                        {user && (
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-sm font-semibold hover:text-[#A0C878] transition"
                            style={{ color: '#7B9E5F' }}
                          >
                            💬 Reply
                          </button>
                        )}
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>

                      {/* 返信フォーム */}
                      {replyTo === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-gray-50 rounded-xl"
                        >
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#A0C878] resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => {
                                setReplyTo(null);
                                setReplyContent('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => postReply(comment.id)}
                              className="px-6 py-2 text-white rounded-xl hover:shadow-lg transition font-semibold"
                              style={{
                                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* 返信一覧 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-6 ml-8 space-y-6">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-3">
                              <Link href={`/author/${reply.user_id}`}>
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md">
                                  {reply.profiles?.avatar_url ? (
                                    <img
                                      src={reply.profiles.avatar_url}
                                      alt={reply.profiles.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                                      <span className="text-lg">👤</span>
                                    </div>
                                  )}
                                </div>
                              </Link>

                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Link
                                    href={`/author/${reply.user_id}`}
                                    className="font-bold text-gray-900 hover:text-[#A0C878] transition text-sm"
                                  >
                                    {reply.profiles?.username || '匿名'}
                                  </Link>
                                  {story?.user_id === reply.user_id && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                      style={{
                                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                                      }}
                                    >
                                      Author
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleDateString('ja-JP', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                <p className="text-gray-800 whitespace-pre-wrap text-sm mb-2">{reply.content}</p>

                                {user && user.id === reply.user_id && (
                                  <button
                                    onClick={() => deleteComment(reply.id)}
                                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                                  >
                                    🗑️ Delete
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
        </motion.div>

      </div>
    </div>
  );
}
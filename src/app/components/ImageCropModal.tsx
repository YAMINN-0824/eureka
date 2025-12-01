'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (url: string) => void;
  userId: string;
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropModal({ 
  isOpen, 
  onClose, 
  onImageUploaded,
  userId 
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイル選択ハンドラー
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('JPG、PNG、WebP形式のみ対応しています');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setError(null);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  // トリミング完了時
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 画像をトリミングしてBlobに変換
  const createCroppedImage = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('画像が選択されていません');
    }

    const image = new Image();
    image.src = imageSrc;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context を取得できませんでした');
    }

    // 正方形の画像を作成
    const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  // アップロード処理
  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    setError(null);

    try {
      // トリミングした画像を取得
      const croppedBlob = await createCroppedImage();
      
      // ファイル名を生成（タイムスタンプ付き）
      const fileName = `${userId}-${Date.now()}.jpg`;
      
      // Supabase Storageにアップロード
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // プロフィールを更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // 親コンポーネントに通知
      onImageUploaded(publicUrl);
      
      // モーダルを閉じる
      handleClose();
      
    } catch (err) {
      console.error('アップロードエラー:', err);
      setError('アップロードに失敗しました。もう一度お試しください。');
    } finally {
      setUploading(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
                📷 プロフィール画像を変更
              </h2>
            </div>

            {/* コンテンツ */}
            <div className="p-8">
              {!imageSrc ? (
                // ファイル選択画面
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center mb-4">
                      <span className="text-6xl">🖼️</span>
                    </div>
                    <p className="text-gray-600 mb-2">
                      JPG、PNG、WebP形式（最大5MB）
                    </p>
                  </div>

                  <label className="inline-block cursor-pointer">
                    <div 
                      className="px-8 py-4 rounded-xl text-white font-bold hover:shadow-xl transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      }}
                    >
                      📁 ファイルを選択
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                // トリミング画面
                <div>
                  {/* トリミングエリア */}
                  <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden mb-6">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>

                  {/* ズームスライダー */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔍 ズーム
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #A0C878 0%, #A0C878 ${((zoom - 1) / 2) * 100}%, #e5e7eb ${((zoom - 1) / 2) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setImageSrc(null)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                      disabled={uploading}
                    >
                      ← 戻る
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 px-6 py-3 rounded-xl text-white font-bold hover:shadow-xl transition disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                      }}
                    >
                      {uploading ? '⏳ アップロード中...' : '✅ 保存'}
                    </button>
                  </div>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </div>

            {/* フッター */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-right">
              <button
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-800 font-semibold"
                disabled={uploading}
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
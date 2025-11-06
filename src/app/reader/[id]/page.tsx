'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import dynamic from 'next/dynamic';

// Leaflet を動的インポート（SSR対策）
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
}

interface WordDefinition {
  word: string;
  reading: string;
  old_meaning: string;
  modern_meaning: string;
  example: string;
  notes: string;
}

interface Location {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  description: string;
  character_name: string;
  photo_url?: string;
  place_id?: string;
  text_position?: number;
}

export default function ImprovedReaderPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  
  // ダイアログの状態
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  
  // データ
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [distance, setDistance] = useState<string>('');
  
  // 検索機能
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tempLocation, setTempLocation] = useState<any>(null); // 一時表示用

  useEffect(() => {
    if (id) {
      loadBook();
      loadLocations();
    }
  }, [id]);

  // Nominatim APIで場所を検索（一時表示のみ）
  const searchPlace = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=ja`
      );
      
      if (!response.ok) throw new Error('検索に失敗しました');
      
      const data = await response.json();
      
      if (data.length > 0) {
        const location = data[0];
        
        // 写真を取得（非同期）
        setTempLocation({ ...location, photoUrl: undefined });
        
        // Wikipedia写真を取得
        const photoUrl = await fetchWikipediaPhoto(location.display_name);
        
        // 写真URLを更新
        setTempLocation({ ...location, photoUrl });
        
        setSearchResults([]);
      } else {
        alert('場所が見つかりませんでした');
      }
    } catch (error) {
      console.error('場所検索エラー:', error);
      alert('場所の検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  // Wikipedia APIで写真を取得
  const fetchWikipediaPhoto = async (locationName: string): Promise<string | null> => {
    try {
      // 場所名をクリーンアップ（「金龍山 浅草寺」→「浅草寺」）
      const cleanName = locationName.split(/[,、]/)[0].trim();
      
      // Wikipedia検索
      const searchResponse = await fetch(
        `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`
      );
      
      if (!searchResponse.ok) return null;
      
      const searchData = await searchResponse.json();
      
      if (!searchData.query?.search || searchData.query.search.length === 0) {
        return null;
      }
      
      const pageTitle = searchData.query.search[0].title;
      
      // ページ情報と画像を取得
      const pageResponse = await fetch(
        `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=800&origin=*`
      );
      
      if (!pageResponse.ok) return null;
      
      const pageData = await pageResponse.json();
      const pages = pageData.query?.pages;
      
      if (!pages) return null;
      
      const page = Object.values(pages)[0] as any;
      
      return page.thumbnail?.source || null;
    } catch (error) {
      console.error('Wikipedia API エラー:', error);
      return null;
    }
  };

  // 場所をデータベースに保存
  const saveLocation = async () => {
    if (!tempLocation) return;

    try {
      // tempLocationに既に写真URLがある場合はそれを使用
      const photoUrl = tempLocation.photoUrl || null;

      const { data, error } = await supabase
        .from('book_locations')
        .insert([
          {
            book_id: id,
            location_name: tempLocation.display_name.split(',')[0], // 最初の部分だけ
            latitude: parseFloat(tempLocation.lat),
            longitude: parseFloat(tempLocation.lon),
            description: tempLocation.display_name,
            character_name: '',
            photo_url: photoUrl,
            place_id: tempLocation.place_id,
            order_index: locations.length
          }
        ]);

      if (error) throw error;

      alert('場所を保存しました！');
      setTempLocation(null);
      setSearchQuery('');
      await loadLocations();
    } catch (error) {
      console.error('場所保存エラー:', error);
      alert('場所の保存に失敗しました');
    }
  };

  // 場所を削除
  const deleteLocation = async (locationId: string) => {
    if (!confirm('この場所を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('book_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      alert('場所を削除しました！');
      await loadLocations();
    } catch (error) {
      console.error('場所削除エラー:', error);
      alert('場所の削除に失敗しました');
    }
  };

  // 場所をデータベースに追加（旧関数 - 削除）
  const calculateDistance = () => {
    if (locations.length < 2) return;

    const R = 6371; // 地球の半径（km）
    let totalDistance = 0;

    for (let i = 0; i < locations.length - 1; i++) {
      const lat1 = locations[i].latitude * Math.PI / 180;
      const lat2 = locations[i + 1].latitude * Math.PI / 180;
      const deltaLat = (locations[i + 1].latitude - locations[i].latitude) * Math.PI / 180;
      const deltaLng = (locations[i + 1].longitude - locations[i].longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      totalDistance += distance;
    }

    setDistance(`${totalDistance.toFixed(1)} km`);
  };

  useEffect(() => {
    if (locations.length > 1) {
      calculateDistance();
    }
  }, [locations]);

  const loadBook = async () => {
    try {
      const { data, error } = await supabase
        .from('aozora_books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('本の読み込みエラー:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('book_locations')
        .select('*')
        .eq('book_id', id)
        .order('order_index');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('場所の読み込みエラー:', error);
    }
  };

  // 言葉を選択したときの処理
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 20) {
      console.log('選択された言葉:', selectedText);
      
      // データベースから辞書を検索
      const { data, error } = await supabase
        .from('word_dictionary')
        .select('*')
        .eq('word', selectedText)
        .single();

      if (data) {
        console.log('辞書で見つかりました:', data);
        setSelectedWord(data);
        setShowTranslationDialog(true);
        setShowMapDialog(false);
      } else {
        console.log('辞書に見つかりませんでした');
        setSelectedWord({
          word: selectedText,
          reading: '',
          old_meaning: '辞書に登録されていません',
          modern_meaning: '',
          example: '',
          notes: 'この言葉はまだ辞書に追加されていません'
        });
        setShowTranslationDialog(true);
        setShowMapDialog(false);
      }
    }
  };

  const closeTranslationDialog = () => {
    setShowTranslationDialog(false);
    setSelectedWord(null);
    window.getSelection()?.removeAllRanges();
  };

  // 単語を単語帳に保存
  const saveWordToVocabulary = async () => {
    if (!selectedWord || !user) {
      alert('ログインが必要です');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .insert([
          {
            user_id: user.id,
            word: selectedWord.word,
            reading: selectedWord.reading,
            old_meaning: selectedWord.old_meaning,
            modern_meaning: selectedWord.modern_meaning,
            example: selectedWord.example,
            notes: selectedWord.notes,
            book_id: id,
            book_title: book?.title
          }
        ]);

      if (error) throw error;

      alert('💾 単語を保存しました！');
      closeTranslationDialog();
    } catch (error: any) {
      console.error('単語保存エラー:', error);
      
      // 重複エラーの場合
      if (error.code === '23505') {
        alert('この単語は既に保存されています');
      } else {
        alert('単語の保存に失敗しました');
      }
    }
  };

  const openMapDialog = () => {
    setShowMapDialog(true);
    setShowTranslationDialog(false);
  };

  const closeMapDialog = () => {
    setShowMapDialog(false);
  };

  const increaseFontSize = () => setFontSize((size) => Math.min(size + 2, 32));
  const decreaseFontSize = () => setFontSize((size) => Math.max(size - 2, 12));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!book) {
    return <div>本が見つかりません。</div>;
  }

  const showDialog = showTranslationDialog || showMapDialog;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      
      {/* ヘッダー */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/my-bookshelf" className="text-blue-600 hover:underline font-medium">
            ← 本棚に戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
          <span className="text-gray-500">- {book.author}</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 場所表示ボタン */}
          <button
            onClick={openMapDialog}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center gap-2"
          >
            🗺️ 物語の舞台
          </button>
          
          {/* 文字サイズ */}
          <div className="flex items-center gap-2">
            <button onClick={decreaseFontSize} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold">
              A-
            </button>
            <span className="text-sm w-12 text-center font-medium">{fontSize}px</span>
            <button onClick={increaseFontSize} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold">
              A+
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto p-8 bg-white relative">
        
        {/* 本文エリア - ダイアログがある時は右に余白 */}
        <div 
          className={`leading-relaxed mx-auto transition-all duration-300 ${
            showDialog ? 'max-w-3xl mr-[540px]' : 'max-w-4xl'
          }`}
          style={{ fontSize: `${fontSize}px` }}
          onMouseUp={handleTextSelection}
        >
          {book.content.split('\n').map((paragraph, index) => (
            paragraph.trim() && (
              <p key={index} className="mb-6 text-gray-800">
                {paragraph}
              </p>
            )
          ))}
        </div>

        {/* 翻訳ダイアログ */}
        {showTranslationDialog && selectedWord && (
          <div className="fixed top-24 right-8 w-[500px] max-h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl z-50 animate-slideInRight flex flex-col">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900">📚 {selectedWord.word}</h2>
                <button
                  onClick={closeTranslationDialog}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 ml-4"
                >
                  ×
                </button>
              </div>
              
              {selectedWord.reading && (
                <p className="text-gray-500 mb-6 text-xl">({selectedWord.reading})</p>
              )}
              
              {selectedWord.old_meaning && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-700 mb-3 text-lg flex items-center gap-2">
                    📚 明治時代の意味
                  </h4>
                  <p className="text-gray-800 text-lg leading-relaxed">{selectedWord.old_meaning}</p>
                </div>
              )}
              
              {selectedWord.modern_meaning && (
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border-l-4 border-green-500">
                  <h4 className="font-bold text-green-700 mb-3 text-lg flex items-center gap-2">
                    📖 現代の意味
                  </h4>
                  <p className="text-gray-800 text-lg leading-relaxed">{selectedWord.modern_meaning}</p>
                </div>
              )}
              
              {selectedWord.example && (
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-700 mb-3 text-lg flex items-center gap-2">
                    💡 例文
                  </h4>
                  <p className="text-gray-800 text-lg italic leading-relaxed">「{selectedWord.example}」</p>
                </div>
              )}
              
              {selectedWord.notes && (
                <div className="mb-6 text-sm text-gray-600 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="font-semibold">ℹ️ 補足：</span> {selectedWord.notes}
                </div>
              )}

              {/* 保存ボタン */}
              <button
                onClick={saveWordToVocabulary}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                💾 この単語を保存
              </button>
            </div>
          </div>
        )}

        {/* マップダイアログ */}
        {showMapDialog && (
          <div className="fixed top-24 right-8 w-[500px] max-h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl z-50 animate-slideInRight flex flex-col">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900">🗺️ 物語の舞台</h2>
                <button
                  onClick={closeMapDialog}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 ml-4"
                >
                  ×
                </button>
              </div>
              
              {/* 場所検索 */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchPlace()}
                    placeholder="場所を検索... (例: 浅草寺)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
                  />
                  <button
                    onClick={searchPlace}
                    disabled={isSearching}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium disabled:bg-gray-300"
                  >
                    {isSearching ? '検索中...' : '🔍 検索'}
                  </button>
                </div>

                {/* 検索結果（写真付き、シンプル） */}
                {tempLocation && (
                  <div className="mt-4 bg-white rounded-2xl border border-gray-300 shadow-lg overflow-hidden">
                    {/* Wikipedia写真（読み込み中） */}
                    {tempLocation.photoUrl === undefined ? (
                      <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
                        <span className="text-gray-400">📸 写真を読み込み中...</span>
                      </div>
                    ) : tempLocation.photoUrl ? (
                      <img 
                        src={tempLocation.photoUrl} 
                        alt={tempLocation.display_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-4xl">📍</span>
                      </div>
                    )}
                    
                    <div className="p-5">
                      <h5 className="font-bold text-gray-900 text-xl mb-2">
                        {tempLocation.display_name.split(',')[0]}
                      </h5>
                      <p className="text-sm text-gray-600 mb-4">
                        {tempLocation.display_name}
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={saveLocation}
                          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                        >
                          💾 保存
                        </button>
                        <button
                          onClick={() => setTempLocation(null)}
                          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
                        >
                          ✕ 閉じる
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {locations.length > 0 || tempLocation ? (
                <>
                  {/* OpenStreetMap */}
                  {typeof window !== 'undefined' && (locations.length > 0 || tempLocation) && (
                    <div className="mb-6 rounded-2xl overflow-hidden shadow-xl h-64">
                      <MapContainer
                        key={tempLocation ? `temp-${tempLocation.place_id}` : 'saved'}
                        center={
                          tempLocation 
                            ? [parseFloat(tempLocation.lat), parseFloat(tempLocation.lon)]
                            : [locations[0].latitude, locations[0].longitude]
                        }
                        zoom={tempLocation ? 15 : 10}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        
                        {/* 保存済みマーカーのみ表示 */}
                        {locations.map((location, index) => (
                          <Marker
                            key={location.id}
                            position={[location.latitude, location.longitude]}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-bold">📍 {location.location_name}</h3>
                                {location.character_name && (
                                  <p className="text-sm text-blue-600">👤 {location.character_name}</p>
                                )}
                                <p className="text-sm text-gray-600">{location.description}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        
                        {/* 線で繋ぐ */}
                        {locations.length > 1 && (
                          <Polyline
                            positions={locations.map(loc => [loc.latitude, loc.longitude])}
                            color="#4285F4"
                            weight={4}
                            opacity={0.8}
                          />
                        )}
                      </MapContainer>
                    </div>
                  )}

                  {/* 距離表示 */}
                  {distance && locations.length > 1 && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-l-4 border-blue-500">
                      <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2 text-lg">
                        📏 総距離
                      </h4>
                      <p className="text-3xl font-bold text-blue-900">{distance}</p>
                      <p className="text-gray-600 mt-2">
                        {locations[0].location_name} → {locations[locations.length - 1].location_name}
                      </p>
                    </div>
                  )}

                  {/* 場所リスト */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-xl mb-4">保存された場所：</h4>
                    {locations.map((location, index) => (
                      <div 
                        key={location.id} 
                        className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:shadow-md transition border border-gray-200"
                      >
                        {/* 写真表示 */}
                        {location.photo_url && (
                          <div className="mb-4 rounded-xl overflow-hidden">
                            <img 
                              src={location.photo_url} 
                              alt={location.location_name}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📍</span>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {index + 1}. {location.location_name}
                            </h3>
                          </div>
                          <button
                            onClick={() => deleteLocation(location.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium whitespace-nowrap flex items-center gap-1"
                          >
                            🗑️ 削除
                          </button>
                        </div>
                        
                        {location.character_name && (
                          <p className="text-blue-600 mb-2 ml-9 font-medium">
                            👤 {location.character_name}
                          </p>
                        )}
                        <p className="text-gray-700 ml-9 leading-relaxed">{location.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-gray-500 text-lg">この本の場所情報はまだ登録されていません</p>
                  <p className="text-gray-400 text-sm mt-2">上の検索バーで場所を追加してみてください</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* アニメーション用CSS */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
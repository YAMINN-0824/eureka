'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Google Maps の型定義
declare global {
  interface Window {
    google: any;
  }
}

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
}

export default function ImprovedReaderPage() {
  const params = useParams();
  const { id } = params;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  
  // ダイアログの状態
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  
  // データ
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<string>('');
  
  // 検索機能
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadBook();
      loadLocations();
    }
  }, [id]);

  useEffect(() => {
    // Google Maps APIをロード
    if (showMapDialog && typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        setTimeout(() => initMap(), 100);
      };
    } else if (showMapDialog && typeof window !== 'undefined' && window.google) {
      setTimeout(() => initMap(), 100);
    }
  }, [showMapDialog, locations]);

  const initMap = () => {
    if (typeof window === 'undefined' || !window.google || locations.length === 0) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // 最初の場所を中心に
    const center = {
      lat: locations[0].latitude,
      lng: locations[0].longitude
    };

    const map = new window.google.maps.Map(mapElement, {
      zoom: 11,
      center: center,
      mapTypeId: 'roadmap'
    });

    // 各場所にマーカーを配置
    locations.forEach((location, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: map,
        title: location.location_name,
        label: (index + 1).toString(),
        animation: window.google.maps.Animation.DROP
      });

      // マーカークリックで情報表示
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${location.location_name}</h3>
            ${location.character_name ? `<p style="margin-bottom: 5px; color: #3b82f6;">👤 ${location.character_name}</p>` : ''}
            <p style="color: #666; font-size: 14px;">${location.description}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedLocation(location);
      });
    });

    // 線で繋ぐ
    if (locations.length > 1) {
      const path = locations.map(loc => ({
        lat: loc.latitude,
        lng: loc.longitude
      }));

      new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      // 距離を計算
      calculateDistance();
    }
  };

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

  const openMapDialog = () => {
    setShowMapDialog(true);
    setShowTranslationDialog(false);
  };

  const closeMapDialog = () => {
    setShowMapDialog(false);
    setSelectedLocation(null);
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
      <div className="flex-1 flex overflow-hidden">
        
        {/* 本文エリア */}
        <div 
          className={`overflow-y-auto p-8 bg-white transition-all duration-300 ${
            showDialog ? 'w-[60%]' : 'w-full'
          }`}
        >
          <div 
            className={`leading-relaxed transition-all duration-300 ${
              showDialog ? 'max-w-3xl' : 'max-w-4xl mx-auto'
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
        </div>

        {/* 右側ダイアログエリア */}
        {showDialog && (
          <div className="w-[40%] border-l bg-gray-50 overflow-hidden flex flex-col">
            
            {/* 翻訳ダイアログ */}
            {showTranslationDialog && selectedWord && (
              <div className="h-full overflow-y-auto animate-slideInRight">
                {/* Medium風カード */}
                <div className="p-6 h-full flex flex-col">
                  <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1 overflow-y-auto">
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
                      <div className="text-sm text-gray-600 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                        <span className="font-semibold">ℹ️ 補足：</span> {selectedWord.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* マップダイアログ */}
            {showMapDialog && (
              <div className="h-full overflow-y-auto animate-slideInRight">
                <div className="p-6 h-full flex flex-col">
                  <div className="bg-white rounded-3xl shadow-2xl p-8 flex-1 overflow-y-auto">
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
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="場所を検索..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
                      />
                    </div>

                    {locations.length > 0 ? (
                      <>
                        {/* Google Map */}
                        <div 
                          id="map" 
                          className="w-full h-64 rounded-2xl overflow-hidden shadow-xl mb-6"
                        />

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
                          <h4 className="font-bold text-gray-900 text-xl mb-4">登場する場所：</h4>
                          {locations.map((location, index) => (
                            <div 
                              key={location.id} 
                              className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:shadow-md transition cursor-pointer border border-gray-200"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">📍</span>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {index + 1}. {location.location_name}
                                </h3>
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
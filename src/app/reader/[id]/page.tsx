'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContext';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import L from 'leaflet';

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

// カスタムマーカーアイコン（ピン型 + 絵文字）- 青色
const createCustomIcon = (isSelected = false) => {
  const size = isSelected ? 60 : 50;
  const height = isSelected ? 70 : 60;
  
  const svg = `
    <svg width="${size}" height="${height}" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${isSelected ? 'Selected' : ''}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4285F4;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a73e8;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <path 
        d="M25,5 C15,5 7,13 7,23 C7,35 25,55 25,55 C25,55 43,35 43,23 C43,13 35,5 25,5 Z" 
        fill="url(#grad${isSelected ? 'Selected' : ''})" 
        filter="url(#shadow)"
        stroke="white"
        stroke-width="${isSelected ? '3' : '2'}"
      />
      
      <circle cx="25" cy="23" r="11" fill="white" opacity="0.95"/>
      
      <text 
        x="25" 
        y="30" 
        font-size="16" 
        text-anchor="middle" 
        font-family="Arial, sans-serif"
      >📍</text>
      
      ${isSelected ? `
        <circle cx="25" cy="23" r="18" fill="none" stroke="#4285F4" stroke-width="2" opacity="0.6">
          <animate attributeName="r" from="18" to="24" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, height],
    iconAnchor: [size / 2, height - 5],
    popupAnchor: [0, -(height - 10)]
  });
};

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // データ
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6762, 139.6503]); // 東京
  const [mapZoom, setMapZoom] = useState(10);
  
  // 検索機能
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tempLocation, setTempLocation] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadBook();
      loadLocations();
    }
  }, [id]);

  // Nominatim APIで場所を検索
  const searchPlace = async () => {
    if (!searchQuery.trim()) {
      toast.error('場所を入力してください');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=ja`
      );
      
      if (!response.ok) throw new Error('検索に失敗しました');
      
      const data = await response.json();
      
      if (data.length > 0) {
        const location = data[0];
        
        setTempLocation({ ...location, photoUrl: undefined });
        
        // 地図を移動
        setMapCenter([parseFloat(location.lat), parseFloat(location.lon)]);
        setMapZoom(15);
        
        // Wikipedia写真を取得
        const photoUrl = await fetchWikipediaPhoto(location.display_name);
        setTempLocation({ ...location, photoUrl });
      } else {
        toast.error('場所が見つかりませんでした');
      }
    } catch (error) {
      console.error('Place search error:', error);
      toast.error('場所の検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  // Wikipedia APIで写真を取得
  const fetchWikipediaPhoto = async (locationName: string): Promise<string | null> => {
    try {
      const cleanName = locationName.split(/[,、]/)[0].trim();
      
      const searchResponse = await fetch(
        `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`
      );
      
      if (!searchResponse.ok) return null;
      
      const searchData = await searchResponse.json();
      
      if (!searchData.query?.search || searchData.query.search.length === 0) {
        return null;
      }
      
      const pageTitle = searchData.query.search[0].title;
      
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
      console.error('Wikipedia API error:', error);
      return null;
    }
  };

  // 場所をデータベースに保存
  const saveLocation = async () => {
    if (!tempLocation) {
      toast.error('保存する場所が選択されていません');
      return;
    }

    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('book_locations')
        .insert([
          {
            book_id: id,
            user_id: user.id,
            location_name: tempLocation.display_name.split(',')[0],
            latitude: parseFloat(tempLocation.lat),
            longitude: parseFloat(tempLocation.lon),
            description: tempLocation.display_name,
            character_name: '',
            photo_url: tempLocation.photoUrl || null,
            place_id: tempLocation.place_id,
            order_index: locations.length
          }
        ])
        .select();

      if (error) throw error;

      toast.success('📍 場所を保存しました!');
      setTempLocation(null);
      setSearchQuery('');
      await loadLocations();
    } catch (error: any) {
      console.error('Location save error:', error);
      toast.error(`保存に失敗しました: ${error.message}`);
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

      toast.success('場所を削除しました!');
      setSelectedLocation(null);
      await loadLocations();
    } catch (error: any) {
      console.error('Location delete error:', error);
      toast.error(`削除に失敗しました: ${error.message}`);
    }
  };

  const calculateDistance = () => {
    if (locations.length < 2) return;

    const R = 6371;
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
    } else {
      setDistance('');
    }
  }, [locations]);

  useEffect(() => {
    if (locations.length > 0) {
      setMapCenter([locations[0].latitude, locations[0].longitude]);
      setMapZoom(12);
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
      console.error('Book load error:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('book_locations')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .order('order_index');

      if (error) throw error;
      
      setLocations(data || []);
    } catch (error) {
      console.error('Location load error:', error);
      toast.error('場所の読み込みに失敗しました');
    }
  };

  const recordWordLookup = async (word: string) => {
    if (!user) return;

    try {
      await supabase
        .from('word_lookup_history')
        .insert([
          {
            user_id: user.id,
            word: word,
            book_id: id,
            book_title: book?.title
          }
        ]);
    } catch (error) {
      console.error('Word lookup history error:', error);
    }
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 20) {
      await recordWordLookup(selectedText);
      
      const { data, error } = await supabase
        .from('word_dictionary')
        .select('*')
        .eq('word', selectedText)
        .single();

      if (data) {
        setSelectedWord(data);
        setShowTranslationDialog(true);
        setShowMapDialog(false);
      } else {
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

  const saveWordToVocabulary = async () => {
    if (!selectedWord || !user) {
      toast.error('ログインが必要です');
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

      toast.success('💾 単語を保存しました!');
      closeTranslationDialog();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('この単語は既に保存されています');
      } else {
        toast.error('単語の保存に失敗しました');
      }
    }
  };

  const openMapDialog = () => {
    setShowMapDialog(true);
    setShowTranslationDialog(false);
    setSidebarCollapsed(false);
  };

  const closeMapDialog = () => {
    setShowMapDialog(false);
    setSidebarCollapsed(true);
  };

  const increaseFontSize = () => setFontSize((size) => Math.min(size + 2, 32));
  const decreaseFontSize = () => setFontSize((size) => Math.max(size - 2, 12));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!book) {
    return <div>本が見つかりません。</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      
      {/* ヘッダー */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/my-bookshelf" 
            className="px-4 py-2 rounded-xl font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
              color: 'white'
            }}
          >
            ← 本棚
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
          <span className="text-gray-500">- {book.author}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={openMapDialog}
            className="px-6 py-2 rounded-xl text-white font-medium transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
            }}
          >
            🗺️ 物語の舞台
          </button>
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1">
            <button 
              onClick={decreaseFontSize} 
              className="px-3 py-1 hover:bg-gray-100 rounded-lg transition font-bold text-gray-700"
            >
              A-
            </button>
            <span className="text-sm w-12 text-center font-medium text-gray-600">{fontSize}px</span>
            <button 
              onClick={increaseFontSize} 
              className="px-3 py-1 hover:bg-gray-100 rounded-lg transition font-bold text-gray-700"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden flex relative">
        
        {/* 本文エリア */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div 
            className="leading-relaxed mx-auto max-w-4xl"
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

        {/* 翻訳ダイアログ */}
        {showTranslationDialog && selectedWord && (
          <div className="fixed top-24 right-8 w-[450px] max-h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl z-50 animate-slideInRight flex flex-col border-4"
            style={{ borderColor: '#A0C878' }}
          >
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold" style={{ color: '#7B9E5F' }}>
                  📚 {selectedWord.word}
                </h2>
                <button
                  onClick={closeTranslationDialog}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  ×
                </button>
              </div>
              
              {selectedWord.reading && (
                <p className="text-gray-500 mb-6 text-xl">({selectedWord.reading})</p>
              )}
              
              {selectedWord.old_meaning && (
                <div className="mb-6 p-6 rounded-2xl border-l-4"
                  style={{
                    background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                    borderColor: '#A0C878'
                  }}
                >
                  <h4 className="font-bold mb-3 text-lg flex items-center gap-2"
                    style={{ color: '#7B9E5F' }}
                  >
                    📚 明治時代の意味
                  </h4>
                  <p className="text-gray-800 text-lg leading-relaxed">{selectedWord.old_meaning}</p>
                </div>
              )}
              
              {selectedWord.modern_meaning && (
                <div className="mb-6 p-6 rounded-2xl border-l-4"
                  style={{
                    background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                    borderColor: '#A0C878'
                  }}
                >
                  <h4 className="font-bold mb-3 text-lg flex items-center gap-2"
                    style={{ color: '#7B9E5F' }}
                  >
                    📖 現代の意味
                  </h4>
                  <p className="text-gray-800 text-lg leading-relaxed">{selectedWord.modern_meaning}</p>
                </div>
              )}
              
              {selectedWord.example && (
                <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-3 text-lg flex items-center gap-2">
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

              <button
                onClick={saveWordToVocabulary}
                className="w-full px-6 py-4 text-white rounded-2xl transition font-bold text-lg shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                }}
              >
                💾 この単語を保存
              </button>
            </div>
          </div>
        )}

         {/* マップダイアログ（折りたたみサイドバー） */}
        {showMapDialog && (
          <div className="fixed inset-0 z-40 flex">
            
            {/* サイドバー */}
            <div 
              className="bg-white shadow-2xl overflow-y-auto transition-all duration-300"
              style={{
                width: sidebarCollapsed ? '0px' : '400px',
                borderRight: sidebarCollapsed ? 'none' : '2px solid #A0C878'
              }}
            >
              {!sidebarCollapsed && (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
                      🗺️ 物語の舞台
                    </h2>
                    <button
                      onClick={closeMapDialog}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
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
                        placeholder="場所を検索..."
                        className="flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-[#7B9E5F] text-base"
                        style={{
                          borderColor: '#A0C878'
                        }}
                      />
                      <button
                        onClick={searchPlace}
                        disabled={isSearching}
                        className="px-6 py-3 text-white rounded-xl transition font-medium disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                        }}
                      >
                        {isSearching ? '...' : '🔍'}
                      </button>
                    </div>

                  {/* 検索結果 */}
                    {tempLocation && (
                      <div className="mt-4 bg-white rounded-2xl border-2 shadow-lg overflow-hidden"
                        style={{ borderColor: '#A0C878' }}
                      >
                        {tempLocation.photoUrl === undefined ? (
                          <div className="w-full h-40 bg-gray-200 animate-pulse flex items-center justify-center">
                            <span className="text-gray-400">📸 写真を読み込み中...</span>
                          </div>
                        ) : tempLocation.photoUrl ? (
                          <img 
                            src={tempLocation.photoUrl} 
                            alt={tempLocation.display_name}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                            }}
                          >
                            <span className="text-5xl">📍</span>
                          </div>
                        )}
                        
                        <div className="p-4">
                          <h5 className="font-bold text-gray-900 text-lg mb-2">
                            {tempLocation.display_name.split(',')[0]}
                          </h5>
                          <p className="text-sm text-gray-600 mb-4">
                            {tempLocation.display_name}
                          </p>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={saveLocation}
                              className="flex-1 px-4 py-2 text-white rounded-xl transition font-medium"
                              style={{
                                background: 'linear-gradient(135deg, #A0C878 0%, #7B9E5F 100%)',
                              }}
                            >
                              💾 保存
                            </button>
                            <button
                              onClick={() => setTempLocation(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 保存された場所リスト */}
                  {locations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-900 text-lg mb-4">
                        保存された場所：
                      </h4>
                      {locations.map((location, index) => (
                        <div 
                          key={location.id}
                          onClick={() => {
                            setSelectedLocation(location);
                            setMapCenter([location.latitude, location.longitude]);
                            setMapZoom(15);
                          }}
                          className="p-4 rounded-2xl border-2 cursor-pointer transition hover:shadow-md"
                          style={{
                            borderColor: selectedLocation?.id === location.id ? '#7B9E5F' : '#e5e7eb',
                            background: selectedLocation?.id === location.id ? '#f0fdf4' : 'white'
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📍</span>
                              <h3 className="font-bold text-gray-900">
                                {index + 1}. {location.location_name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 ml-7">{location.description}</p>
                        </div>
                      ))}

                      {distance && locations.length > 1 && (
                        <div className="p-4 rounded-2xl border-2"
                          style={{
                            background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                            borderColor: '#A0C878'
                          }}
                        >
                          <h4 className="font-bold mb-2 flex items-center gap-2"
                            style={{ color: '#7B9E5F' }}
                          >
                            📏 総距離
                          </h4>
                          <p className="text-2xl font-bold" style={{ color: '#7B9E5F' }}>
                            {distance}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {locations.length === 0 && !tempLocation && (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🗺️</div>
                      <p className="text-gray-500">場所を検索して追加しましょう</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 折りたたみボタン */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-4 z-50 text-white shadow-xl transition-all px-3 py-6 font-bold"
              style={{
                background: 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)',
                left: sidebarCollapsed ? '0px' : '400px',
                borderRadius: sidebarCollapsed ? '0 12px 12px 0' : '0 12px 12px 0'
              }}
            >
              {sidebarCollapsed ? '☰' : '✕'}
            </button>

            {/* OpenStreetMap */}
            <div className="flex-1 relative">
              {typeof window !== 'undefined' && (
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  {/* マーカー */}
                  {locations.map((location) => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={createCustomIcon(selectedLocation?.id === location.id)}
                      eventHandlers={{
                        click: () => setSelectedLocation(location)
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '250px', maxWidth: '300px' }}>
                          {location.photo_url && (
                            <img 
                              src={location.photo_url}
                              alt={location.location_name}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '12px'
                              }}
                            />
                          )}
                          
                          <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#1a73e8'
                          }}>
                            📍 {location.location_name}
                          </h3>
                          
                          <p style={{ 
                            margin: '4px 0 12px 0', 
                            fontSize: '14px',
                            color: '#6b7280',
                            lineHeight: '1.5'
                          }}>
                            {location.description}
                          </p>

                          <button
                            onClick={() => deleteLocation(location.id)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            🗑️ 削除
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* 場所間の線 */}
                  {locations.length > 1 && (
                    <Polyline
                      positions={locations.map(loc => [loc.latitude, loc.longitude])}
                      color="#4285F4" 
                      weight={4}
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        )}
      </div>

      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

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
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
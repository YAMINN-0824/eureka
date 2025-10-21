import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* タイトル */}
        <h1 className="text-5xl font-bold text-center text-blue-900 mb-4">
          📚 Eureka Library
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          青空文庫で、あなただけの読書体験を
        </p>
        
        {/* ボタン */}
        <div className="flex justify-center gap-4">
          <Link 
            href="/books"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            本を探す
          </Link>
          <Link 
            href="/login"
            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            ログイン
          </Link>
        </div>

        {/* 特徴の説明 */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="font-bold text-lg mb-2">青空文庫の作品</h3>
            <p className="text-gray-600">名作文学を自由に読める</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="font-bold text-lg mb-2">旅マップ機能</h3>
            <p className="text-gray-600">物語の舞台を地図で探索</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="font-bold text-lg mb-2">パーソナル本棚</h3>
            <p className="text-gray-600">自分だけの本棚を作成</p>
          </div>
        </div>
      </div>
    </div>
  );
}
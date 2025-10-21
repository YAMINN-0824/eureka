// app/api/books/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 });
  }

  try {
    // NEXT_PUBLIC_を削除したので、サーバー側でのみアクセス可能
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Books APIキーが設定されていません');
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 500 });
    }

    // Google Books APIを呼び出し
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=20&langRestrict=ja`
    );

    if (!response.ok) {
      throw new Error('Google Books APIエラー');
    }

    const data = await response.json();

    // データを整形
    const books = data.items?.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || '不明なタイトル',
      authors: item.volumeInfo.authors || ['不明な著者'],
      description: item.volumeInfo.description || '',
      thumbnail: item.volumeInfo.imageLinks?.thumbnail || '',
      publishedDate: item.volumeInfo.publishedDate || '',
      pageCount: item.volumeInfo.pageCount || 0,
      categories: item.volumeInfo.categories || [],
      previewLink: item.volumeInfo.previewLink || '',
      infoLink: item.volumeInfo.infoLink || '',
      buyLink: item.saleInfo?.buyLink || '',
      price: item.saleInfo?.listPrice?.amount || null,
      isPublicDomain: item.accessInfo?.publicDomain || false,
      viewability: item.accessInfo?.viewability || 'NO_PAGES'
    })) || [];

    return NextResponse.json({ books, totalItems: data.totalItems || 0 });
  } catch (error) {
    console.error('本の検索エラー:', error);
    return NextResponse.json({ error: '本の検索に失敗しました' }, { status: 500 });
  }
}
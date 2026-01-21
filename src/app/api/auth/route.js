import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    const correctPassword = process.env.APP_PASSWORD || 'Raumblick360!123';
    
    if (password === correctPassword) {
      return NextResponse.json({
        success: true,
        message: 'Authentifizierung erfolgreich',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Falsches Passwort',
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Authentifizierungsfehler',
    }, { status: 500 });
  }
}

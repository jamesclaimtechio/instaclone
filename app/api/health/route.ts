import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasJWTSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      hasDatabaseURL: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      message: 'Health check passed',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}


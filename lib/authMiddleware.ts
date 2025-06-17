import { verifyToken } from './jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    console.log("error ==> ", error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}

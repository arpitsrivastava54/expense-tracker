// app/api/expense/my/route.ts

import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ expenses });
}


// {
//   "amount": 200,
//   "type": "EXPENSE",
//   "date": "2025-06-15",
//   "categoryId": "abc123",  // OR leave empty
//   "customCategory": "Birthday Gift",
//   "note": "For cousin's party",
//   "receiptUrl": "/uploads/xyz.pdf"
// }

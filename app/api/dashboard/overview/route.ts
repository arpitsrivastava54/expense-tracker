import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';
import { Expense } from '@/app/generated/prisma';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month')); // 1-based (e.g., 6 = June)
  const year = Number(searchParams.get('year'));

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.organizationId || dbUser.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId: dbUser.organizationId,
      date: { gte: fromDate, lt: toDate },
    },
  }) as Expense[];

  const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    totalIncome,
    totalExpense,
    month,
    year,
  });
}

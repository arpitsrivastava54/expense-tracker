import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));

  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 1);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId: dbUser.organizationId,
      date: { gte: fromDate, lt: toDate },
    },
    include: {
      user: { select: { name: true } },
      category: true,
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ month, year, expenses });
}

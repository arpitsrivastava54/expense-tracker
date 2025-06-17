import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';
import { User, Expense } from '@/app/generated/prisma';

type MemberWithExpenses = {
  id: string;
  name: string;
  expenses: Pick<Expense, 'amount' | 'type'>[];
};

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));

  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 1);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { organizationId: dbUser.organizationId, status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      expenses: {
        where: {
          date: { gte: fromDate, lt: toDate },
        },
        select: {
          amount: true,
          type: true,
        },
      },
    },
  }) as MemberWithExpenses[];

  const result = members.map((member) => {
    const income = member.expenses.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
    const expense = member.expenses.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);

    return {
      memberId: member.id,
      name: member.name,
      income,
      expense,
    };
  });

  return NextResponse.json(result);
}

import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const parse = querySchema.safeParse({
    month: searchParams.get('month'),
    year: searchParams.get('year'),
  });

  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { month, year } = parse.data;

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  });

  if (!dbUser?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  // Get all expenses in the date range
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId: dbUser.organizationId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      amount: true,
      type: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totals = {
    income: 0,
    expense: 0,
  };

  const byMember: Record<string, { name: string; income: number; expense: number }> = {};

  for (const exp of expenses) {
    const key = exp.userId;
    if (!byMember[key]) {
      byMember[key] = {
        name: exp.user.name,
        income: 0,
        expense: 0,
      };
    }

    if (exp.type === 'INCOME') {
      totals.income += exp.amount;
      byMember[key].income += exp.amount;
    } else {
      totals.expense += exp.amount;
      byMember[key].expense += exp.amount;
    }
  }

  return NextResponse.json({
    month,
    year,
    totals,
    byMember,
  });
}
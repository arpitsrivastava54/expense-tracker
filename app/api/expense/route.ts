import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const expenseSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().refine(date => !isNaN(Date.parse(date)), { message: 'Invalid date' }).optional().default(new Date().toISOString()),
  categoryId: z.string().optional(),
  customCategory: z.string().optional(),
  note: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.status !== 'APPROVED' || !dbUser.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount, type, date, categoryId, customCategory, note, receiptUrl } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      amount,
      type,
      date: new Date(date),
      categoryId: categoryId || undefined,
      customCategory: customCategory || undefined,
      note,
      receiptUrl,
    },
  });

  return NextResponse.json({ expense });
}

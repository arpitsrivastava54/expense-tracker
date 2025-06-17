import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { isParent } from '@/lib/isParent';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const schema = z.object({
  userId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const hasPermission = await isParent(user.id);
  if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: 'APPROVED' },
  });

  return NextResponse.json({ success: true });
} 
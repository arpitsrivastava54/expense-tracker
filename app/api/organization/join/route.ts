import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { z } from 'zod';

const schema = z.object({
  referralCode: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { referralCode } = parsed.data;

  const org = await prisma.organization.findUnique({
    where: { referralCode },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      organizationId: org.id,
      status: 'PENDING',
      role: 'MEMBER',
    },
  });

  return NextResponse.json({ message: 'Join request sent', organizationId: org.id });
}

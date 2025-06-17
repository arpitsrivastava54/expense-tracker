import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const schema = z.object({
  name: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { name } = parsed.data;
  const referralCode = nanoid(8);

  const organization = await prisma.organization.create({
    data: {
      name,
      referralCode,
      ownerId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      organizationId: organization.id,
      role: 'PARENT',
      status: 'APPROVED',
    },
  });

  return NextResponse.json({ organization });
}

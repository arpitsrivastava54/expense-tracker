import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { z } from 'zod';

const schema = z.object({
  memberId: z.string(),
});

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const { memberId } = schema.parse(await req.json());

  const parent = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!parent || parent.role !== 'PARENT') {
    return NextResponse.json({ error: 'Only parents can approve members' }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== parent.organizationId) {
    return NextResponse.json({ error: 'Invalid member or not in your organization' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: memberId },
    data: {
      status: 'APPROVED',
    },
  });

  return NextResponse.json({ message: 'Member approved' });
}

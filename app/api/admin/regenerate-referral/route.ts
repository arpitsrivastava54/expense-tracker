import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { isParent } from '@/lib/isParent';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const hasPermission = await isParent(user.id);
  if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.organizationId) return NextResponse.json({ error: 'No org' }, { status: 400 });

  const newCode = nanoid(10);

  const updatedOrg = await prisma.organization.update({
    where: { id: dbUser.organizationId },
    data: { referralCode: newCode },
  });

  return NextResponse.json({ referralCode: updatedOrg.referralCode });
} 
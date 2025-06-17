import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { isParent } from '@/lib/isParent';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const hasPermission = await isParent(user.id);
  if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.organizationId) return NextResponse.json({ error: 'No organization found' }, { status: 400 });

  const members = await prisma.user.findMany({
    where: { organizationId: dbUser.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ members });
} 
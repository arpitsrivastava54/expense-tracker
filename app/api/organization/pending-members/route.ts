import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const parent = await prisma.user.findUnique({ where: { id: user.id } });
  if (!parent || parent.role !== 'PARENT') {
    return NextResponse.json({ error: 'Only parents can view pending members' }, { status: 403 });
  }

  console.log("parent ==> ", parent);

  const pendingMembers = await prisma.user.findMany({
    where: {
      organizationId: parent.organizationId,
      status: 'PENDING',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  console.log(pendingMembers);

  return NextResponse.json({ pendingMembers });
}

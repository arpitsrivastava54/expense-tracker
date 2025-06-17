import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/authMiddleware';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
});

// Create a new category
export async function POST(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const data = await req.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.organizationId || dbUser.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      organizationId: dbUser.organizationId,
      isDefault: false,
    },
  });

  return NextResponse.json({ category });
}

// Get all categories
export async function GET(req: NextRequest) {
  const user = await authMiddleware(req) as { id: string };
  if (!user || user instanceof Response) return user;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { isDefault: true },
        { organizationId: dbUser.organizationId ?? '' },
      ],
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ categories });
}

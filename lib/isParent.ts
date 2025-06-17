import { prisma } from './prisma';

export async function isParent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedOrganizations: true },
  });

  return !!(user && user.ownedOrganizations.length > 0);
} 
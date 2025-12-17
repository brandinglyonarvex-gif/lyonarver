import { prisma } from "./db"

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  })
}
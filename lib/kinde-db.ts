import { prisma } from "./db";

/**
 * Creates a new user in the local database if they don't exist,
 * or updates their details if they do.
 */
export async function getOrCreateUser(
  kindeId: string,
  email: string,
  name?: string,
  image?: string,
) {
  let user = await prisma.user.findUnique({
    where: { kindeId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        kindeId,
        email,
        name: name || email.split("@")[0],
        image,
      },
    });
  } else {
    // Optionally, update user details on every login
    user = await prisma.user.update({
      where: { kindeId },
      data: {
        email,
        name: name || email.split("@")[0],
        image,
      },
    });
  }

  return user;
}

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key-change-in-production";
const ADMIN_EMAIL = "admin@lyonarvex.com";

interface AdminUser {
  email: string;
  role: string;
}

class NotAdminError extends Error {
  constructor(message = "Unauthorized: User is not an admin") {
    super(message);
    this.name = "NotAdminError";
  }
}

/**
 * Checks if the current user is authenticated as admin via JWT cookie.
 * Throws a NotAdminError if not authenticated.
 */
export async function requireAdmin(): Promise<{ isAuthenticated: boolean; user: AdminUser }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      throw new NotAdminError("No admin token found");
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;

    if (!decoded || decoded.email !== ADMIN_EMAIL || decoded.role !== "admin") {
      throw new NotAdminError("Invalid admin token");
    }

    return {
      isAuthenticated: true,
      user: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new NotAdminError("Invalid or expired token");
    }
    if (error instanceof NotAdminError) {
      throw error;
    }
    throw new NotAdminError("Authentication failed");
  }
}

/**
 * Checks if admin is authenticated without throwing.
 * Returns null if not authenticated.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const { user } = await requireAdmin();
    return user;
  } catch {
    return null;
  }
}

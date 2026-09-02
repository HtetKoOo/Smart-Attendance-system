import { headers } from "next/headers";
import { auth, type Session, type User } from "@/lib/auth";
import type { Role } from "@prisma/client";

/**
 * Retrieve the current authenticated Better Auth session on the server.
 */
export async function getSession(): Promise<Session | null> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return session;
}

/**
 * Retrieve the current authenticated user object.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if the current incoming request is from an authenticated user.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Retrieve the application Role of the currently authenticated user.
 */
export async function getUserRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  if (!user || !user.role) {
    return null;
  }
  return user.role as Role;
}

/**
 * Determine if the authenticated user possesses a given Role (or any from a list of Roles).
 */
export async function hasRole(roles: Role | Role[]): Promise<boolean> {
  const currentRole = await getUserRole();
  if (!currentRole) {
    return false;
  }
  if (Array.isArray(roles)) {
    return roles.includes(currentRole);
  }
  return currentRole === roles;
}

/**
 * Guard that requires an active authenticated session.
 * Throws an Error if unauthenticated.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session;
}

/**
 * Guard that requires an active authenticated session matching specific allowed roles.
 * Throws an Error if unauthenticated or forbidden.
 */
export async function requireRole(allowedRoles: Role | Role[]): Promise<Session> {
  const session = await requireAuth();
  const userRole = (session.user.role as Role) || "STUDENT";
  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roleList.includes(userRole)) {
    throw new Error(`Forbidden: Access denied. Required role(s): ${roleList.join(", ")}`);
  }

  return session;
}

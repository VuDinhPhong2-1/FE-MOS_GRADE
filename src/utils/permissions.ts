import type { User } from '../types/auth.types';

/**
 * Kiểm tra user có quyền cụ thể hay không.
 * Admin luôn được coi là có mọi quyền, không cần khai báo trong mảng permissions.
 */
export const hasPermission = (user: User | null | undefined, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

export const hasAnyPermission = (user: User | null | undefined, permissions: string[]): boolean =>
  permissions.some((p) => hasPermission(user, p));
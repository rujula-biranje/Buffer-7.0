import type { User } from '../types';

/** Monitor/display account — can see inventory but not place orders. */
export const PRIVILEGED_EMAIL = 'suswaad_ccoew@gmail.com';

export function canSeeInventory(user: User | null | undefined): boolean {
  return user?.role === 'admin' || user?.email === PRIVILEGED_EMAIL;
}

export function canOrder(user: User | null | undefined): boolean {
  return !!user && user.email !== PRIVILEGED_EMAIL;
}

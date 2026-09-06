// The "current authenticated user" for per-user local storage keys, held OUTSIDE
// zustand to avoid an import cycle between the auth store and the cart/favorites/
// rating stores (auth -> cart -> auth). The auth store updates this the moment a
// session changes; the data stores read it at action time to compute a per-user
// AsyncStorage key, so no two users ever share a cart/favorites/ratings key.
let activeUserId: string | null = null;

export function setActiveUserId(id: string | null): void {
  activeUserId = id;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

// Returns a storage key scoped to the signed-in user, e.g.
//   userStorageKey("goocart.cart.v1") -> "goocart.cart.v1.userA123"
// Unauthenticated/guest sessions use a shared "guest" bucket that never
// collides with a real user's data.
export function userStorageKey(base: string): string {
  return activeUserId ? `${base}.${activeUserId}` : `${base}.guest`;
}

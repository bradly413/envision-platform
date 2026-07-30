export const BUILDER_DATA_CACHE_KEY = 'envision-builder-v2-workspace-cache';

/**
 * Strip secrets and bulky content before persisting builder workspace
 * lists to localStorage. Passwords must never survive logout; full
 * portal content can overflow the ~5MB quota and break admin auth.
 */
export function sanitizePortalForCache(portal) {
  if (!portal || typeof portal !== 'object') return portal;

  const {
    plain_password: _plainPassword,
    password_hash: _passwordHash,
    content: _content,
    ...safe
  } = portal;

  return safe;
}

export function sanitizePortalsForCache(portals = []) {
  if (!Array.isArray(portals)) return [];
  return portals.map(sanitizePortalForCache);
}

export function clearBuilderWorkspaceCache() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BUILDER_DATA_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

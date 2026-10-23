function getPathSegments(path: string): string[] {
  return path
    .split(/[?#]/, 1)[0]
    .split('/')
    .filter(Boolean);
}

export function isAnimateurPortalRoute(path: string): boolean {
  const segments = getPathSegments(path);
  return segments.includes('animateur') || segments.includes('espace-animateur');
}

export function isPublicRoute(path: string): boolean {
  const segments = getPathSegments(path);
  return (
    segments.length === 0 ||
    segments.includes('auth') ||
    segments.includes('login') ||
    segments.includes('preinscription-publique') ||
    segments.some((segment, index) => segment === 'preinscriptions' && segments[index + 1] === 'campagne') ||
    isAnimateurPortalRoute(path)
  );
}

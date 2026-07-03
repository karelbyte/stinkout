import { createHash } from 'crypto';

export function generateSlug(name: string): string {
  const hash = createHash('sha256').update(name + Date.now().toString()).digest('hex');
  return hash.slice(0, 12);
}

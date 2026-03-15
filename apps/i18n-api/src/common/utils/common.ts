import { customAlphabet } from 'nanoid';

export function customNanoid() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
  return nanoid;
}

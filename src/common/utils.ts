import { isBrowser, ResourceName } from './';
import fetch from 'sync-fetch';

export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, path);
}

export function LoadJsonFile<T = unknown>(path: string) {
  if (!isBrowser) return JSON.parse(LoadFile(path)) as T;

  // return import(/* @vite-ignore */ `/${path}`, { with: { type: 'json' } }) as T;

  return fetch(`/${path}`).json() as T;
}

export function joaat(input: any, ignore_casing = true) {
  input = !ignore_casing ? input.toLowerCase() : input;
  const length = input.length;

  let hash, i;

  for (hash = i = 0; i < length; i++) {
    hash += input.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >>> 6;
  }

  hash += hash << 3;
  hash ^= hash >>> 11;
  hash += hash << 15;

  return hash >>> 0;
}

export function ClearObject(obj: Record<string, any>) {
  Object.keys(obj).forEach((key) => delete obj[key]);
}

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

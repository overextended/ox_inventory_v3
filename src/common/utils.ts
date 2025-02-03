import { isBrowser, ResourceName } from './';

export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, path);
}

export function LoadJsonFile<T = unknown>(path: string) {
  if (!isBrowser) return JSON.parse(LoadFile(path)) as T;

  return import(/* @vite-ignore */`/${path}`);
}

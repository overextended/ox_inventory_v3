import { isBrowser, ResourceName } from './';

export function LoadFile(path: string) {
  if (isBrowser) {
    // todo: fix unable to load in browser
    return;
  }

  return LoadResourceFile(ResourceName, path);
}

export function LoadJsonFile<T = unknown>(path: string) {
  return JSON.parse(LoadFile(path)) as T;
}

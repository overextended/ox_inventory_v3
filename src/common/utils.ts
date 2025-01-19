import { isBrowser, ResourceName } from './';

export async function LoadFile(path: string) {
  if (isBrowser) {
    const resp = await fetch(`nui://${ResourceName}/${path}`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    return await resp.json();
  }

  return LoadResourceFile(ResourceName, path);
}

export async function LoadJsonFile<T = unknown>(path: string) {
  return JSON.parse(await LoadFile(path)) as T;
}

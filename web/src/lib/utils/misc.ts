// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;


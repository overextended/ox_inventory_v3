declare const window: {
  GetParentResourceName: () => string;
};

export const isBrowser = typeof window !== 'undefined';
export const ResourceContext = isBrowser ? 'web' : IsDuplicityVersion() ? 'server' : 'client';
export const ResourceName = isBrowser
  ? window.GetParentResourceName
    ? window.GetParentResourceName()
    : 'nui-frame-app'
  : (GetCurrentResourceName() ?? 'ox_inventory');

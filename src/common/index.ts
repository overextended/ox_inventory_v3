declare const window: {
  GetParentResourceName: () => string;
};

const isBrowser = typeof window !== 'undefined';

export const ResourceContext = isBrowser ? 'web' : IsDuplicityVersion() ? 'server' : 'client';
export const ResourceName = isBrowser ? window.GetParentResourceName() : (GetCurrentResourceName() ?? 'ox_inventory');

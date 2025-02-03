declare const window: {
  GetParentResourceName: () => string;
};

/**
 * Determine if the script is running in CEF, a browser, or neither.
 * @returns {number}
 *          0 - runnning on the client or server
 * 
 *          1 - running in CEF
 *
 *          2 - running in a browser
 */
export const isBrowser =
  typeof window === 'undefined' ? 0 : typeof window.GetParentResourceName !== 'undefined' ? 1 : 2;

export const ResourceContext = isBrowser ? 'web' : IsDuplicityVersion() ? 'server' : 'client';
export const ResourceName = isBrowser
  ? window.GetParentResourceName
    ? window.GetParentResourceName()
    : 'nui-frame-app'
  : (GetCurrentResourceName() ?? 'ox_inventory');

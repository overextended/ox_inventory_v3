/**
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */

export async function fetchNui<T = unknown>(
  eventName: string,
  data: unknown = {},
): Promise<T> {
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const resourceName = (window as any).GetParentResourceName
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    ? (window as any).GetParentResourceName()
    : "nui-frame-app";

  const resp = await fetch(`https://${resourceName}/${eventName}`, options);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await resp.json();
}

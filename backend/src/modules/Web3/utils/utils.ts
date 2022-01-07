export function getJsonRpcResult(payload: {
  error?: { code?: number; data?: any; message?: string };
  result?: any;
}): any {
  if (payload.error) {
    const error: any = new Error(payload.error.message);
    error.responseText = JSON.stringify(payload);
    error.code = payload.error.code;
    error.data = payload.error.data;
    throw error;
  }
  return payload.result;
}

export function getBatchRpcResults(val: any[]) {
  return arrayToObject(val, "id");
}

function arrayToObject<T, K extends keyof T>(
  array: T[],
  key: K
): { [key: string]: T } {
  return array.reduce((object: { [key: string]: T }, item: T) => {
    // @ts-ignore
    object[item[key]] = item;
    return object;
  }, {});
}

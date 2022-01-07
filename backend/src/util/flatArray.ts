export const flatArray = <T>(array: T[][]): T[] => {
  return array.reduce((acc, val) => acc.concat(val), []);
};

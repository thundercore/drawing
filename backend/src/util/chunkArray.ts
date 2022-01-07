export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const clone = [...array];
  const chunks: T[][] = [];
  while (clone.length) {
    chunks.push(clone.splice(0, size));
  }
  return chunks;
};

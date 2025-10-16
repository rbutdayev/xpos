export const useSetupProgress = (current: number, total: number) => {
  const percent = Math.round(((current + 1) / total) * 100);
  return { percent };
};


type CompareMode = 'diff' | 'equal';

interface GetPropertiesEqualityOptions {
  mode?: CompareMode;
}

export const getPropertiesEquality = <T extends Record<string, any>>(
  oldState: T | null | undefined,
  newState: T | null | undefined,
  options: GetPropertiesEqualityOptions = { mode: 'diff' }
): Record<keyof T, boolean> => {
  const result = {} as Record<keyof T, boolean>;

  if (!oldState || !newState) return result;

  console.log("Old: ", oldState)
  console.log("New: ", newState)

  const keysOld = Object.keys(oldState);
  const keysNew = Object.keys(newState);
  const allKeys = Array.from(new Set(keysOld.concat(keysNew))) as Array<keyof T>;

  const shouldBeTrueOnEqual = options.mode === 'equal';

  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const oldValue = oldState[key] ?? null;
    const newValue = newState[key] ?? null;

    const isSame = oldValue === newValue;

    result[key] = shouldBeTrueOnEqual ? isSame : !isSame;
  }

  return result;
};
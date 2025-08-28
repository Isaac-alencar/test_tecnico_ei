export function validateApiKey(key: string | null): boolean {
  if (!key) return false;

  const apiKeysEnv = process.env.API_KEYS;
  const validKeys =
    apiKeysEnv && apiKeysEnv.trim()
      ? apiKeysEnv.split(",").map((k) => k.trim())
      : ["sk_test_123456789"];

  return validKeys.includes(key);
}

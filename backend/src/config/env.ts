function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),
  accessTokenSecret: required('ACCESS_TOKEN_SECRET'),
  refreshTokenSecret: required('REFRESH_TOKEN_SECRET'),
  accessTokenExpiry: '15m',
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

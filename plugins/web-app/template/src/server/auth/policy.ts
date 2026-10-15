export const authPolicy = {
  primary: 'passkey',
  fallback: 'phone-otp',
  sessions: 'd1',
} as const

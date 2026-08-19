import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portalkeuangan',
  appName: 'portal keuangan',
  webDir: 'dist',
  server: {
    url: 'https://portal-keuangan-mocha.vercel.app/',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

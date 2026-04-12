import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hojugaja.app',
  appName: '호주가자',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://hojugaja.com',
    cleartext: false,
    allowNavigation: ['hojugaja.com', '*.hojugaja.com'],
  },
  android: {
    overScrollMode: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E0F7FA',
      showSpinner: false,
    },
  },
}

export default config

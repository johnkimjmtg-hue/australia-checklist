import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hojugaja.app',
  appName: '호주가자',
  webDir: 'dist',
  server: {
    url: 'https://hojugaja.com',  // 항상 최신 웹 버전 로드
    cleartext: false,
  },
  android: {
    overScrollMode: 'always',  // 스크롤 끝 바운스 효과
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

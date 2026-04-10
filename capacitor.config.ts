import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hojugaja.app',
  appName: '호주가자',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 개발 중 핫리로드 원하면 아래 url 주석 해제 (본인 IP로 변경)
    // url: 'http://192.168.1.xxx:5173',
    // cleartext: true,
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

@echo off
echo.
echo ================================
echo   호주가자 Android 빌드 시작
echo ================================
echo.

echo [1/2] React 앱 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [오류] npm run build 실패!
    pause
    exit /b 1
)

echo.
echo [2/2] Capacitor 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo [오류] cap sync 실패!
    pause
    exit /b 1
)

echo.
echo ================================
echo   완료! Android Studio에서
echo   AAB 빌드 후 업로드하세요.
echo ================================
echo.
pause

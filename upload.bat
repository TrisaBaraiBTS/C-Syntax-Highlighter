@echo off
echo ========================================================
echo   Uploading C Syntax Highlighter to GitHub
echo   Repository: https://github.com/TrisaBaraiBTS/C-Syntax-Highlighter.git
echo ========================================================
echo.

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All files uploaded to GitHub successfully.
    echo   View your repository at:
    echo   https://github.com/TrisaBaraiBTS/C-Syntax-Highlighter
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ERROR] Push failed.
    echo   Please make sure to sign in as 'TrisaBaraiBTS'
    echo   in the browser prompt that appears.
    echo ========================================================
)

echo.
pause

@echo off
where deno >nul 2>&1

set "DENO_PATH=%USERPROFILE%\.deno\bin\deno.exe"

if %ERRORLEVEL% == 0 (
    echo Deno is installed and available.
    deno --version
) else (

    if exist "%DENO_PATH%\deno.exe" (
        echo Deno exists but it is not in path
        
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
            "$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User');" ^
            "if ($currentPath -notlike '*%DENO_PATH%*') {" ^
            "    [Environment]::SetEnvironmentVariable('Path', \"$currentPath;%DENO_PATH%\", 'User');" ^
            "    Write-Output 'Deno path added to user PATH.';" ^
            "} else {" ^
            "    Write-Output 'Deno path already in user PATH.';" ^
            "}"
        echo Please restart your terminal or Command Prompt to apply PATH changes.
    ) else (
        echo Attempting to install Deno...
        powershell -Command "irm https://deno.land/install.ps1 | iex"
    )
)
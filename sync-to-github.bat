@echo off
echo ========================================
echo Sync to GitHub
echo ========================================
echo.

REM Get commit message from parameter or use default
set "commit_msg=%~1"
if "%commit_msg%"=="" (
    set "commit_msg=Update code"
)

REM Show current status
echo [1/5] Checking current status...
git status
echo.

REM Add all changes
echo [2/5] Adding all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo.

REM Commit changes
echo [3/5] Committing changes: %commit_msg%
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo NOTE: No changes to commit
)
echo.

REM Pull remote changes
echo [4/5] Pulling remote changes...
git pull origin main
if %errorlevel% neq 0 (
    echo WARNING: Pull failed, may have conflicts
    echo Please resolve conflicts and run again
    pause
    exit /b 1
)
echo.

REM Push to remote repository
echo [5/5] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Push failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo Sync completed successfully!
echo ========================================
pause

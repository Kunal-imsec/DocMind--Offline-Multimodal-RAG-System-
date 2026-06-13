@echo off
echo ========================================
echo DocMind Backend Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and set your MONGODB_URI
    echo.
    echo Choose one of these options:
    echo.
    echo Option 1 - MongoDB Atlas (Cloud, Free):
    echo   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/docmind
    echo.
    echo Option 2 - Local MongoDB:
    echo   MONGODB_URI=mongodb://localhost:27017/docmind
    echo.
    pause
    notepad .env
)

echo.
echo Checking MongoDB connection...
echo.

REM Start the server
npm run dev

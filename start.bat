@echo off
echo ======================================================================
echo   SURAKSHA-FLOOD: Smart Urban Flood Management & Decision Support
echo ======================================================================
echo Starting FastAPI Backend on http://localhost:8000 ...
start "Flood-Backend" cmd /k "cd backend && python run.py"

timeout /t 3 /nobreak >nul

echo Starting React Vite Frontend on http://localhost:5173 ...
start "Flood-Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening System in Default Browser ...
start http://localhost:5173

echo.
echo Both services are running!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Portal:  http://localhost:5173
echo ======================================================================

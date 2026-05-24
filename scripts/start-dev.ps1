$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendPython = Join-Path $repoRoot "backend\venv\Scripts\python.exe"
$frontendNodeModules = Join-Path $repoRoot "frontend\node_modules"

$env:ComSpec = Join-Path $env:WINDIR "System32\cmd.exe"

if (!(Test-Path $backendPython)) {
    throw "Backend virtual environment not found. Run the backend setup in DEVELOPMENT.md first."
}

if (!(Test-Path $frontendNodeModules)) {
    throw "Frontend node_modules not found. Run npm install in frontend first."
}

Write-Host "Starting CampusIQ backend on http://127.0.0.1:8000"
$backendJob = Start-Job -Name "campusiq-backend" -ArgumentList $repoRoot, $env:ComSpec -ScriptBlock {
    param($root, $comspec)
    $env:ComSpec = $comspec
    Set-Location (Join-Path $root "backend")
    & ".\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
}

try {
    Start-Sleep -Seconds 2
    Write-Host "Starting CampusIQ frontend on http://localhost:5173"
    Set-Location (Join-Path $repoRoot "frontend")
    npm run dev
}
finally {
    Write-Host "Stopping CampusIQ backend job"
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Receive-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
    Set-Location $repoRoot
}

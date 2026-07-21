$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$venvRoot = Join-Path $projectRoot ".venv"
$venvPython = Join-Path $venvRoot "Scripts\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    & python -m venv $venvRoot
  } elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3.12 -m venv $venvRoot
  } else {
    throw "Python was not found. Install Python 3.10-3.12 and run setup.ps1 again."
  }
  if ($LASTEXITCODE -ne 0) { throw "Unable to create the Refined1 virtual environment." }
}

& $venvPython -c "import sys; assert (3, 10) <= sys.version_info[:2] <= (3, 12), 'Refined1 requires Python 3.10-3.12'"
if ($LASTEXITCODE -ne 0) { throw "The existing .venv uses an unsupported Python version. Remove .venv and run setup.ps1 again." }

& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Unable to upgrade pip." }
& $venvPython -m pip install --only-binary=:all: --retries 5 --timeout 60 -r (Join-Path $projectRoot "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Unable to install the Refined1 core dependencies." }

& $venvPython (Join-Path $projectRoot "scripts\verify_runtime.py")
if ($LASTEXITCODE -ne 0) { throw "Refined1 runtime verification failed." }

Write-Host ""
Write-Host "Refined1 runtime is ready."
Write-Host "Start with: .\start-web.bat"

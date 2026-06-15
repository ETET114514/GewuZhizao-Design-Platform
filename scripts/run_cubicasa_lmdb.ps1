$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".conda-cubicasa"
$project = Join-Path $root "third_party\CubiCasa5k"

$env:PATH = (Join-Path $envPath "Library\bin") + ";" +
  (Join-Path $envPath "Scripts") + ";" +
  $envPath + ";" + $env:PATH

Set-Location $project

foreach ($split in @("val.txt", "test.txt", "train.txt")) {
  Write-Host "[$(Get-Date -Format s)] creating LMDB entries for $split"
  & (Join-Path $envPath "python.exe") create_lmdb.py --txt $split --data-path "data/cubicasa5k/" --lmdb "data/cubicasa5k/cubi_lmdb/" --log-path "runs_cubi/lmdb"
  if ($LASTEXITCODE -ne 0) {
    throw "create_lmdb.py failed for $split with exit code $LASTEXITCODE"
  }
}

Write-Host "[$(Get-Date -Format s)] LMDB creation complete"

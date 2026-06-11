$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$env:PORT = if ($env:PORT) { $env:PORT } else { "8787" }
Write-Host "Starting floor-plan AI inference service on http://127.0.0.1:$env:PORT"
python floorplan_server.py


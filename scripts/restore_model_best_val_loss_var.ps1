param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$partsDir = Join-Path $repoRoot "models/model_best_val_loss_var.pkl.parts"
$manifestPath = Join-Path $partsDir "manifest.json"
$outputPath = Join-Path $repoRoot "models/model_best_val_loss_var.pkl"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Missing manifest: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if ((Test-Path -LiteralPath $outputPath) -and -not $Force) {
  $existingHash = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($existingHash -eq $manifest.sha256) {
    Write-Host "Model already exists and hash matches: $outputPath"
    exit 0
  }
  throw "Output already exists with a different hash. Re-run with -Force to overwrite: $outputPath"
}

$outputStream = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
try {
  foreach ($part in $manifest.parts) {
    $partPath = Join-Path $partsDir $part.name
    if (-not (Test-Path -LiteralPath $partPath)) {
      throw "Missing part: $partPath"
    }
    $partHash = (Get-FileHash -LiteralPath $partPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($partHash -ne $part.sha256) {
      throw "Hash mismatch for $($part.name)"
    }
    $inputStream = [System.IO.File]::OpenRead($partPath)
    try {
      $inputStream.CopyTo($outputStream)
    } finally {
      $inputStream.Dispose()
    }
  }
} finally {
  $outputStream.Dispose()
}

$modelHash = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($modelHash -ne $manifest.sha256) {
  throw "Rebuilt model hash mismatch: $modelHash"
}

Write-Host "Restored model: $outputPath"
Write-Host "SHA256: $modelHash"

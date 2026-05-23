$ErrorActionPreference = "Continue"

Write-Host "TRELLIS.2 environment check"
Write-Host "==========================="

$video = Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion
Write-Host ""
Write-Host "GPU:"
$video | Format-Table -AutoSize

Write-Host ""
Write-Host "Commands:"
foreach ($command in @("nvidia-smi", "wsl", "conda", "python", "docker")) {
  $found = Get-Command $command -ErrorAction SilentlyContinue
  if ($found) {
    Write-Host "  OK      $command -> $($found.Source)"
  } else {
    Write-Host "  MISSING $command"
  }
}

Write-Host ""
if (-not (Get-Command nvidia-smi -ErrorAction SilentlyContinue)) {
  Write-Host "Result: this machine is not ready for TRELLIS.2 inference."
  Write-Host "Reason: TRELLIS.2 requires Linux plus an NVIDIA CUDA GPU with at least 24GB VRAM."
  exit 1
}

nvidia-smi
Write-Host ""
Write-Host "If the GPU has >=24GB VRAM, run install-trellis2-linux.sh inside Linux/WSL."

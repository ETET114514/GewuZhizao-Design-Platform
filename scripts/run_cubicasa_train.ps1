param(
    [int]$Epochs = 5,
    [int]$BatchSize = 26,
    [double]$LRate = 1e-3,
    [string]$RunName = "finetune",
    [string]$Weights = "model_best_val_loss_var.pkl",
    [string]$DataPath = "data/cubicasa5k/",
    [ValidateSet("lmdb", "txt")]
    [string]$DataFormat = "lmdb",
    [string]$LmdbFolder = "cubi_lmdb/",
    [int]$MaxTrainBatches = 0,
    [int]$MaxValBatches = 0
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$conda = Join-Path $env:USERPROFILE "miniforge3\_conda.exe"
$envPath = Join-Path $repo ".conda-cubicasa"
$cubi = Join-Path $repo "third_party\CubiCasa5k"

if (-not (Test-Path $conda)) {
    throw "Cannot find conda executable at $conda"
}
if (-not (Test-Path $envPath)) {
    throw "Cannot find conda env at $envPath"
}

Set-Location $cubi

& $conda run -p $envPath python train.py `
    --data-path $DataPath `
    --data-format $DataFormat `
    --lmdb-folder $LmdbFolder `
    --weights $Weights `
    --new-hyperparams True `
    --n-epoch $Epochs `
    --batch-size $BatchSize `
    --l-rate $LRate `
    --image-size 256 `
    --log-path "runs_cubi/$RunName" `
    --plot-samples False `
    --max-train-batches $MaxTrainBatches `
    --max-val-batches $MaxValBatches

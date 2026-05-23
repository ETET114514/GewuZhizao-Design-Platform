param(
  [int]$Port = 8000,
  [switch]$Serve
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Test-PortAvailable {
  param([int]$CandidatePort)

  $listener = $null
  try {
    $address = [System.Net.IPAddress]::Parse("127.0.0.1")
    $listener = [System.Net.Sockets.TcpListener]::new($address, $CandidatePort)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".htm"  { return "text/html; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".js"   { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif"  { return "image/gif" }
    ".svg"  { return "image/svg+xml" }
    ".webp" { return "image/webp" }
    ".ico"  { return "image/x-icon" }
    default { return "application/octet-stream" }
  }
}

function Start-StaticServer {
  param([int]$ListenPort)

  $root = [System.IO.Path]::GetFullPath($ProjectRoot)
  $address = [System.Net.IPAddress]::Parse("127.0.0.1")
  $listener = [System.Net.Sockets.TcpListener]::new($address, $ListenPort)
  $listener.Start()

  Write-Host "GewuZhizao Design Platform is running."
  Write-Host "Root: $root"
  Write-Host "URL:  http://127.0.0.1:$ListenPort/index.html"
  Write-Host "Close this window to stop the server."

  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      while ($true) {
        $header = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($header)) {
          break
        }
      }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      $parts = $requestLine.Split(" ")
      $requestPath = "/"
      if ($parts.Length -ge 2) {
        $requestPath = $parts[1].Split("?")[0]
      }

      $requestPath = [System.Uri]::UnescapeDataString($requestPath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($requestPath)) {
        $requestPath = "index.html"
      }

      $requestPath = $requestPath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
      $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $requestPath))

      if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $header = "HTTP/1.1 403 Forbidden`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($body, 0, $body.Length)
        continue
      }

      if ([System.IO.Directory]::Exists($filePath)) {
        $filePath = [System.IO.Path]::Combine($filePath, "index.html")
      }

      if (-not [System.IO.File]::Exists($filePath)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($body, 0, $body.Length)
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $contentType = Get-ContentType $filePath
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($bytes, 0, $bytes.Length)
    } finally {
      $client.Close()
    }
  }
}

if ($Serve) {
  Start-StaticServer $Port
  exit 0
}

$selectedPort = $null
foreach ($candidate in $Port..($Port + 30)) {
  if (Test-PortAvailable $candidate) {
    $selectedPort = $candidate
    break
  }
}

if (-not $selectedPort) {
  Write-Host "No available local port found from $Port to $($Port + 30)."
  exit 1
}

$url = "http://127.0.0.1:$selectedPort/index.html"
$scriptPath = $MyInvocation.MyCommand.Path

Write-Host "Starting GewuZhizao Design Platform..."
Write-Host "URL:    $url"

Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $scriptPath, "-Serve", "-Port", "$selectedPort") `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Normal

Start-Sleep -Seconds 2
Start-Process $url

param(
  [switch]$IncludeLegacy
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$scanFiles = @(
  "index.html",
  "sw.js"
)

$scanFiles += Get-ChildItem -Path "js","css" -Recurse -File |
  Where-Object {
    $IncludeLegacy -or ($_.FullName -notmatch "\\js\\legacy\\")
  } |
  ForEach-Object { Resolve-Path -Relative $_.FullName }

function Convert-AssetPathLiteral {
  param([string]$Path)

  $clean = $Path -replace '^\.\/',''
  [regex]::Replace($clean, '\\u([0-9A-Fa-f]{4})', {
    param($match)
    [string][char][Convert]::ToInt32($match.Groups[1].Value, 16)
  })
}

$imageRefs = [System.Collections.Generic.SortedSet[string]]::new()
$assetPatterns = @(
  '"(?<path>\.\/images\/[^"]+)"',
  "'(?<path>\.\/images\/[^']+)'",
  'url\((?<path>\.\/images\/[^)]+)\)'
)

foreach ($file in $scanFiles) {
  if (-not (Test-Path -LiteralPath $file)) { continue }
  $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $file
  foreach ($pattern in $assetPatterns) {
    foreach ($match in [regex]::Matches($text, $pattern)) {
      $path = Convert-AssetPathLiteral $match.Groups["path"].Value.Trim("'`" ")
      [void]$imageRefs.Add($path)
    }
  }
}

$missing = @()
foreach ($path in $imageRefs) {
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $path
  }
}

$copyArtifacts = Get-ChildItem -Path "images" -Recurse -Force |
  Where-Object { $_.Name -like "* - 복사본*" } |
  ForEach-Object { Resolve-Path -Relative $_.FullName }

Write-Host "Scanned files: $($scanFiles.Count)"
Write-Host "Referenced image assets: $($imageRefs.Count)"
Write-Host ""

if ($missing.Count) {
  Write-Host "Missing referenced image assets:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host "Missing referenced image assets: none" -ForegroundColor Green
}

Write-Host ""
if ($copyArtifacts.Count) {
  Write-Host "Windows copy artifacts ignored by Git:"
  $copyArtifacts | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host "Windows copy artifacts: none"
}

if ($missing.Count) {
  exit 1
}

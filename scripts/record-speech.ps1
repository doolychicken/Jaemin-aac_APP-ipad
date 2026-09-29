# Generate Korean audio locally using the installed Windows voice.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$catalog = Get-Content -LiteralPath (Join-Path $root '_local/speech/catalog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$output = Join-Path $root '_local/speech/wav'
New-Item -ItemType Directory -Path $output -Force | Out-Null
Add-Type -AssemblyName System.Speech
$speaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$speaker.SelectVoice('Microsoft Heami Desktop')
$speaker.Rate = -1
$format = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$hash = [System.Security.Cryptography.SHA256]::Create()
try {
  for ($i = 0; $i -lt $catalog.Count; $i++) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($catalog[$i])
    $name = [BitConverter]::ToString($hash.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    $target = Join-Path $output ($name + '.wav')
    if (-not (Test-Path -LiteralPath $target)) {
      $speaker.SetOutputToWaveFile($target, $format)
      $speaker.Speak($catalog[$i])
      $speaker.SetOutputToNull()
    }
    if ($i % 100 -eq 0) { Write-Output "Recorded $i / $($catalog.Count)" }
  }
} finally {
  $speaker.Dispose()
  $hash.Dispose()
}
Write-Output "Recorded all $($catalog.Count) phrases."

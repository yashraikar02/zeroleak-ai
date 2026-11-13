$srcDir = 'C:\Users\yashr\.gemini\antigravity\scratch\privaguard-ai\src'
$files = Get-ChildItem -Recurse -File -Path $srcDir -Include '*.jsx','*.js','*.css'

$subs = [ordered]@{
  '#38B879' = '#E5484D'
  '#2FA36A' = '#CC3337'
  '#2e9d68' = '#CC3337'
  '#101311' = '#0F0F0F'
  '#0B0D0C' = '#0A0A0A'
  '#151A17' = '#141414'
  '#1A201C' = '#1A1A1A'
  '#212924' = '#202020'
  '#252C27' = '#2A2A2A'
  '#313A34' = '#3A3A3A'
  '#9AA69E' = '#9A9A9A'
  '#F1F5F2' = '#F5F5F5'
}

$changed = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  $newContent = $content
  foreach ($old in $subs.Keys) {
    $newContent = $newContent.Replace($old, $subs[$old])
  }
  if ($newContent -ne $content) {
    Set-Content $file.FullName $newContent -Encoding UTF8 -NoNewline
    $changed++
    Write-Host "Updated: $($file.Name)"
  }
}
Write-Host "Done - $changed file(s) updated."

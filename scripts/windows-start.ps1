$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'data\logs'
$logPath = Join-Path $logDirectory 'windows-host.log'
$envPath = Join-Path $projectRoot 'data\host-executor.env'

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location $projectRoot

Get-Content -LiteralPath $envPath | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
  }
}

"[$(Get-Date -Format o)] Starting devctl Windows host executor." | Out-File -FilePath $logPath -Append
& npm.cmd run dev:server *>> $logPath

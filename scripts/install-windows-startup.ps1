$ErrorActionPreference = 'Stop'

$taskName = 'devctl'
$startScript = Join-Path $PSScriptRoot 'windows-start.ps1'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot 'data\host-executor.env'

if (-not (Test-Path -LiteralPath $envPath)) {
  $token = [Guid]::NewGuid().ToString('N')
  @(
    "DEVCTL_HOST_EXECUTOR_TOKEN=$token"
    "VITE_API_PROXY_TOKEN=$token"
  ) | Set-Content -LiteralPath $envPath -Encoding Ascii
}

$actionArguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $actionArguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Description 'Start the devctl host executor so managed development servers run as native Windows processes.' `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Write-Output 'Installed and started the devctl Windows host executor task.'

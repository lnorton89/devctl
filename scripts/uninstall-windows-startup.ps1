$ErrorActionPreference = 'Stop'

$taskName = 'devctl'
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $task) {
  Write-Output 'The devctl Windows startup task is not installed.'
  exit 0
}

Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Output 'Removed the devctl Windows startup task.'

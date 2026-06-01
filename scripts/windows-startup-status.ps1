$ErrorActionPreference = 'Stop'

$taskName = 'devctl'
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $task) {
  Write-Output 'devctl Windows startup task: not installed'
  exit 0
}

$info = Get-ScheduledTaskInfo -TaskName $taskName
Write-Output "devctl Windows startup task: $($task.State)"
Write-Output "Last run: $($info.LastRunTime)"
Write-Output "Last result: $($info.LastTaskResult)"

$folder = "c:\WokManeja\WokManeja"
$filter = "*.*"

$fsw = New-Object IO.FileSystemWatcher $folder, $filter -Property @{
    IncludeSubdirectories = $true
    NotifyFilter = [IO.NotifyFilters]::FileName, [IO.NotifyFilters]::LastWrite
}

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # Ignore changes inside the .git folder to prevent infinite loops
    if ($path -notmatch "\\\.git\\") {
        Write-Host "Detected $changeType on $path. Committing..."
        
        # We use a short sleep to allow the file lock to be released
        Start-Sleep -Milliseconds 500
        
        git add .
        git commit -m "Auto-commit: $changeType on $(Split-Path $path -Leaf)"
        
        # Attempt to push to remote
        # Note: If your remote isn't set up yet, this will just show an error but continue watching
        git push origin main
    }
}

# Register events for file changes
Register-ObjectEvent $fsw Created -SourceIdentifier FileCreated -Action $action
Register-ObjectEvent $fsw Changed -SourceIdentifier FileChanged -Action $action
Register-ObjectEvent $fsw Deleted -SourceIdentifier FileDeleted -Action $action
Register-ObjectEvent $fsw Renamed -SourceIdentifier FileRenamed -Action $action

Write-Host "Watching for changes in $folder..."
Write-Host "Press Ctrl+C to stop the watcher."

try {
    while ($true) { Start-Sleep -Seconds 1 }
}
finally {
    # Cleanup when exiting
    Unregister-Event -SourceIdentifier FileCreated
    Unregister-Event -SourceIdentifier FileChanged
    Unregister-Event -SourceIdentifier FileDeleted
    Unregister-Event -SourceIdentifier FileRenamed
    $fsw.Dispose()
    Write-Host "Watcher stopped."
}

# Sync Command Center changes from local (C:) to network (P:)
# Run this after testing changes locally

$src = 'C:\agentic-os-v2\command-centre'
$dst = 'P:\Ai\Agentic OS\command-centre'

Write-Host 'Syncing Command Center from local to network...'

# Sync source code
Copy-Item "$src\src" -Destination "$dst" -Recurse -Force
Write-Host '? Synced src/'

# Sync scripts
Copy-Item "$src\scripts" -Destination "$dst" -Recurse -Force
Write-Host '? Synced scripts/'

# Sync public assets
Copy-Item "$src\public" -Destination "$dst" -Recurse -Force
Write-Host '? Synced public/'

# Sync config files
Copy-Item "$src\package.json" "$dst\package.json" -Force
Copy-Item "$src\tsconfig.json" "$dst\tsconfig.json" -Force
Write-Host '? Synced config files'

# Sync built artifacts (.next)
Write-Host 'Syncing .next (built artifacts)...'
Copy-Item "$src\.next" -Destination "$dst" -Recurse -Force
Write-Host '? Synced .next/'

Write-Host ''
Write-Host 'Sync complete. Changes pushed to network drive.'
Write-Host "Last synced: $(Get-Date)"

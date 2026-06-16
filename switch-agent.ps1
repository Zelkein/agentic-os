# Agent Manager - Switch between Agentic-OS agents in Claude Code
param(
    [Parameter(Mandatory=$false)]
    [string]$Agent,
    [switch]$List,
    [switch]$Status
)

$configPath = "$PSScriptRoot\agents-config.json"

if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: agents-config.json not found" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json

if ($List) {
    Write-Host "Available Agents:" -ForegroundColor Cyan
    foreach ($agentName in $config.agents.PSObject.Properties.Name) {
        $agent = $config.agents.$agentName
        Write-Host "  [$($agent.name)]"
        Write-Host "    Model: $($agent.model)"
        Write-Host "    Status: $($agent.status)"
    }
    exit 0
}

if ($Status) {
    $current = [System.Environment]::GetEnvironmentVariable('ANTHROPIC_MODEL', 'User')
    Write-Host "Current Model: $current" -ForegroundColor Cyan
    exit 0
}

if (-not $Agent) {
    Write-Host "ERROR: -Agent parameter required" -ForegroundColor Red
    exit 1
}

$agentLower = $Agent.ToLower()
if (-not $config.agents.$agentLower) {
    Write-Host "ERROR: Agent not found" -ForegroundColor Red
    exit 1
}

$targetAgent = $config.agents.$agentLower
Write-Host "Switching to: $($targetAgent.name)" -ForegroundColor Cyan

$apiKeySource = $targetAgent.api_key_source
$apiKeyFile = Join-Path $PSScriptRoot $apiKeySource

if (-not (Test-Path $apiKeyFile)) {
    Write-Host "WARNING: API key file not found" -ForegroundColor Yellow
    $apiKey = ""
}
else {
    $keyContent = Get-Content $apiKeyFile -Raw
    $lines = $keyContent.Split([Environment]::NewLine)
    foreach ($line in $lines) {
        if ($line.Contains('=')) {
            $parts = $line.Split('=')
            if ($parts.Count -eq 2) {
                $apiKey = $parts[1].Trim()
                if ($apiKey) { break }
            }
        }
    }
}

if (-not $apiKey) {
    Write-Host "ERROR: Could not find API key" -ForegroundColor Red
    exit 1
}

Write-Host "Setting environment variables..." -ForegroundColor Cyan

$envVars = $targetAgent.env_vars | Get-Member -MemberType NoteProperty
foreach ($var in $envVars) {
    $varName = $var.Name
    $varValue = $targetAgent.env_vars.$varName
    [System.Environment]::SetEnvironmentVariable($varName, $varValue, 'User')
    Write-Host "  OK: $varName" -ForegroundColor Green
}

[System.Environment]::SetEnvironmentVariable('ANTHROPIC_AUTH_TOKEN', $apiKey, 'User')
Write-Host "  OK: ANTHROPIC_AUTH_TOKEN" -ForegroundColor Green

[System.Environment]::SetEnvironmentVariable('AGENTIC_OS_AGENT', $agentLower, 'User')
[System.Environment]::SetEnvironmentVariable('AGENTIC_OS_AGENT_NAME', $targetAgent.name, 'User')
[System.Environment]::SetEnvironmentVariable('AGENTIC_OS_AGENT_ROLE', $targetAgent.role, 'User')

Write-Host ""
Write-Host "DONE! Switch agent to $($targetAgent.name)" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Fully close Claude Code and reopen it" -ForegroundColor Cyan

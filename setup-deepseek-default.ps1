# Setup Deepseek as Default Agent in Claude Code
# Routes Claude Code UI to use deepseek-v4-flash instead of Claude models
# Result: Claude Code becomes Jasper (deepseek-v4-flash backend)

Write-Host "Setting up Deepseek as default agent in Claude Code..." -ForegroundColor Cyan
Write-Host ""

# Get API key from .secrets/deepseek.conf
$deepseekConfPath = "$PSScriptRoot\.secrets\deepseek.conf"
$apiKey = $null

if (Test-Path $deepseekConfPath) {
    $confContent = Get-Content $deepseekConfPath -Raw
    if ($confContent -match 'DEEPSEEK_API_KEY=(.+)') {
        $apiKey = $matches[1].Trim()
        Write-Host "✓ Found Deepseek API key in .secrets/deepseek.conf" -ForegroundColor Green
    }
}

if (-not $apiKey) {
    Write-Host "✗ ERROR: Deepseek API key not found in .secrets/deepseek.conf" -ForegroundColor Red
    Write-Host "Please ensure DEEPSEEK_API_KEY is set in that file." -ForegroundColor Yellow
    exit 1
}

# Set environment variables (persistent, user-level)
Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Cyan

$envVars = @{
    'ANTHROPIC_BASE_URL' = 'https://api.deepseek.com/v1'
    'ANTHROPIC_AUTH_TOKEN' = $apiKey
    'ANTHROPIC_MODEL' = 'deepseek-v4-flash'
    'ANTHROPIC_DEFAULT_OPUS_MODEL' = 'deepseek-v4-flash'
    'ANTHROPIC_DEFAULT_SONNET_MODEL' = 'deepseek-v4-flash'
    'ANTHROPIC_DEFAULT_HAIKU_MODEL' = 'deepseek-v4-flash'
    'CLAUDE_CODE_SUBAGENT_MODEL' = 'deepseek-v4-flash'
    'CLAUDE_CODE_EFFORT_LEVEL' = 'max'
    'CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS' = '1'
    'ENABLE_TOOL_SEARCH' = '0'
    'AGENTIC_OS_ROOT' = $PSScriptRoot
}

foreach ($var in $envVars.GetEnumerator()) {
    [System.Environment]::SetEnvironmentVariable($var.Key, $var.Value, 'User')
    Write-Host "  ✓ $($var.Key)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✓ All environment variables set." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Fully exit Claude Code from the tray, then reopen it." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restart:" -ForegroundColor Cyan
Write-Host "  - Claude Code will use deepseek-v4-flash as backend" -ForegroundColor Green
Write-Host "  - You are now speaking to Jasper (deepseek-v4-flash)" -ForegroundColor Green
Write-Host "  - Zero Claude tokens consumed" -ForegroundColor Green
Write-Host "  - JASPER.md system instructions will apply" -ForegroundColor Green
Write-Host ""

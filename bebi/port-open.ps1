<#
.SYNOPSIS
Opens a specified TCP or UDP port in the Windows Firewall by creating an inbound rule.

.DESCRIPTION
This script creates a new inbound rule in the Windows Defender Firewall
to allow traffic on a specified port number and protocol.
It checks for existing rules with the same port, protocol, and direction
to avoid duplicates.
It requires Administrator privileges to run.

.PARAMETER Port
The port number to open (e.g., 80, 443, 8080).
Must be a valid port number between 1 and 65535.

.PARAMETER Protocol
The network protocol for the rule (TCP or UDP).

.EXAMPLE
# Open TCP port 8080
.\Open-FirewallPort.ps1 -Port 8080 -Protocol TCP

.EXAMPLE
# Open UDP port 1194
.\Open-FirewallPort.ps1 -Port 1194 -Protocol UDP

.NOTES
Requires Administrator privileges.
The rule is created for all network profiles (Domain, Private, Public)
unless specified otherwise.
#>
[CmdletBinding()]
Param(
    [Parameter(Mandatory = $true,
        HelpMessage = "Specify the port number (1-65535) to open.")]
    [ValidateRange(1, 65535)]
    [int]$Port,

    [Parameter(Mandatory = $true,
        HelpMessage = "Specify the protocol (TCP or UDP) for the rule.")]
    [ValidateSet('TCP', 'UDP')]
    [string]$Protocol
)

#region Check for Administrator Privileges
Write-Verbose "Checking for Administrator privileges..."
$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script requires Administrator privileges to modify firewall rules. Please right-click PowerShell and select 'Run as Administrator'."
    Exit 1
}
Write-Verbose "Running with Administrator privileges."
#endregion

# Define rule properties
$ruleName = "Allow $($Protocol.ToUpper()) Port $Port"
$ruleDescription = "Automatically created rule to allow inbound $($Protocol.ToUpper()) traffic on port $Port."

# Check if a similar rule already exists
Write-Verbose "Checking for existing rule '$ruleName'..."
try {
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

    if ($existingRule) {
        Write-Warning "A firewall rule named '$ruleName' already exists."
        Write-Warning "Rule found:"
        $existingRule | Select-Object DisplayName, Description, Enabled, Direction, Protocol, LocalPort, RemotePort, Action, Profile
        Write-Information "No new rule will be created."
        Exit 0 # Exit gracefully as the rule is already there
    }
    Write-Verbose "No existing rule found with the exact display name '$ruleName'."

    # More granular check: Check if *any* rule allows this specific port/protocol/direction combination
    # Sometimes display names differ but the underlying rule is the same
    $existingRuleByProps = Get-NetFirewallRule -Direction Inbound -Protocol $Protocol -LocalPort $Port -Action Allow -ErrorAction SilentlyContinue | Where-Object { $_.Enabled -eq $true }

    if ($existingRuleByProps) {
        Write-Warning "An existing rule (or rules) already allows inbound $($Protocol.ToUpper()) traffic on port $Port."
        Write-Warning "Matching rule(s) found:"
        $existingRuleByProps | Select-Object DisplayName, Description, Enabled, Direction, Protocol, LocalPort, RemotePort, Action, Profile
        Write-Information "No new rule will be created."
        Exit 0 # Exit gracefully as the rule is already there via properties
    }
    Write-Verbose "No existing rule found allowing inbound $($Protocol.ToUpper()) traffic on port $Port."

}
catch {
    Write-Error "An error occurred while checking for existing firewall rules: $($_.Exception.Message)"
    # Continue trying to create the rule in case the check failed but creation might succeed
}

# Create the new firewall rule
Write-Information "Creating new inbound firewall rule: '$ruleName' (Port: $Port, Protocol: $($Protocol.ToUpper()))..."

try {
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Description $ruleDescription `
        -Direction Inbound `
        -Protocol $Protocol `
        -LocalPort $Port `
        -Action Allow `
        -Enabled True `
        -Profile Any # Or specify specific profiles like Domain, Private, Public

    Write-Information "Successfully created firewall rule: '$ruleName'."
    Write-Verbose "Rule details:"
    Get-NetFirewallRule -DisplayName $ruleName | Select-Object DisplayName, Description, Enabled, Direction, Protocol, LocalPort, RemotePort, Action, Profile

}
catch {
    Write-Error "Failed to create firewall rule '$ruleName'."
    Write-Error "Error details: $($_.Exception.Message)"
    Exit 1 # Indicate failure
}

Exit 0 # Indicate success

# .\port-open.ps1 -Port 8237 -Protocol TCP
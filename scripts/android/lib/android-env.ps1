#Requires -Version 5.1
<#
.SYNOPSIS
  Shared Android SDK / AVD helpers for KineFit UI verify (Pixel 9a).

.DESCRIPTION
  Dot-source from verify/install scripts:
    . (Join-Path $PSScriptRoot "lib\android-env.ps1")

  Preferred UI test AVD: Pixel_9A (also accepts Studio default Pixel_9a).
  Policy: zero login / zero Garmin OAuth — device selection only.
#>

$script:KineFitPreferredAvdNames = @("Pixel_9A", "Pixel_9a")
$script:KineFitPreferredAvdCreateName = "Pixel_9A"
$script:KineFitPixelDeviceId = "pixel_9a"

function Get-AndroidSdkRoot {
    $candidates = @()
    if ($env:ANDROID_HOME) { $candidates += $env:ANDROID_HOME }
    if ($env:ANDROID_SDK_ROOT) { $candidates += $env:ANDROID_SDK_ROOT }
    $candidates += (Join-Path $env:LOCALAPPDATA "Android\Sdk")
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c)) {
            return (Resolve-Path -LiteralPath $c).Path
        }
    }
    return $null
}

function Find-SdkTool {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][string]$FileName
    )
    $sdk = Get-AndroidSdkRoot
    $candidates = @()
    if ($sdk) {
        $candidates += (Join-Path $sdk $RelativePath)
        $cmdTools = Join-Path $sdk "cmdline-tools"
        if (Test-Path -LiteralPath $cmdTools) {
            $found = Get-ChildItem -Path $cmdTools -Recurse -Filter $FileName -ErrorAction SilentlyContinue |
                Sort-Object FullName -Descending |
                Select-Object -First 3 -ExpandProperty FullName
            $candidates += $found
        }
        $legacy = Join-Path $sdk "tools\bin\$FileName"
        $candidates += $legacy
    }
    $cmd = Get-Command ($FileName -replace '\.bat$', '') -ErrorAction SilentlyContinue
    if ($cmd) { $candidates += $cmd.Source }

    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c)) {
            return (Resolve-Path -LiteralPath $c).Path
        }
    }
    return $null
}

function Find-Adb {
    # Prefer SDK platform-tools (ANDROID_HOME / ANDROID_SDK_ROOT) over PATH copies.
    $ordered = @()
    foreach ($root in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA "Android\Sdk"))) {
        if ($root) {
            $candidate = Join-Path $root "platform-tools\adb.exe"
            if ((Test-Path -LiteralPath $candidate) -and ($ordered -notcontains $candidate)) {
                $ordered += $candidate
            }
        }
    }
    $viaSdk = Find-SdkTool -RelativePath "platform-tools\adb.exe" -FileName "adb.exe"
    if ($viaSdk -and ($ordered -notcontains $viaSdk)) { $ordered += $viaSdk }
    foreach ($c in $ordered) {
        if ($c -and (Test-Path -LiteralPath $c)) {
            return (Resolve-Path -LiteralPath $c).Path
        }
    }
    return $null
}

function Reset-AdbServer {
    <#
      Kill stale adb daemons and start a single server from SDK platform-tools.
      Does NOT kill the emulator UI / qemu.
    #>
    param([string]$AdbPath = "")
    if (-not $AdbPath) { $AdbPath = Find-Adb }
    if (-not $AdbPath) { throw "adb non trovato per Reset-AdbServer." }

    Write-Host "Reset adb server ($AdbPath)..." -ForegroundColor DarkGray
    $null = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("kill-server")
    Start-Sleep -Seconds 2
    Get-Process -Name "adb" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    $null = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("start-server")
    Start-Sleep -Seconds 1
}

function Find-Emulator {
    return Find-SdkTool -RelativePath "emulator\emulator.exe" -FileName "emulator.exe"
}

function Find-AvdManager {
    return Find-SdkTool -RelativePath "cmdline-tools\latest\bin\avdmanager.bat" -FileName "avdmanager.bat"
}

function Find-SdkManager {
    return Find-SdkTool -RelativePath "cmdline-tools\latest\bin\sdkmanager.bat" -FileName "sdkmanager.bat"
}

function Invoke-AndroidNative {
    <#
      Run adb/emulator without treating stderr (daemon start, etc.) as terminating.
    #>
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$ArgumentList
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $out = & $FilePath @ArgumentList 2>&1
        $textLines = @()
        foreach ($item in @($out)) {
            if ($item -is [System.Management.Automation.ErrorRecord]) {
                $textLines += "$($item.Exception.Message)"
            } else {
                $textLines += "$item"
            }
        }
        return $textLines
    } finally {
        $ErrorActionPreference = $prev
    }
}

function Get-ListedAvds {
    $emu = Find-Emulator
    if (-not $emu) { return @() }
    $out = Invoke-AndroidNative -FilePath $emu -ArgumentList @("-list-avds")
    if ($null -eq $out) { return @() }
    $names = @()
    foreach ($line in @($out)) {
        $n = ("$line").Trim()
        if ($n -and $n -notmatch '(?i)daemon (not running|started)') { $names += $n }
    }
    return $names
}

function Resolve-PreferredAvdName {
    param([switch]$AllowMissing)
    $listed = @(Get-ListedAvds)
    foreach ($pref in $script:KineFitPreferredAvdNames) {
        $hit = $listed | Where-Object { $_.Equals($pref, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
        if ($hit) { return $hit }
    }
    $fuzzy = $listed | Where-Object { $_ -match '(?i)pixel.?9a' } | Select-Object -First 1
    if ($fuzzy) { return $fuzzy }

    if ($AllowMissing) {
        return $script:KineFitPreferredAvdCreateName
    }
    return $null
}

function Test-AdbDaemonHealthy {
    <#
      True when `adb devices` can talk to the local daemon (port 5037).
      False on cannot-connect / connection refused / protocol faults after snapshot load.
    #>
    param([Parameter(Mandatory = $true)][string]$AdbPath)
    $devicesOut = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("devices")
    $text = (@($devicesOut) -join "`n")
    if ($text -match '(?i)cannot connect to daemon|daemon could not be started|connection refused|failed to start daemon|protocol fault|cannot bind.*5037|Address already in use') {
        return $false
    }
    # Healthy daemon always prints the header even with zero devices.
    if ($text -match '(?i)List of devices attached') {
        return $true
    }
    # Empty / garbage output after snapshot — treat as unhealthy.
    return $false
}

function Get-AdbOnlineSerials {
    param([Parameter(Mandatory = $true)][string]$AdbPath)
    $devicesOut = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("devices")
    $online = @()
    foreach ($line in $devicesOut) {
        if ($line -match "^(\S+)\s+device\s*$") {
            $online += $Matches[1]
        }
    }
    return $online
}

function Get-EmulatorAvdNameForSerial {
    param(
        [Parameter(Mandatory = $true)][string]$AdbPath,
        [Parameter(Mandatory = $true)][string]$Serial
    )
    try {
        $name = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("-s", $Serial, "emu", "avd", "name")
        if ($name) {
            $first = (@($name) | Where-Object {
                    $_ -and ("$_").Trim() -ne "" -and ("$_") -notmatch "OK" -and ("$_") -notmatch '(?i)daemon'
                } | Select-Object -First 1)
            if ($first) { return ("$first").Trim() }
        }
    } catch { }
    try {
        $prop = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("-s", $Serial, "shell", "getprop", "ro.boot.qemu.avd_name")
        $t = (($prop | Select-Object -First 1) | ForEach-Object { "$_" }).Trim()
        if ($t) { return $t }
    } catch { }
    return $null
}

function Select-PreferredDeviceSerial {
    param(
        [Parameter(Mandatory = $true)][string]$AdbPath,
        [Parameter(Mandatory = $true)][string[]]$OnlineSerials,
        [string]$PreferredAvd
    )
    if ($OnlineSerials.Count -eq 0) { return $null }
    if ($OnlineSerials.Count -eq 1) { return $OnlineSerials[0] }

    if ($PreferredAvd) {
        foreach ($s in $OnlineSerials) {
            if ($s -notmatch "^emulator-") { continue }
            $avd = Get-EmulatorAvdNameForSerial -AdbPath $AdbPath -Serial $s
            if ($avd -and $avd.Equals($PreferredAvd, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $s
            }
            if ($avd -and $avd -match '(?i)pixel.?9a') {
                return $s
            }
        }
    }

    $emu = $OnlineSerials | Where-Object { $_ -match "^emulator-" } | Select-Object -First 1
    if ($emu) { return $emu }
    return $OnlineSerials[0]
}

function Wait-AdbBootCompleted {
    param(
        [Parameter(Mandatory = $true)][string]$AdbPath,
        [Parameter(Mandatory = $true)][string]$Serial,
        [int]$TimeoutSec = 300
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $didReconnect = $false
    $didDaemonReset = $false
    while ((Get-Date) -lt $deadline) {
        $stateLines = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("-s", $Serial, "get-state")
        $stateText = (@($stateLines) -join "`n")
        if (-not $didDaemonReset -and ($stateText -match '(?i)cannot connect to daemon|connection refused|5037')) {
            Write-Host "WARN: adb get-state daemon fault; Reset-AdbServer..." -ForegroundColor Yellow
            Reset-AdbServer -AdbPath $AdbPath
            $didDaemonReset = $true
            Start-Sleep -Seconds 2
            continue
        }
        $state = (($stateLines | Where-Object { $_ -notmatch '(?i)daemon' } | Select-Object -First 1) | ForEach-Object { "$_" }).Trim()
        if ($state -eq "offline" -and -not $didReconnect) {
            $null = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("reconnect")
            $didReconnect = $true
            Start-Sleep -Seconds 2
            continue
        }
        if ($state -eq "device") {
            $bootLines = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("-s", $Serial, "shell", "getprop", "sys.boot_completed")
            $boot = (($bootLines | Where-Object { $_ -notmatch '(?i)daemon' } | Select-Object -First 1) | ForEach-Object { "$_" }).Trim()
            if ($boot -eq "1") {
                Start-Sleep -Seconds 2
                return $true
            }
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Find-SystemImagePackage {
    param([Parameter(Mandatory = $true)][string]$SdkRoot)
    $base = Join-Path $SdkRoot "system-images"
    if (-not (Test-Path -LiteralPath $base)) { return $null }

    $preferredTags = @(
        "google_apis_playstore_ps16k",
        "google_apis_playstore",
        "google_apis"
    )
    $abis = @("x86_64", "arm64-v8a")

    foreach ($tag in $preferredTags) {
        foreach ($abi in $abis) {
            $dirs = Get-ChildItem -Path $base -Directory -ErrorAction SilentlyContinue
            foreach ($apiDir in $dirs) {
                $img = Join-Path $apiDir.FullName "$tag\$abi"
                if (Test-Path -LiteralPath $img) {
                    $api = $apiDir.Name
                    return "system-images;$api;$tag;$abi"
                }
            }
        }
    }
    return $null
}

function Ensure-PreferredAvd {
    <#
    .SYNOPSIS
      Returns existing Pixel 9a AVD name, or creates Pixel_9A when tools allow.
    #>
    param([switch]$CreateIfMissing)

    $existing = Resolve-PreferredAvdName -AllowMissing:$false
    if ($existing) { return $existing }

    if (-not $CreateIfMissing) {
        return $null
    }

    $sdk = Get-AndroidSdkRoot
    if (-not $sdk) {
        throw @"
Android SDK non trovato.
Imposta ANDROID_HOME / ANDROID_SDK_ROOT oppure installa Android Studio SDK in:
  $env:LOCALAPPDATA\Android\Sdk
Poi crea AVD Pixel_9A (device pixel_9a) da Device Manager, oppure:
  npm run android:emulator
"@
    }

    $avdmanager = Find-AvdManager
    $sdkmanager = Find-SdkManager
    if (-not $avdmanager) {
        throw @"
AVD Pixel_9A / Pixel_9a assente e avdmanager non trovato (cmdline-tools mancanti).
Opzioni:
  1) Android Studio → Device Manager → Create Device → Pixel 9a → nome AVD Pixel_9A
  2) Installa SDK Command-line Tools (SDK Manager → SDK Tools → Android SDK Command-line Tools)
     poi: npm run android:emulator
SDK: $sdk
"@
    }

    $pkg = Find-SystemImagePackage -SdkRoot $sdk
    if (-not $pkg -and $sdkmanager) {
        Write-Host "WARN: nessuna system image locale; provo install google_apis_playstore API 35 x86_64..." -ForegroundColor Yellow
        $pkg = "system-images;android-35;google_apis_playstore;x86_64"
        $null = echo y | & $sdkmanager --install $pkg 2>&1
        if (-not (Find-SystemImagePackage -SdkRoot $sdk)) {
            throw "sdkmanager non ha installato $pkg. Apri SDK Manager in Android Studio e installa un'immagine Google APIs (x86_64 o arm64)."
        }
        $pkg = Find-SystemImagePackage -SdkRoot $sdk
    }
    if (-not $pkg) {
        throw "Nessuna system image in $sdk\system-images. Installa da Android Studio SDK Manager (Google APIs / Play Store)."
    }

    $name = $script:KineFitPreferredAvdCreateName
    Write-Host "Creo AVD $name (device $($script:KineFitPixelDeviceId), image $pkg)..." -ForegroundColor Cyan
    $createOut = echo no | & $avdmanager create avd -n $name -k $pkg -d $script:KineFitPixelDeviceId --force 2>&1
    $createText = $createOut | Out-String
    $listed = @(Get-ListedAvds)
    $created = $listed | Where-Object { $_.Equals($name, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1
    if (-not $created) {
        throw "avdmanager create avd fallito per $name.`n$createText"
    }
    Write-Host "OK: AVD creato: $created" -ForegroundColor Green
    return $created
}

function Stop-AndroidEmulatorProcesses {
    Get-Process -Name "qemu-system*", "emulator" -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

function Start-PreferredEmulator {
    param(
        [Parameter(Mandatory = $true)][string]$AvdName,
        [int]$BootTimeoutSec = 300,
        [switch]$ColdBoot
    )
    $emu = Find-Emulator
    $adb = Find-Adb
    if (-not $emu) {
        throw "emulator.exe non trovato. Installa Android Emulator da SDK Manager."
    }
    if (-not $adb) {
        throw "adb non trovato. Installa platform-tools."
    }

    # Always reset adb before launch to avoid dual-daemon / offline fights.
    Reset-AdbServer -AdbPath $adb

    $attemptCold = [bool]$ColdBoot
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        if ($attempt -eq 2 -or $attemptCold) {
            Write-Host "Cold boot AVD=$AvdName (no-snapshot-load)..." -ForegroundColor Cyan
            Stop-AndroidEmulatorProcesses
            Reset-AdbServer -AdbPath $adb
            $argList = @("-avd", $AvdName, "-no-snapshot-load", "-netdelay", "none", "-netspeed", "full")
        } else {
            Write-Host "Avvio emulatore AVD=$AvdName ..." -ForegroundColor Cyan
            $argList = @("-avd", $AvdName, "-netdelay", "none", "-netspeed", "full")
        }
        Start-Process -FilePath $emu -ArgumentList $argList -WindowStyle Normal | Out-Null

        $deadline = (Get-Date).AddSeconds($BootTimeoutSec)
        $serial = $null
        $sawOfflineOnly = $true
        while ((Get-Date) -lt $deadline) {
            $online = @(Get-AdbOnlineSerials -AdbPath $adb)
            if ($online.Count -gt 0) { $sawOfflineOnly = $false }
            foreach ($s in $online) {
                if ($s -notmatch "^emulator-") { continue }
                $avd = Get-EmulatorAvdNameForSerial -AdbPath $adb -Serial $s
                if ($avd -and $avd.Equals($AvdName, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $serial = $s
                    break
                }
                if (-not $avd -and $online.Count -eq 1) {
                    $serial = $s
                    break
                }
            }
            if ($serial) { break }

            # Stuck "offline" with no online device → retry cold boot once
            if (-not $attemptCold -and $attempt -eq 1) {
                $raw = Invoke-AndroidNative -FilePath $adb -ArgumentList @("devices")
                $offlineStuck = ($raw | Where-Object { $_ -match "^emulator-\d+\s+offline" }).Count -gt 0
                $elapsed = $BootTimeoutSec - [int]($deadline - (Get-Date)).TotalSeconds
                if ($offlineStuck -and $online.Count -eq 0 -and $elapsed -ge 45) {
                    Write-Host "WARN: emulator offline >45s; riprovo con cold boot..." -ForegroundColor Yellow
                    $attemptCold = $true
                    break
                }
            }
            Start-Sleep -Seconds 2
        }

        if ($serial -and (Wait-AdbBootCompleted -AdbPath $adb -Serial $serial -TimeoutSec $BootTimeoutSec)) {
            Write-Host "OK: emulatore online $serial (AVD $AvdName)" -ForegroundColor Green
            return $serial
        }

        if ($attempt -eq 1 -and -not $ColdBoot) {
            $attemptCold = $true
            continue
        }
    }

    throw "Timeout: emulatore $AvdName non pronto entro ${BootTimeoutSec}s (prova Android Studio Device Manager o cold boot)."
}

function Get-DeviceAbi {
    param(
        [Parameter(Mandatory = $true)][string]$AdbPath,
        [Parameter(Mandatory = $true)][string]$Serial
    )
    $lines = Invoke-AndroidNative -FilePath $AdbPath -ArgumentList @("-s", $Serial, "shell", "getprop", "ro.product.cpu.abi")
    $abi = (($lines | Where-Object { $_ -notmatch '(?i)daemon' -and $_.Trim() -ne "" } | Select-Object -First 1) | ForEach-Object { "$_" }).Trim()
    if ($abi) { return $abi }
    return $null
}

function Get-ReactNativeArchitecturesForDevice {
    param(
        [Parameter(Mandatory = $true)][string]$AdbPath,
        [Parameter(Mandatory = $true)][string]$Serial
    )
    $abi = Get-DeviceAbi -AdbPath $AdbPath -Serial $Serial
    switch -Regex ($abi) {
        '^x86_64$' { return "x86_64" }
        '^x86$' { return "x86" }
        '^arm64-v8a$' { return "arm64-v8a" }
        '^armeabi-v7a$' { return "armeabi-v7a" }
        default { return $null }
    }
}

function Ensure-AndroidUiDevice {
    <#
    .SYNOPSIS
      Ensure an adb device is ready for UI verify/install.
      Boots Pixel_9A / Pixel_9a when none online; prefers that AVD when multiple.
    .OUTPUTS
      Hashtable: Adb, Serial, AvdName
    #>
    param(
        [string]$Serial = "",
        [switch]$NoBoot,
        [switch]$CreateAvdIfMissing,
        [int]$BootTimeoutSec = 300
    )

    $adb = Find-Adb
    if (-not $adb) {
        throw "adb non trovato. Installa platform-tools o imposta ANDROID_HOME / ANDROID_SDK_ROOT."
    }

    # Snapshot resume / Studio console often leaves port 5037 wedged — heal before listing.
    if (-not (Test-AdbDaemonHealthy -AdbPath $adb)) {
        Write-Host "WARN: adb daemon unhealthy (5037/snapshot); Reset-AdbServer..." -ForegroundColor Yellow
        Reset-AdbServer -AdbPath $adb
        if (-not (Test-AdbDaemonHealthy -AdbPath $adb)) {
            throw "adb daemon still unhealthy after Reset-AdbServer (port 5037). Restart Android Emulator console / Pixel_9a, then retry."
        }
    }

    $avdName = $null
    try {
        $avdName = Ensure-PreferredAvd -CreateIfMissing:$CreateAvdIfMissing
    } catch {
        if ($CreateAvdIfMissing) { throw }
        $avdName = Resolve-PreferredAvdName -AllowMissing:$false
    }

    $online = @(Get-AdbOnlineSerials -AdbPath $adb)
    if ($online.Count -eq 0) {
        $raw = Invoke-AndroidNative -FilePath $adb -ArgumentList @("devices")
        $rawText = (@($raw) -join "`n")
        $hasOffline = ($raw | Where-Object { $_ -match "^emulator-\d+\s+offline" }).Count -gt 0
        $daemonFault = $rawText -match '(?i)cannot connect to daemon|connection refused|5037'
        if ($hasOffline -or $daemonFault) {
            Write-Host "WARN: emulator offline/adb fault; Reset-AdbServer..." -ForegroundColor Yellow
            Reset-AdbServer -AdbPath $adb
            $online = @(Get-AdbOnlineSerials -AdbPath $adb)
        }
    }

    if ($Serial) {
        if ($online -notcontains $Serial) {
            throw "Serial $Serial non online (online: $($online -join ', '))"
        }
        $env:ANDROID_SERIAL = $Serial
        return @{ Adb = $adb; Serial = $Serial; AvdName = $avdName }
    }

    if ($online.Count -eq 0) {
        if ($NoBoot) {
            throw "Nessun device/emulator online. Avvia Pixel_9A: npm run android:emulator"
        }
        if (-not $avdName) {
            $avdName = Ensure-PreferredAvd -CreateIfMissing
        }
        $serialStarted = Start-PreferredEmulator -AvdName $avdName -BootTimeoutSec $BootTimeoutSec
        $env:ANDROID_SERIAL = $serialStarted
        return @{ Adb = $adb; Serial = $serialStarted; AvdName = $avdName }
    }

    $chosen = Select-PreferredDeviceSerial -AdbPath $adb -OnlineSerials $online -PreferredAvd $avdName
    if ($avdName -and $online.Count -gt 1) {
        $chosenAvd = Get-EmulatorAvdNameForSerial -AdbPath $adb -Serial $chosen
        if ($chosenAvd) {
            Write-Host "OK: preferisco AVD $chosenAvd su $chosen (tra $($online.Count) device)" -ForegroundColor Green
        } else {
            Write-Host "WARN: piu device; uso $chosen" -ForegroundColor Yellow
        }
    }

    if ($chosen -match "^emulator-") {
        $null = Wait-AdbBootCompleted -AdbPath $adb -Serial $chosen -TimeoutSec ([Math]::Min(120, $BootTimeoutSec))
    }

    $env:ANDROID_SERIAL = $chosen
    return @{ Adb = $adb; Serial = $chosen; AvdName = $avdName }
}

# Libera a porta 3000 e permite que o Next.js use-a
# Execute: .\scripts\kill-port-3000.ps1

$port = 3000
$connections = netstat -ano | findstr ":$port "

if ($connections) {
    Write-Host "Processos usando a porta $port :" -ForegroundColor Yellow
    $processIds = @{}
    foreach ($line in $connections) {
        $parts = $line -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$' -and $processId -ne '0') {
            $processIds[$processId] = $true
        }
    }
    foreach ($processId in $processIds.Keys) {
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  PID $processId : $($proc.ProcessName)" -ForegroundColor Cyan
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  -> Encerrado" -ForegroundColor Green
            }
        } catch {
            Write-Host "  PID $processId : nao foi possivel encerrar" -ForegroundColor Red
        }
    }
    Write-Host "`nPorta $port liberada. Execute: npm run dev" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo usando a porta $port" -ForegroundColor Green
    Write-Host "Execute: npm run dev" -ForegroundColor Cyan
}

# ============================================================
# OMEKART FRONTEND - COMPLETE FOLDER STRUCTURE
# Works with PowerShell 2.0+ (no -LiteralPath required)
# ============================================================

function New-Folder {
    param([string]$Path)
    try {
        New-Item -ItemType Directory -Force -Path $Path -ErrorAction Stop | Out-Null
    } catch {
        Write-Host "Folder issue: $Path - $($_.Exception.Message)" -ForegroundColor Red
    }
}

function New-TouchFile {
    param([string]$Path)
    try {
        $dir = Split-Path -Parent $Path
        if ($dir -and !(Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir -ErrorAction Stop | Out-Null
        }
        New-Item -ItemType File -Force -Path $Path -ErrorAction Stop | Out-Null
    } catch {
        Write-Host "File issue: $Path - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ------------------------------------------------------------
# 1. APP FOLDERS
# ------------------------------------------------------------

# Auth
@(
    "app\(auth)\login",
    "app\(auth)\signup",
    "app\(auth)\forgot-password",
    "app\(auth)\onboarding"
) | ForEach-Object { New-Folder $_ }

# Dashboard roles
@(
    "app\(dashboard)\dashboard\buyer",
    "app\(dashboard)\dashboard\seller",
    "app\(dashboard)\dashboard\support",
    "app\(dashboard)\dashboard\regional-manager",
    "app\(dashboard)\dashboard\country-manager",
    "app\(dashboard)\dashboard\supreme-admin"
) | ForEach-Object { New-Folder $_ }

# Seller sub-dashboards
@(
    "app\(dashboard)\dashboard\seller\products",
    "app\(dashboard)\dashboard\seller\food",
    "app\(dashboard)\dashboard\seller\services",
    "app\(dashboard)\dashboard\seller\orders",
    "app\(dashboard)\dashboard\seller\wallet",
    "app\(dashboard)\dashboard\seller\analytics",
    "app\(dashboard)\dashboard\seller\settings"
) | ForEach-Object { New-Folder $_ }

# Support sub-dashboards
@(
    "app\(dashboard)\dashboard\support\tickets",
    "app\(dashboard)\dashboard\support\disputes",
    "app\(dashboard)\dashboard\support\reports",
    "app\(dashboard)\dashboard\support\chat"
) | ForEach-Object { New-Folder $_ }

# Regional Manager sub-dashboards
@(
    "app\(dashboard)\dashboard\regional-manager\sellers",
    "app\(dashboard)\dashboard\regional-manager\reports",
    "app\(dashboard)\dashboard\regional-manager\verification",
    "app\(dashboard)\dashboard\regional-manager\disputes",
    "app\(dashboard)\dashboard\regional-manager\analytics"
) | ForEach-Object { New-Folder $_ }

# Country Manager sub-dashboards
@(
    "app\(dashboard)\dashboard\country-manager\regions",
    "app\(dashboard)\dashboard\country-manager\sellers",
    "app\(dashboard)\dashboard\country-manager\customer-care",
    "app\(dashboard)\dashboard\country-manager\reports",
    "app\(dashboard)\dashboard\country-manager\analytics"
) | ForEach-Object { New-Folder $_ }

# Supreme Admin sub-dashboards
@(
    "app\(dashboard)\dashboard\supreme-admin\users",
    "app\(dashboard)\dashboard\supreme-admin\sellers",
    "app\(dashboard)\dashboard\supreme-admin\managers",
    "app\(dashboard)\dashboard\supreme-admin\categories",
    "app\(dashboard)\dashboard\supreme-admin\taxonomy",
    "app\(dashboard)\dashboard\supreme-admin\reports",
    "app\(dashboard)\dashboard\supreme-admin\system",
    "app\(dashboard)\dashboard\supreme-admin\audit-logs",
    "app\(dashboard)\dashboard\supreme-admin\settings"
) | ForEach-Object { New-Folder $_ }

# Public storefront (renamed from (buyer) to (shop))
@(
    "app\(shop)\home",
    "app\(shop)\explore",
    "app\(shop)\product\`[id`]",           # escaped brackets with backticks
    "app\(shop)\food",
    "app\(shop)\service",
    "app\(shop)\cart",
    "app\(shop)\checkout",
    "app\(shop)\orders",
    "app\(shop)\profile"
) | ForEach-Object { New-Folder $_ }

# Auth callback
New-Folder "app\auth\callback"

# ------------------------------------------------------------
# 2. COMPONENTS
# ------------------------------------------------------------
@(
    "components\ui",
    "components\layout",
    "components\buyer",
    "components\seller",
    "components\support",
    "components\manager",
    "components\admin",
    "components\forms",
    "components\shared"
) | ForEach-Object { New-Folder $_ }

# ------------------------------------------------------------
# 3. LIB
# ------------------------------------------------------------
@(
    "lib\supabase",
    "lib\permissions",
    "lib\services",
    "lib\api",
    "lib\validators",
    "lib\constants",
    "lib\helpers"
) | ForEach-Object { New-Folder $_ }

# ------------------------------------------------------------
# 4. STORE, HOOKS, TYPES, MIDDLEWARE
# ------------------------------------------------------------
@("store", "hooks", "types", "middleware") | ForEach-Object { New-Folder $_ }

# ------------------------------------------------------------
# 5. PUBLIC
# ------------------------------------------------------------
@("public\images", "public\icons") | ForEach-Object { New-Folder $_ }

# ------------------------------------------------------------
# 6. PLACEHOLDER FILES
# ------------------------------------------------------------
@(
    "app\layout.tsx",
    "app\globals.css",
    "app\page.tsx",
    "app\(auth)\login\page.tsx",
    "app\(auth)\signup\page.tsx",
    "app\(auth)\forgot-password\page.tsx",
    "app\(auth)\onboarding\page.tsx",
    "app\(dashboard)\dashboard\buyer\page.tsx",
    "app\(dashboard)\dashboard\seller\page.tsx",
    "app\(dashboard)\dashboard\support\page.tsx",
    "app\(dashboard)\dashboard\regional-manager\page.tsx",
    "app\(dashboard)\dashboard\country-manager\page.tsx",
    "app\(dashboard)\dashboard\supreme-admin\page.tsx",
    "app\(shop)\home\page.tsx",
    "app\(shop)\explore\page.tsx",
    "app\(shop)\product\`[id`]\page.tsx",   # escaped brackets
    "app\(shop)\food\page.tsx",
    "app\(shop)\service\page.tsx",
    "app\(shop)\cart\page.tsx",
    "app\(shop)\checkout\page.tsx",
    "app\(shop)\orders\page.tsx",
    "app\(shop)\profile\page.tsx",
    "app\auth\callback\route.ts",
    "middleware\auth.ts",
    "store\authStore.ts",
    "store\cartStore.ts",
    "store\notificationStore.ts",
    "store\roleStore.ts",
    "lib\supabase\client.ts",
    "lib\supabase\server.ts",
    "lib\api\client.ts",
    "lib\permissions\index.ts",
    "lib\permissions\buyer.ts",
    "lib\permissions\seller.ts",
    "lib\permissions\support.ts",
    "lib\permissions\regional-manager.ts",
    "lib\permissions\country-manager.ts",
    "lib\permissions\supreme-admin.ts",
    "lib\constants\roles.ts",
    "lib\constants\statuses.ts",
    "lib\constants\routes.ts",
    "lib\helpers\format.ts",
    "lib\helpers\currency.ts",
    "lib\helpers\date.ts",
    "lib\helpers\location.ts",
    "types\index.ts",
    "types\user.ts",
    "types\product.ts",
    "types\order.ts",
    "types\permissions.ts",
    "hooks\useAuth.ts",
    "hooks\useCart.ts",
    "hooks\useOrders.ts",
    "hooks\usePermissions.ts",
    "hooks\useRole.ts",
    "hooks\useLocation.ts"
) | ForEach-Object { New-TouchFile $_ }

Write-Host "============================================================" -ForegroundColor Green
Write-Host "OMEKART FRONTEND STRUCTURE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total folders created: 80+" -ForegroundColor Cyan
Write-Host "Total placeholder files created: 50+" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open VS Code and refresh the file explorer" -ForegroundColor White
Write-Host "  2. Replace placeholder files with actual code" -ForegroundColor White
Write-Host "  3. Run 'npm run dev' to test the structure" -ForegroundColor White
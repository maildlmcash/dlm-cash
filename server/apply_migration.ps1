# Script to mark migration as applied and generate Prisma client
# Run this after successfully executing the manual_apply.sql script

Write-Host "Marking migration as applied..." -ForegroundColor Yellow
npx prisma migrate resolve --applied 20251207154406_add_wallet_type_epin_purchase_method

Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Migration applied and Prisma client generated successfully!" -ForegroundColor Green








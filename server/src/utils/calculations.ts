import { Prisma } from '@prisma/client';

export const calculateROI = (
  _amount: Decimal.Value,
  roiAmount: Decimal.Value,
  _frequency: string // Frequency parameter kept for API compatibility, may be used in future
): string => {
  // ROI is now a fixed amount, not a percentage
  return new Prisma.Decimal(roiAmount).toFixed(18);
};

export const parseDecimal = (value: any): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return new Prisma.Decimal(value).toFixed(18);
  }
  return '0';
};

declare namespace Decimal {
  type Value = string | number | Prisma.Decimal;
}

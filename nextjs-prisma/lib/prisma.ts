import { PrismaClient } from '@/app/generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var, vars-on-top
  var PRISMA: PrismaClient | null;
};

export const PRISMA = global.PRISMA ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') {
    global.PRISMA = PRISMA
    }
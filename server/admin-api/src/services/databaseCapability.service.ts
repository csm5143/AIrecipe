import { prisma } from '../lib/prisma';

const tableCache = new Map<string, boolean>();
const columnCache = new Map<string, boolean>();

export async function hasTable(tableName: string) {
  if (tableCache.has(tableName)) return tableCache.get(tableName)!;
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS "exists"
  `;
  const exists = Boolean(result[0]?.exists);
  tableCache.set(tableName, exists);
  return exists;
}

export async function hasColumn(tableName: string, columnName: string) {
  const cacheKey = `${tableName}.${columnName}`;
  if (columnCache.has(cacheKey)) return columnCache.get(cacheKey)!;
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `;
  const exists = Boolean(result[0]?.exists);
  columnCache.set(cacheKey, exists);
  return exists;
}

export function clearDatabaseCapabilityCache() {
  tableCache.clear();
  columnCache.clear();
}

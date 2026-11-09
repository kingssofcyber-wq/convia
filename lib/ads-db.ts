import mysql, { type Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __conviaAdsPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __conviaAdsTableReady: Promise<void> | undefined;
}

export function getAdsDb(): Pool {
  if (globalThis.__conviaAdsPool) return globalThis.__conviaAdsPool;

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error("Ad Manager database is not configured. Add DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in Hostinger environment variables.");
  }

  globalThis.__conviaAdsPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    charset: "utf8mb4",
  });

  return globalThis.__conviaAdsPool;
}

export async function ensureAdsTable(): Promise<void> {
  if (!globalThis.__conviaAdsTableReady) {
    globalThis.__conviaAdsTableReady = (async () => {
      const db = getAdsDb();
      await db.query(`
        CREATE TABLE IF NOT EXISTS convia_adsense_units (
          id CHAR(36) NOT NULL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          publisher_id VARCHAR(40) NOT NULL,
          slot_id VARCHAR(32) NOT NULL,
          ad_format VARCHAR(32) NULL DEFAULT NULL,
          ad_layout VARCHAR(40) NULL,
          ad_layout_key VARCHAR(200) NULL,
          width_px INT NULL,
          height_px INT NULL,
          full_width_responsive TINYINT(1) NOT NULL DEFAULT 1,
          zone VARCHAR(40) NOT NULL,
          route_scope VARCHAR(20) NOT NULL DEFAULT 'all',
          route_path VARCHAR(255) NULL,
          device VARCHAR(12) NOT NULL DEFAULT 'all',
          priority INT NOT NULL DEFAULT 50,
          enabled TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_convia_ads_active (enabled, zone, priority),
          INDEX idx_convia_ads_slot (slot_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })().catch((error) => {
      globalThis.__conviaAdsTableReady = undefined;
      throw error;
    });
  }
  await globalThis.__conviaAdsTableReady;
}

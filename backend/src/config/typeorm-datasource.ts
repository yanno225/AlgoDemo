// Charge le .env AVANT la lecture de process.env — indispensable pour que ce
// fichier fonctionne aussi bien dans l'application que dans la CLI TypeORM.
import 'dotenv/config';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Options de connexion partagées entre :
 *  - l'application NestJS (TypeOrmModule.forRoot dans app.module.ts)
 *  - la CLI TypeORM (scripts npm "migration:*")
 *
 * ⚠️ synchronize: false — INTERDICTION de laisser TypeORM modifier le schéma
 * tout seul. Toute évolution passe par une migration versionnée, afin que les
 * deux développeurs (et les environnements) restent synchronisés.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'algodemo',
  password: process.env.DB_PASSWORD ?? 'algodemo',
  database: process.env.DB_NAME ?? 'algodemo',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Export par défaut consommé par la CLI TypeORM (-d src/config/typeorm-datasource.ts)
export default new DataSource(dataSourceOptions);

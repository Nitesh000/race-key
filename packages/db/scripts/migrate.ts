import { migrate } from "drizzle-orm/postgres-js/migrator";
import { nodeDb } from "./client";

const { db, client } = nodeDb();
await migrate(db, { migrationsFolder: new URL("../migrations", import.meta.url).pathname });
await client.end();
console.log("migrations applied");

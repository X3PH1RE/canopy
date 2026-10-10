import { buildServer } from "./routes";
import { loadConfig } from "./config";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const host = process.env.HOST ?? "0.0.0.0";
const server = buildServer({ config: loadConfig() });

async function main() {
  try {
    await server.listen({ port, host });
    console.log(`Canopy server listening on http://${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void main();

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeFakeCity } from "../dist/apps/server/src/fakeCity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../../web/public/samples/fake.json");
const city = makeFakeCity(42);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(city, null, 2)}\n`, "utf8");

console.log(`Wrote ${city.files.length} fake files to ${outputPath}`);

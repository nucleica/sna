import { checkSources } from "./src/sources.ts";
import { Service } from "./src/services.ts";
import { Server } from "./core/server/index.ts";

if (import.meta.main) {
  const sources = checkSources();
  const services = new Service();

  services.addServices(...sources.nucleic.map((d) => d.name));

  const s = new Server();
  s.serve();
}

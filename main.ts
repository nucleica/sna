import { serveDir } from "@std/http/file-server";
import { readConfig } from "./core/config.ts";
import { Server } from "./core/server/index.ts";
import { Service, type ServiceStatus } from "./src/services.ts";
import { checkSources } from "./src/sources.ts";

if (import.meta.main) {
  const sources = checkSources();
  const services = new Service();

  services.addServices(...sources.nucleic.map((d) => d.name));

  const { version, name } = readConfig();
  const s = new Server();

  s.addRoute({
    handler: (data: unknown) => s.respond({ version, name }),
    path: "/info",
  });

  s.addRoute({
    handler: (body: unknown, req: Request) =>
      serveDir(req, { fsRoot: "./gui" }),
    path: "/*",
  });

  s.addRoute(
    {
      handler: () =>
        s.respond(services.services.map((s) => ({
          installed: s.installed,
          name: s.serviceName,
          active: s.active,
        })) as ServiceStatus[]),
      path: "/services",
    },
  );

  s.serve();
}

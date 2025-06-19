import { lls } from "@nucleic/turtle";
import { Server } from "@nucleic/venous";
import { serveDir } from "@std/http/file-server";
import { readConfig } from "./core/config.ts";
import { Service, type ServiceStatus } from "./src/services.ts";
import { checkSources } from "./src/sources.ts";

if (import.meta.main) {
  const sources = checkSources();
  const services = new Service();

  services.addServices(...sources.nucleic.map((d) => d.name)).forEach(
    (matter) => {
      matter.on("update", (update) => {
        s.ws.update("service-update", { name: matter.serviceName, update });
      });
    },
  );

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
      handler: async ({ name, action }: { name: string; action: string }) => {
        const service = services.find(name);

        if (!service) {
          return s.respond({ success: false });
        }

        if (action === "Install") {
          if (service.installed) {
            return s.respond({ success: false });
          }

          const installError = await service.install();

          if (
            typeof installError === "object" && "installed" in installError &&
            installError.installed
          ) {
            const rel = await lls("systemctl", { args: ["daemon-reload"] });

            service.update({ installed: true });
            return s.respond({ success: true });
          }

          const check = await service.check();

          return s.respond({ success: false, check });
        } else if (action === "Start") {
          const start = await service.start();
          const check = await service.check();

          return s.respond(check);
        } else if (action === "Stop") {
          const stop = await service.stop();
          const check = await service.check();

          return s.respond(check);
        }

        return s.respond({ success: false });
      },
      path: "/action",
    },
  );

  s.addRoute(
    {
      path: "/restart",
      handler: async ({ name }: { name: string }) => {
        const service = services.find(name);

        if (!service) {
          return s.respond({ success: false });
        }

        const restart = await service.restart();
        const check = await service.check();

        return s.respond(check);
      },
    },
  );

  s.addRoute(
    {
      handler: () =>
        s.respond(services.services.map((s) => ({
          installed: s.installed,
          name: s.serviceName,
          memory: s.memory,
          failed: s.failed,
          active: s.active,
          cpu: s.cpu,
          port: s.port,
          //TODO as werong
        })) as ServiceStatus[]),
      path: "/services",
    },
  );

  s.serve();

  setInterval(() => {
    services.services.forEach(async (s) => await s.check());
  }, 60000);
}

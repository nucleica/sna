import type { Route } from "../server/server-types.ts";
import { Sockets } from "./sockets.ts";

export class Server {
  routes: Route[] = [];
  ws = new Sockets();

  serve(port = 9420) {
    Deno.serve({ port }, async (req) => {
      const url = new URL(req.url);
      /*
      if (url.pathname.startsWith("/storage")) {
        return serveDir(req, {
          showDirListing: true,
          enableCors: true,
          // fsRoot: "storage",
        });
      }
        */

      if (req.headers.get("upgrade") === "websocket") {
        return this.ws.upgrade(req);
      } else {
        const route = this.routes.find((r) => r.path === url.pathname);

        let body = null;

        if (req.body) {
          body = await req.json();
        }

        if (route) {
          return route.handler(body, req);
        } else {
          const wildRoutes = this.routes.filter((r) =>
            r.path.split("/").some((p) => p === "*")
          );

          const rt = wildRoutes.find((p) => {
            const wildIndex = p.path.indexOf("*");
            const wildPath = p.path.split("/");
            const pathParts = url.pathname.split("/");

            return wildPath.slice(0, wildIndex).every((part, index) => {
              return part === pathParts[index];
            });
          });

          if (rt) {
            return rt.handler(body, req);
          }

          return this.respond({ text: "Not found" }, 404);
        }
      }
    });
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  respond(data: unknown = {}, status: number = 200) {
    return new Response(JSON.stringify(data), {
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status,
    });
  }
}

import { serveDir } from "@std/http/file-server";
import type { Route } from "../server/server-types.ts";
import { Sockets } from "./sockets.ts";

export class Server {
  routes: Route[] = [];
  ws = new Sockets();

  serve(port = 9420) {
    Deno.serve({ port }, async (req) => {
      const url = new URL(req.url);

      if (url.pathname.startsWith("/storage")) {
        return serveDir(req, {
          showDirListing: true,
          enableCors: true,
          // fsRoot: "storage",
        });
      }

      if (req.headers.get("upgrade") === "websocket") {
        return this.ws.upgrade(req);
      } else {
        const route = this.routes.find((r) => r.path === url.pathname);
        let body = null;

        if (req.body) {
          body = await req.json();
        }

        if (route) {
          return route.handler(body);
        } else {
          return this.respond({ text: "Not found" });
        }
      }
    });
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  respond(data: unknown = {}) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}

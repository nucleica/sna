import { Chat } from "./chat/chat.ts";
import { Tool } from "./chat/tool.ts";
import { log } from "./core/log.ts";
import { Server } from "./core/server/server.ts";
import { Storage } from "./core/storage.ts";
import { addChatRoute } from "./route/add-chat.route.ts";
import { askRoute } from "./route/ask.route.ts";
import { chatsRoute } from "./route/chats.route.ts";

export class Debi extends Server {
  chats: Chat[] = [];

  storage = new Storage(this);
  tools = new Tool(this);

  constructor() {
    super();

    this.addRoute(askRoute(this, this.chats, this.tools));
    this.addRoute(addChatRoute(this, this.chats));
    this.addRoute(chatsRoute(this, this.chats));
    this.addRoute({
      path: "/greet",
      handler: (
        body: {
          ip: string;
          time: number;
          devices: { name: string; device: string };
          version: string;
          features: string[];
        },
      ) => {
        const now = Date.now();
        const diff = now - body.time;

        log(`greet from ${body.ip} took ${diff}ms`);
        if (body.features.length > 0) {
          log(`features: ${body.features.join(", ")}`);
        }

        log(body.devices);

        return this.respond({ message: "Hello, world!" });
      },
    });

    this.serve();

    setInterval(() => {
      this.tools.analyze(this.chats);
    }, 1000 * 10);
  }
}

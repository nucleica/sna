import { Chat } from "./chat/chat.ts";
import { Tool } from "./chat/tool.ts";
import { Server } from "./core/server/server.ts";
import { Storage } from "./core/storage.ts";
import { addChatRoute } from "./route/add-chat.route.ts";
import { askRoute } from "./route/ask.route.ts";
import { chatsRoute } from "./route/chats.route.ts";
import { simpleAskRoute } from "./route/simple-ask.ts";

export class Debi extends Server {
  chats: Chat[] = [];

  storage = new Storage(this);
  tools = new Tool(this);

  constructor() {
    super();

    this.addRoute(askRoute(this, this.chats, this.tools));
    this.addRoute(simpleAskRoute(this, this.chats));
    this.addRoute(addChatRoute(this, this.chats));
    this.addRoute(chatsRoute(this, this.chats));

    this.serve();

    setInterval(() => {
      this.tools.analyze(this.chats);
    }, 1000 * 10);
  }
}

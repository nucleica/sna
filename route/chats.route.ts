import { Chat } from "../chat/chat.ts";
import { Server } from "../core/server/server.ts";

export const chatsRoute = (server: Server, chats: Chat[]) => ({
  handler: () => server.respond(chats),
  path: "/chats",
});

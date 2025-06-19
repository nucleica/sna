import { Chat } from "../chat/chat.ts";
import { log } from "@nucleic/turtle";
import { Server } from "../core/server/server.ts";

let system_temp: string;

loadSystemPrompt();

function loadSystemPrompt() {
  if (system_temp) {
    return system_temp;
  }

  system_temp = Deno.readTextFileSync("./system.md");
  return system_temp;
}

export const addChatRoute = (server: Server, chats: Chat[]) => ({
  handler: (data: { system: string }) => {
    const system = loadSystemPrompt();
    const id = Math.random().toString(36).substring(2, 9);

    if (!system) {
      log("no system prompt");
    }

    const chat = new Chat(
      [
        {
          content: system,
          id: crypto.randomUUID(),
          tools_string: "",
          role: "system",
          thinking: "",
        },
        {
          content: (data.system ?? "") +
            "\n\n # Chat config\n Selected mannerism: casual",
          id: crypto.randomUUID(),
          tools_string: "",
          role: "system",
          thinking: "",
        },
      ],
      id,
    );

    chats.push(chat);
    server.ws.update("chat-add", chat);

    return server.respond(chat);
  },
  path: "/chat/add",
});

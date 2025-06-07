import { ask } from "../thinker/ask.ts";
import { Chat, ChatMessage } from "../chat/chat.ts";
import { Tool } from "../chat/tool.ts";
import { handleTools } from "../chat/tools.ts";
import { ChatQuestion } from "../core/server/server-types.ts";
import { Server } from "../core/server/server.ts";

export function blankMessage(
  role: "assistant" | "user",
  data: Partial<ChatMessage> = {},
) {
  return {
    thinking: data.thinking || "",
    content: data.content || "",
    creation_time: Date.now(),
    id: crypto.randomUUID(),
    tools_string: "",
    role,
  };
}

export const askRoute = (server: Server, chats: Chat[], tools: Tool) => ({
  path: "/chat/ask",
  handler: (data: ChatQuestion) => {
    const chat = chats.find((chat) => chat.id === data.chatID);

    if (!chat) {
      return server.respond({});
    }

    if (data.messageID) {
      // TODO handle response from tool
      chat.messages.push(
        blankMessage("user", { content: "tools not working" }),
      );
    } else if (data.question) {
      chat.messages.push(blankMessage("user", { content: data.question }));
    }

    const assistantResponse = blankMessage("assistant");
    chat.messages.push(assistantResponse);

    server.ws.update("chat-message", chat);

    ask(
      chat,
      (data) => {
        const chunk = new TextDecoder().decode(data);
        const index = chat.messages.findIndex(
          (message) => message.id === assistantResponse.id,
        );

        // Mark finished thinking
        if (
          !chat.messages[index].finished_thinking &&
          chat.messages[index].thinking.includes("</think>")
        ) {
          chat.messages[index].finished_thinking = Date.now();
        }

        // TODO this is a hack for not thinking mode
        if (
          chat.messages[index].thinking.length >= 4 &&
          !chat.messages[index].thinking.includes("<th")
        ) {
          chat.messages[index].content = `${chat.messages[index].thinking}${
            chat.messages[index].content
          }`;
          chat.messages[index].finished_thinking =
            chat.messages[index].creation_time;
          chat.messages[index].thinking = "";
        }

        // apply chunk to thinking or content based on finished thinking
        if (chat.messages[index].finished_thinking !== undefined) {
          chat.messages[index].content += chunk;
        } else {
          chat.messages[index].thinking += chunk;
        }

        server.ws.update("chat-chunk", {
          ...chat.messages[index],
          id: chat.id,
          chunk,
        });
      },
      () => {
        const index = chat.messages.findIndex(
          (message) => message.id === assistantResponse.id,
        );

        // hack Mark finished thinking if somethink crash
        if (!chat.messages[index].finished_thinking) {
          chat.messages[index].finished_thinking =
            chat.messages[index].creation_time;
        }

        chat.messages[index].finish_time = Date.now();

        const toolResponse = handleTools(chat.messages[index]);

        chat.messages[index].tools = toolResponse.tools;

        /*
          if (toolResponse.tools_string) {
            chat.messages[index].tools_string = toolResponse.tools_string;

            chat.messages[index].content = chat.messages[index].content.replace(
              toolResponse.tools_string,
              "",
            );
          }
        */

        server.ws.update("chat-message", chat);

        if (toolResponse.tools?.length) {
          setTimeout(() => {
            tools.analyze(chats);
          }, 100);
        }
      },
    );

    return server.respond({});
  },
});

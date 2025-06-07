import { Chat, ChatMessage } from "../chat/chat.ts";
import { Tool } from "../chat/tool.ts";
import { handleTools } from "../chat/tools.ts";
import { ChatQuestion } from "../core/server/server-types.ts";
import { Server } from "../core/server/server.ts";
import { ask } from "../thinker/ask.ts";

const NOT_THINK = "<think>\n</think>";

export function blankMessage(
  role: "assistant" | "user",
  data: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    tools_string: "",
    thinking: "",
    content: "",
    ...data,
    creation_time: Date.now(),
    id: crypto.randomUUID(),
    role,
  };
}

export const askRoute = (
  server: Server,
  chats: Chat[],
  tools: Tool,
) => ({
  path: "/chat/ask",
  handler: (data: ChatQuestion) => {
    const chatIndex = chats.findIndex((chat) => chat.id === data.chatID);

    if (chatIndex === -1) {
      return server.respond({});
    }

    /*
      if (data.messageID) {
        // TODO handle response from tool
        chats[chatIndex].messages.push(
          blankMessage("user", { content: "tools not working" }),
        );
      } else
       */ if (data.question) {
      chats[chatIndex].messages.push(
        blankMessage("user", { content: data.question }),
      );
    }

    const assistantResponse = blankMessage("assistant", {
      content: data.think ? "" : NOT_THINK,
    });
    chats[chatIndex].messages.push(assistantResponse);

    server.ws.update("chat-message", chats[chatIndex]);

    ask(
      chats[chatIndex],
      (data) => {
        const chunk = new TextDecoder().decode(data);
        const index = chats[chatIndex].messages.findIndex(
          (message) => message.id === assistantResponse.id,
        );

        // Mark finished thinking
        if (
          !chats[chatIndex].messages[index].finished_thinking
        ) {
          if (
            chats[chatIndex].messages[index].thinking.includes("</think>")
          ) {
            chats[chatIndex].messages[index].finished_thinking = Date.now();
          }

          if (chats[chatIndex].messages[index].content.includes(NOT_THINK)) {
            chats[chatIndex].messages[index].finished_thinking = Date.now();
            chats[chatIndex].messages[index].thinking =
              chats[chatIndex].messages[index].content;

            chats[chatIndex].messages[index].content = "";
          }
        }

        // TODO this is a hack for not thinking mode
        if (
          chats[chatIndex].messages[index].thinking.length >= 4 &&
          !chats[chatIndex].messages[index].thinking.includes("<th")
        ) {
          chats[chatIndex].messages[index].content = `${
            chats[chatIndex].messages[index].thinking
          }${chats[chatIndex].messages[index].content}`;
          chats[chatIndex].messages[index].finished_thinking =
            chats[chatIndex].messages[index].creation_time;
          chats[chatIndex].messages[index].thinking = "";
        }

        // apply chunk to thinking or content based on finished thinking
        if (chats[chatIndex].messages[index].finished_thinking !== undefined) {
          chats[chatIndex].messages[index].content += chunk;
        } else {
          chats[chatIndex].messages[index].thinking += chunk;
        }

        server.ws.update("chat-chunk", {
          ...chats[chatIndex].messages[index],
          id: chats[chatIndex].id,
          chunk,
        });
      },
      () => {
        const index = chats[chatIndex].messages.findIndex(
          (message) => message.id === assistantResponse.id,
        );

        // hack Mark finished thinking if somethink crash
        if (!chats[chatIndex].messages[index].finished_thinking) {
          chats[chatIndex].messages[index].finished_thinking =
            chats[chatIndex].messages[index].creation_time;
        }

        chats[chatIndex].messages[index].finish_time = Date.now();

        const toolResponse = handleTools(chats[chatIndex].messages[index]);

        if (toolResponse.tools?.length) {
          chats[chatIndex].messages.push(blankMessage("user", {
            tools_string: toolResponse.tools_string,
            tools: toolResponse.tools,
          }));
        }

        /*
          if (toolResponse.tools_string) {
            chat.messages[index].tools_string = toolResponse.tools_string;

            chat.messages[index].content = chat.messages[index].content.replace(
              toolResponse.tools_string,
              "",
            );
          }
        */

        server.ws.update("chat-message", chats[chatIndex]);

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

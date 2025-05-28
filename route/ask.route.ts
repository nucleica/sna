import { ask } from "../thinker/ask.ts";
import { Chat } from "../chat/chat.ts";
import { Tool } from "../chat/tool.ts";
import { handleTools } from "../chat/tools.ts";
import { log } from "../core/log.ts";
import { ChatQuestion } from "../core/server/server-types.ts";
import { Server } from "../core/server/server.ts";

export const askRoute = (server: Server, chats: Chat[], tools: Tool) => ({
  path: "/chat/ask",
  handler: (data: ChatQuestion) => {
    const chat = chats.find((chat) => chat.id === data.chatID);
    let assistantResponse: Chat["messages"][0] | undefined;
    let userMessage: Chat["messages"][0] | undefined;

    if (!chat) {
      return server.respond({});
    }

    if (data.messageID) {
      const lastUserMessage = chat.messages[chat.messages.length - 2];

      const lastMessage = chat.messages[chat.messages.length - 1];

      if (lastMessage.role !== "user" && lastUserMessage.role === "user") {
        if (lastUserMessage.content.trim() === "") {
          log("AI tried to continue indefinitely");
          return server.respond({});
        }
      }

      assistantResponse = {
        creation_time: Date.now(),
        id: crypto.randomUUID(),
        role: "assistant",
        tools_string: "",
        thinking: "",
        content: "",
      };

      chat.messages.push(
        {
          creation_time: Date.now(),
          id: crypto.randomUUID(),
          tools_string: "",
          thinking: "",
          role: "user",
          content: "",
        },
        assistantResponse
      );
      server.ws.update("chat-message", chat);
    } else {
      if (data.question) {
        userMessage = {
          creation_time: Date.now(),
          id: crypto.randomUUID(),
          content: data.question,
          tools_string: "",
          thinking: "",
          role: "user",
        };

        chat.messages.push(userMessage);
      }

      assistantResponse = {
        creation_time: Date.now(),
        id: crypto.randomUUID(),
        role: "assistant",
        tools_string: "",
        thinking: "",
        content: "",
      };

      chat.messages.push(assistantResponse);
      server.ws.update("chat-message", chat);
    }

    ask(
      chat,
      (data) => {
        const chunk = new TextDecoder().decode(data);
        const index = chat.messages.findIndex(
          (message) => message.id === assistantResponse.id
        );

        if (
          !chat.messages[index].finished_thinking &&
          chat.messages[index].thinking.includes("</think>")
        ) {
          chat.messages[index].finished_thinking = Date.now();
        }

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
          (message) => message.id === assistantResponse.id
        );

        chat.messages[index].finish_time = Date.now();

        const toolResponse = handleTools(chat.messages[index]);

        chat.messages[index].tools = toolResponse.tools;

        if (toolResponse.tools_string) {
          chat.messages[index].tools_string = toolResponse.tools_string;

          chat.messages[index].content = chat.messages[index].content.replace(
            toolResponse.tools_string,
            ""
          );

          setTimeout(() => {
            tools.analyze(chats);
          }, 100);

          server.ws.update("chat-message", chat);
        }
      }
    );

    return server.respond({});
  },
});

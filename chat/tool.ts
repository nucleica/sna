import { ask } from "../thinker/ask.ts";
import { Chat, ChatMessage } from "./chat.ts";
import { log } from "../core/log.ts";
import { generate } from "../modules/synthesis/kok.ts";
import { askRoute } from "../route/ask.route.ts";
import { Server } from "../core/server/server.ts";

export class Tool {
  constructor(private server: Server) {}

  analyze(chats: Chat[]) {
    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.role === "assistant") {
          this.analyzeMessage(message, chats);
        } else if (message.role === "user") {
          // log("juser message");
        } else {
          // log("just system");
        }
      });
    });
  }

  analyzeMessage(chatMessage: ChatMessage, chats: Chat[]) {
    if (!chatMessage.tools) {
      return;
    }

    chatMessage.tools.forEach((tool) => {
      if (tool.status === "pending") {
        log("pending", tool.name);

        if (tool.name === "text_to_speech") {
          generate(tool.parameters.text).then((url) => {
            if (url) {
              const done = {
                ...tool,
                status: "done",
                url,
              };

              this.updateMessage(
                {
                  ...chatMessage,
                  tools: chatMessage.tools?.map((t) => {
                    if (t.name === tool.name) {
                      return done;
                    }

                    return t;
                  }),
                },
                chats,
                // true
              );
            }
          });

          const inProgress = {
            ...tool,
            status: "in-progress",
          };

          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.name === tool.name) {
                  return inProgress;
                }

                return t;
              }),
            },
            chats,
          );
        } else if (tool.name === "take_photo") {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.name === tool.name) {
                  return {
                    ...t,
                    status: "in-progress",
                  };
                }

                return t;
              }),
            },
            chats,
            // true
          );

          fetch(
            `http://192.168.1.${
              tool.parameters.id == 1 ? 65 : 12
            }:9421/take-photo`,
          ).then((res) => {
            return res.json();
          }).then((photo: { path: "" }) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.name === tool.name) {
                    return {
                      ...t,
                      status: "done",
                      parameters: {
                        ...t.parameters,
                        path:
                          `http://192.168.1.${
                            tool.parameters.id == 1 ? 65 : 12
                          }:9421/` + photo.path,
                      },
                    };
                  }

                  return t;
                }),
              },
              chats,
              // true
            );

            return photo;
          });
        } else if (tool.name === "take_photo") {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.name === tool.name) {
                  return {
                    ...t,
                    status: "in-progress",
                  };
                }

                return t;
              }),
            },
            chats,
            // true
          );

          fetch(
            `http://192.168.1.${
              tool.parameters.id == 1 ? 65 : 12
            }:9421/analyze-photo`,
          ).then((res) => {
            return res.json();
          }).then((photo: { path: "" }) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.name === tool.name) {
                    return {
                      ...t,
                      status: "done",
                      parameters: {
                        ...t.parameters,
                        path:
                          `http://192.168.1.${
                            tool.parameters.id == 1 ? 65 : 12
                          }:9421/` + photo.path,
                      },
                    };
                  }

                  return t;
                }),
              },
              chats,
              // true
            );

            return photo;
          });
        } else {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.name === tool.name) {
                  return {
                    ...t,
                    status: "not-implemented",
                  };
                }

                return t;
              }),
            },
            chats,
            true,
          );
        }
      }
    });
  }

  async updateMessage(
    chatMessage: ChatMessage,
    chats: Chat[],
    continueMessage = false,
  ) {
    const chat = chats.find((chat) =>
      chat.messages.find((message) => message.id === chatMessage.id)
    );

    if (!chat) {
      return;
    }

    const index = chat.messages.findIndex(
      (message) => message.id === chatMessage.id,
    );

    chat.messages[index] = chatMessage;
    this.server.ws.update("chat-message", chat);

    if (continueMessage) {
      askRoute(this.server, chats, this).handler({
        messageID: chatMessage.id,
        chatID: chat.id,
      });
    }
  }
}

import { PYTHON_PATH } from "../bebi/python.ts";
import { log } from "@nucleic/turtle";
import { Server } from "../core/server/server.ts";
import { askRoute } from "../route/ask.route.ts";
import { Chat, ChatMessage } from "./chat.ts";

export class Tool {
  constructor(private server: Server) {}

  analyze(chats: Chat[]) {
    chats.forEach((chat) => {
      chat.messages.forEach((message) => {
        this.analyzeMessage(message, chats);
      });
    });
  }

  analyzeMessage(chatMessage: ChatMessage, chats: Chat[]) {
    if (
      !chatMessage.tools ||
      chatMessage?.tools?.some((tool) => tool.status === "in-progress")
    ) {
      return;
    }

    chatMessage.tools.forEach((tool) => {
      if (tool.status === "pending") {
        log("pending", tool.name);

        if (tool.name === "play_song") {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.id === tool.id) {
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

          new Promise<{ url: string }>((res, rej) => {
            const cmd = new Deno.Command(
              PYTHON_PATH,
              {
                args: [
                  Deno.cwd() + "\\modules\\music\\ty.py",
                  tool.parameters.song,
                ],
              },
            );

            const out = cmd.outputSync();
            let message = "";

            out.stdout.forEach((chunk) => {
              message += chunk;
            });

            out.stderr.forEach((chunk) => {
              message += chunk;
            });

            const mesg = message.split("\n");
            const dest = mesg.find((m) => m.includes("Destination"));

            const final = dest?.replace("[ExtractAudio] Destination: ", "") ??
              "";

            res({
              url: `http://${Deno.networkInterfaces()[1].address}:9420/` +
                final,
            });
          }).then((res: { url: string }) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.id === tool.id) {
                    return {
                      ...t,
                      status: "done",
                      url: res.url,
                    };
                  }

                  return t;
                }),
              },
              chats,
              true,
            );
          });
        } else if (tool.name === "text_to_speech") {
          fetch("http://192.168.1.12:9421/speech", {
            method: "POST",
            body: JSON.stringify({
              text: tool.parameters.text,
              id: tool.id,
            }),
          }).then((res) => res.json()).then(
            ({ url }) => {
              if (url) {
                this.updateMessage(
                  {
                    ...chatMessage,
                    tools: chatMessage.tools?.map((t) => {
                      if (t.id === tool.id) {
                        return {
                          ...tool,
                          status: "done",
                          url,
                        };
                      }

                      return t;
                    }),
                  },
                  chats,
                  // true
                );
              }
            },
          ).catch((err) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.id === tool.id) {
                    return {
                      ...tool,
                      status: "error",
                      url: "",
                    };
                  }

                  return t;
                }),
              },
              chats,
              // true
            );
          });

          const inProgress = {
            ...tool,
            status: "in-progress",
          };

          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.id === tool.id) {
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
                if (t.id === tool.id) {
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
            `http://${tool.parameters.ip}:9421/take-photo`,
          ).then((res) => {
            return res.json();
          }).then((photo: { path: "" }) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.id === tool.id) {
                    return {
                      ...t,
                      status: "done",
                      parameters: {
                        ...t.parameters,
                        path: photo.path,
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
          }).catch((err) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.id === tool.id) {
                    return {
                      ...t,
                      status: "error",
                      parameters: {
                        ...t.parameters,
                        path: "",
                      },
                    };
                  }

                  return t;
                }),
              },
              chats,
              // true
            );

            log(err);
          });
        } else if (tool.name === "analyze_image") {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.id === tool.id) {
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
            `http://192.168.1.65:9421/analyze-photo-queue`,
          ).then((res) => res.json()).then((available) => {
            if (available) {
              fetch(
                `http://192.168.1.65:9421/analyze-photo`,
                {
                  body: JSON.stringify({
                    prompt: tool?.parameters?.prompt,
                    path: tool?.parameters?.path,
                  }),
                  headers: { "Content-Type": "application/json" },
                  method: "POST",
                },
              ).then((res) => {
                return res.json();
              }).then((photo: { path: ""; text: ""; queue?: number }) => {
                if (photo.queue) {
                  this.updateMessage(
                    {
                      ...chatMessage,
                      tools: chatMessage.tools?.map((t) => {
                        if (t.id === tool.id) {
                          return {
                            ...t,
                            status: "pending",
                          };
                        }

                        return t;
                      }),
                    },
                    chats,
                    // true
                  );

                  return photo;
                }

                this.updateMessage(
                  {
                    ...chatMessage,
                    tools: chatMessage.tools?.map((t) => {
                      if (t.id === tool.id) {
                        return {
                          ...t,
                          status: photo.text ? "done" : "error",
                          parameters: {
                            ...t.parameters,
                            text: photo.text,
                            path: photo.path,
                          },
                        };
                      }

                      return t;
                    }),
                  },
                  chats,
                  (chatMessage.tools?.filter((t) =>
                    t.status !== "done" && t.status !== "error"
                  )
                    .length ??
                    0) <= 1,
                );

                return photo;
              });
            }
          }).catch((err) => {
            this.updateMessage(
              {
                ...chatMessage,
                tools: chatMessage.tools?.map((t) => {
                  if (t.id === tool.id) {
                    return {
                      ...t,
                      status: "error",
                      parameters: {
                        ...t.parameters,
                        text: "",
                        path: "",
                      },
                    };
                  }

                  return t;
                }),
              },
              chats,
              (chatMessage.tools?.filter((t) =>
                t.status !== "done" && t.status !== "error"
              )
                .length ??
                0) <= 1,
            );

            log(err);
          });
        } else {
          this.updateMessage(
            {
              ...chatMessage,
              tools: chatMessage.tools?.map((t) => {
                if (t.id === tool.id) {
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

        return;
      }
    });
  }

  updateMessage(
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

    chat.messages[index] = {
      ...chatMessage,
      content: JSON.stringify(chatMessage.tools),
    };
    this.server.ws.update("chat-message", chat);

    if (continueMessage) {
      askRoute(this.server, chats, this).handler({
        messageID: chatMessage.id,
        chatID: chat.id,
        think: true,
      });
    }
  }
}

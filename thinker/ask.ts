import { Chat } from "../chat/chat.ts";
import { log } from "../core/log.ts";

const API_URL = "http://192.168.1.23:8081/v1/chat/completions";

export const thinkRegex = /<think>.*?(?:<\/think>|$)/gs;

export async function ask(
  chat: Chat,
  response: (data: Uint8Array) => void,
  finished?: () => void,
) {
  const resp = await fetch(API_URL, {
    headers: { "Content-Type": "application/json" },
    method: "POST",

    body: JSON.stringify({
      messages: chat.messages.map((message) => ({
        content: message.content,
        role: message.role,
      })),

      cache_prompt: true,
      stream: true,
    }),
  }).catch((err) => {
    log(err);
    finished && finished();
    return;
  });

  if (!resp) return;

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value) {
      const chunk = decoder.decode(value);
      // Each SSE line begins with "data: {...}"
      chunk.split("\n").forEach((line) => {
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            finished && finished();
            return;
          }
          const parsed = JSON.parse(payload);
          const delta = parsed.choices[0].delta.content;
          if (delta) response(new TextEncoder().encode(delta));
        }
      });
    }
  }
}

export async function simpleAsk(chat: Chat) {
  // const API_KEY = Deno.env.get("LLAMA_API_KEY") || ""; // optional

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
    },
    body: JSON.stringify({
      messages: chat.messages.map((message) => ({
        content: message.content.replace(thinkRegex, ""),
        role: message.role,
      })),

      tools: [
        {
          type: "function",
          function: {
            name: "analyze_device_camera",
            description: "For capturing an image and analyzing it with llm",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        /*{
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather in a given location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. San Francisco, CA",
                },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          },
        },*/
      ],
    }),
  }).catch((err) => {
    log(err);

    return {
      ok: false,
      text: () => "",
      json: () => {},
    };
  });

  // finish_reason: 'tool_calls' | 'stop'
  // message
  // - role: "user"
  // - reasoning_content: "I want to know the weather in San Francisco"
  // - content: "What is the weather in San Francisco?"
  // - tool_calls: [ type: function, function: get_weather, arguments: { location: San Francisco, unit: celsius } ]

  if (!response.ok) {
    console.error("Error:", await response.text());
    Deno.exit(1);
  }

  const data = await response.json();

  const exist = data && data.choices && data.choices.length;

  return {
    reasoning_content: exist && data.choices[0].message.reasoning_content,
    tool_calls: exist && data.choices[0].message.tool_calls,
    content: exist && data.choices[0].message.content,
    role: exist && data.choices[0].message.role,
  };
}

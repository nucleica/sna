import { ChatMessage } from "./chat.ts";

export function handleTools(message: ChatMessage): Partial<{
  tools_string: ChatMessage["tools_string"];
  tools: ChatMessage["tools"];
}> {
  const toolsCheck = /<tool>[\s\S]*?(?:<\/tool>|(?=$))/g.exec(message.content);
  if (!toolsCheck) {
    return {};
  }

  const tools: ChatMessage["tools"] = [...(message.tools || [])];
  let parsedTools = [];

  const text = toolsCheck[0]
    .replace("<tool>", "")
    .replace("</tool>", "")
    .trim();

  try {
    parsedTools = JSON.parse(text);
  } catch (e) {
    console.log(e);
    console.log(text);

    try {
      parsedTools = JSON.parse(text);
    } catch (e) {
      console.log("parsing second try failed");
    }
  }

  if (!parsedTools) {
    return {};
  }

  if (!Array.isArray(parsedTools)) {
    parsedTools = [parsedTools];
  }

  for (const t of tools) {
    const index = parsedTools.findIndex((pt) => pt.id === t.id);

    if (index === -1) {
      parsedTools.push({ ...t, id: crypto.randomUUID() });
    } else {
      parsedTools[index] = {
        ...t,
        ...parsedTools[index],
      };
    }
  }

  return {
    tools_string: toolsCheck[0].trim(),
    tools: parsedTools.map((tool) => ({
      id: crypto.randomUUID(),
      status: "pending",
      ...tool,
    })),
  };
}

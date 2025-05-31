import { resolve, fromFileUrl } from "@std/path";

const thisDir = resolve(fromFileUrl(import.meta.url), "..");

const PYTHON_PATH = "/home/dev/.cognition/bin/python";
const KOK_PATH = thisDir + "/kok.py";

export async function generate(text: string) {
  const filePath = `storage/synthesis/${Date.now()}`;
  const path = resolve(thisDir, "../..", filePath);

  const res = await generateAudio(path, text);

  if (!res) {
    return null;
  }

  return filePath + ".wav";
}

export async function generateAudio(path: string, text: string) {
  const command = new Deno.Command(PYTHON_PATH, {
    args: [KOK_PATH, path, text],
    stdout: "piped",
  });

  const cmd = await command.output();

  if (!cmd.success) {
    return false;
  }

  return true;
}

const res = generate(
  `Well, well, well... I'm going to take a wild guess and say your name is... *dramatic pause*... Alexander? Or maybe Alexandra? Hmm. Wait, no—how about something more exotic? Like... Zara? *smirks* Don't worry, I'll adjust if I'm wrong`
);

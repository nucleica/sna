import { fromFileUrl, resolve } from "@std/path";

const thisDir = resolve(fromFileUrl(import.meta.url), "..");

const PYTHON_PATH = "/home/dev/.cognition/bin/python";
const KOK_PATH = thisDir + "/kok.py";

const done = new Map();

export async function generate(text: string, id: string) {
  if (done.has(id)) {
    return done.get(id);
  }

  const filePath = `storage/synthesis/${Date.now()}`;
  const path = resolve(thisDir, "../..", filePath);

  done.set(id, path);

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

import { log } from "@nucleic/turtle";

const PIPER_PATH = "/home/dev/lib/piper/piper";

export async function generateSpeech(text: string, language: string) {
  const model = "/home/dev/model/pl_PL-gosia-medium.onnx";

  const command = new Deno.Command(PIPER_PATH, {
    args: ["-m", model, "-d", "storage/synthesis", "-f", "output.wav", text],
    stdout: "piped",
  });

  log(
    PIPER_PATH,
    "-m",
    model,
    "-d",
    "storage/synthesis",
    "-f",
    "output.wav",
    `"${text}"`
  );

  const out = await command.spawn().output();

  out.stdout.values().forEach((chunk) => {
    log(chunk);
  });
}

generateSpeech("Hello what the fuck!", "en");

import { PYTHON_PATH } from "./bebi/python.ts";
import { commandSync } from "./core/command.ts";
import { readConfig } from "./core/config.ts";
import { log } from "./core/log.ts";
import { Server } from "./core/server/server.ts";
import { Storage } from "./core/storage.ts";
import {
  capturePhoto,
  detectDevices,
  ensureFFMPEG,
} from "./modules/vision/capture.ts";

export class Bebi extends Server {
  storage = new Storage(this);
  port = 9421;

  constructor() {
    super();

    ensureFFMPEG();

    this.addRoute({
      path: "/take-photo",
      handler: async () => {
        const path = `storage/cam/${Date.now()}.jpg`;
        try {
          const code = await capturePhoto(path);

          return this.respond({
            path: `http://${
              Deno.networkInterfaces()[1].address
            }:${this.port}/${path}`,
          });
        } catch (err: any) {
          if (err?.code === "ENOENT") {
            log("FFMPEG not available");
          }
          return this.respond({ error: "", path: "" });
        }
      },
    });

    this.addRoute({
      path: "/analyze-photo",
      handler: async (res: { prompt: string; path: string }) => {
        try {
          const text = await moony(res.path, res.prompt);
          return this.respond({ path: res.path, text });
        } catch (err: any) {
          if (err?.code === "ENOENT") {
            log("FFMPEG not available");
          }
          return this.respond({ error: "", path: "" });
        }
      },
    });

    this.serve(this.port);

    const features: string[] = [];

    try {
      const pyt = commandSync(PYTHON_PATH, ["--version"]);

      if (pyt) {
        features.push(pyt);
      }
    } catch (err) {
    }

    const config = readConfig();

    fetch("http://192.168.1.12:9420/greet", {
      method: "POST",
      body: JSON.stringify({
        ip: Deno.networkInterfaces()[1].address,
        version: config.version,
        devices: detectDevices(),
        time: Date.now(),
        features,
      }),
    }).then(async (res) => {
      console.log(await res.json());
    });
  }
}

new Bebi();

export async function moony(path: string, prompt?: string) {
  const c = new Deno.Command(
    PYTHON_PATH,
    {
      args: [
        Deno.cwd() + "\\modules\\vision\\see.py",
        path,
        prompt ? prompt : "medium",
      ],
      stdout: "piped",
    },
  );

  const cmd = c.spawn();
  let response = "";

  for await (const value of await cmd.stdout.values()) {
    const data = new TextDecoder().decode(value);

    response += data;
  }

  return response;
}

import { log } from "./core/log.ts";
import { Server } from "./core/server/server.ts";
import { Storage } from "./core/storage.ts";
import { capturePhoto, ensureFFMPEG } from "./modules/vision/capture.ts";

export class Bebi extends Server {
  storage = new Storage(this);

  constructor() {
    super();

    ensureFFMPEG();

    this.addRoute({
      path: "/take-photo",
      handler: async () => {
        const path = `storage/cam/${Date.now()}.jpg`;
        try {
          const code = await capturePhoto(path);
          return this.respond({ path });
        } catch (err: any) {
          if (err?.code === "ENOENT") {
            log("FFMPEG not available");
          }
          return this.respond({ error: "", path: "" });
        }
      },
    });

    this.serve(9421);

    fetch("http://192.168.1.12:9420/greet").then(async (res) => {
      console.log(await res.json());
    });
  }
}

new Bebi();

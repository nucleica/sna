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
      handler: () => {
        const path = `storage/cam/${Date.now()}.jpg`;
        try {
          const code = capturePhoto(path);
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
  }
}

new Bebi();

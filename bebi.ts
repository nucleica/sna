import { Server } from "./core/server/server.ts";
import { Storage } from "./core/storage.ts";
import { capturePhoto } from "./modules/vision/capture.ts";

export class Bebi extends Server {
  storage = new Storage(this);

  constructor() {
    super();

    this.addRoute({
      path: "/take-photo",
      handler: () => {
        const path = `storage/cam/${Date.now()}.jpg`;
        const code = capturePhoto(path);
        return this.respond({ path });
      },
    });

    this.serve(9421);
  }
}

new Bebi();

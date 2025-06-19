import { Matter, MATTER_CONFIG_NAME, type MatterConfig } from "@nucleic/matter";
import { pathLookup } from "./fs.ts";
import { SOURCES_PATH } from "./sources.ts";

export interface ServiceStatus {
  installed: boolean;
  active: boolean;
  failed: boolean;
  memory?: string;
  cpu?: string;
  name: string;
  port?: number;
}

export class Service {
  services: Matter[] = [];
  lastPort = 9420;
  constructor() {
  }

  find(service: string) {
    return this.services.find((s) => s.serviceName === service);
  }

  addServices(...paths: string[]) {
    for (const path of paths) {
      const fullPath = SOURCES_PATH + "/" + path;
      const directory = pathLookup(fullPath);

      const setup = directory.files.find(({ name }) =>
        name === MATTER_CONFIG_NAME
      );

      if (setup) {
        const file = Deno.readFileSync(fullPath + "/" + MATTER_CONFIG_NAME);

        const configs = JSON.parse(
          new TextDecoder().decode(file),
        ) as MatterConfig[];

        for (const config of configs) {
          const matter = new Matter(
            config.name,
            config.exec,
            config.cwd,
            this.lastPort += 1,
          );

          this.services.push(matter);
        }
      }
    }

    return this.services;
  }
}

import {
  Matter,
  MATTER_CONFIG_NAME,
  type MatterConfig,
} from "../../matter/main.ts";
import { pathLookup } from "./fs.ts";
import { SOURCES_PATH } from "./sources.ts";

export interface ServiceStatus {
  installed: boolean;
  active: boolean;
  name: string;
}

export class Service {
  services: Matter[] = [];
  constructor() {
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
          const matter = new Matter(config.name, config.exec, config.cwd);
          this.services.push(matter);
        }
      }
    }
  }
}

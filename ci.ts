import { Color, o, t } from "@nucleic/turtle";
import { readConfig } from "./core/config.ts";
import { ServiceStatus } from "./src/services.ts";

const URL = "127.0.0.1:9420";

if (import.meta.main) {
  const { name, version } = readConfig();
  console.clear();
  o("\nSilicon", "Nucleic", { ansi: "\[32m" }, "Array\n");
  t("Looking around...");

  const response = await snaConnect();

  if (!response) {
    t("Not accessible", { ansi: `\[${Color.red}m` });
    Deno.exit();
  }

  if (response.name === name) {
    const ws = new WebSocket(`ws://${URL}`);

    ws.onopen = async () => {
      t(`${response.version} array accesed`);
      const services: ServiceStatus[] = await getServices();

      t(`${services.length}`, "matters");
      for (const service of services) {
        o(
          "-",
          service.name,
          service.installed
            ? service.active ? "active" : "inactive"
            : "not installed",
        );
      }
    };
    ws.onclose = () => {
      t("conn closed");
    };
  }
}

export function getServices() {
  return fetch(`http://${URL}/services`).then((res) => res.json()).catch(
    (err) => {},
  );
}

export function snaConnect() {
  return fetch(`http://${URL}/info`).then((res) => res.json()).catch(
    (err) => {},
  );
}

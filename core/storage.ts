import { Server } from "./server/server.ts";
import { log } from "./log.ts";

export class Storage {
  directories = ["cam", "synthesis", "audio"];

  constructor(private server: Server) {
    this.setup().then(async () => {
      for await (const dir of this.directories) {
        const amount = await analyzeDirectory(dir).catch(() => 0);

        if (amount > 4) {
          await deleteOldestFiles(dir, 20);
        }
      }
    });
  }

  async setup() {
    const checkStorageDir = await Deno.stat("storage").catch(() => false);

    if (!checkStorageDir) {
      await createDirectories(
        ["storage", "storage/cam", "storage/synthesis", "storage/audio"],
        "Storage created"
      );
    } else {
      createDirectories(["storage/cam"], "No cam directory detected");
      createDirectories(["storage/audio"], "No audio directory detected");
      createDirectories(
        ["storage/synthesis"],
        "No synthesis directory detected"
      );
    }

    log("Storage ready");
  }
}

export async function createDirectories(paths: string[], logMessage?: string) {
  const createdFolders = [];

  for await (const dir of paths) {
    const check = await Deno.stat(dir).catch(() => false);

    if (!check) {
      await Deno.mkdir(dir);
      createdFolders.push(dir);
    }
  }

  if (logMessage && createdFolders.length > 0) {
    log(logMessage);
  }
}

export async function analyzeDirectory(directory: string) {
  const files = await Deno.readDir(`storage/${directory}`);

  let amount = 0;

  for await (const file of files) {
    amount += 1;
  }

  log(`${directory} has ${amount} files`);

  return amount;
}

export async function deleteOldestFiles(dir: string, keep: number) {
  const files = await Deno.readDir(`storage/${dir}`);
  const stats = [];
  let deleted = 0;

  for await (const file of files) {
    file.isFile &&
      stats.push({
        ...(await Deno.stat(`storage/${dir}/${file.name}`)),
        name: file.name,
      });
  }

  stats.sort((a, b) => (a.mtime?.valueOf() || 0) - (b.mtime?.valueOf() || 0));

  const toSlice = stats.slice(-1 * Math.abs(stats.length - keep));

  toSlice.forEach((stat) => {
    Deno.removeSync(`storage/${dir}/${stat.name}`);
    deleted += 1;
  });

  log(`Deleted ${deleted} files from ${dir}`);
}

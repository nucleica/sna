import { log } from "../../core/log.ts";
import { commandSync } from "../../core/command.ts";

export function capturePhoto(outputFile: string, deviceName?: string) {
  const c = detectDevice(deviceName);

  const cmd = new Deno.Command(ffmpegPath(), {
    args: ffmpegCommand(Deno.build.os, c.device, outputFile),
    stdout: "piped",
  }).spawn();

  return cmd.output().then((out) => {
    out.stdout.values().forEach((chunk) => {
      // log(chunk);
    });

    return cmd.status;
  });
}

export function detectWindowsCameras() {
  const response = commandSync(
    "powershell.exe",
    [
      "pnputil",
      "/enum-devices",
      "/class",
      "Camera",
      "/connected",
    ],
  ).split("\n");

  return response.filter((r) => r.includes("Device Description:")).map((r) =>
    "video=" +
    r.replace("Device Description: ", "").replace("\r", "").trim()
  ).map((device) => ({ name: "", device }));
}

export function detectDevice(deviceName?: string) {
  let cameras = [];

  if (Deno.build.os === "linux") {
    cameras = commandSync("v4l2-ctl", ["--list-devices"]).split("\n\n")
      .filter((r) => r.trim())
      .map((r) => {
        const [name, device] = r.split("\n");

        return { name, device: device && device.replace("\t", "") };
      });
  } else {
    cameras = detectWindowsCameras();
  }

  return cameras?.find((d) => d.name === deviceName) || cameras && cameras[0];
}

export function ffmpegCommand(os: string, device: string, outputFile: string) {
  switch (os) {
    case "windows":
      return ["-f", "dshow", "-i", device, "-vframes", "1", outputFile];

    default:
      return ["-y", "-f", "v4l2", "-i", device, "-vframes", "1", outputFile];
  }
}

export async function ensureWinget() {
  try {
    const checkCmd = new Deno.Command("winget", { args: ["--version"] });
    await checkCmd.output(); // Just check if it runs
    log("Winget found. Proceeding with installation.");
  } catch (er) {
    log("Winget not found. Installing...");

    // this deno app dir
    const winInstall = new Deno.Command("powershell.exe", {
      args: [
        Deno.cwd() + "\\bebi\\winget-install.ps1",
      ],
    });

    await winInstall.output();

    log("Winget installed.");
  }
}

export function ffmpegPath() {
  return Deno.build.os === "windows"
    ? Deno.cwd() +
      "\\bin\\ffmpeg-N-119779-g6c291232cf-win64-gpl-shared\\bin\\ffmpeg"
    : "ffmpeg";
}

export async function ensureFFMPEG() {
  const ffmpeg = new Deno.Command(ffmpegPath(), {
    args: ["-version"],
  });

  try {
    const cmd = await ffmpeg.output();
  } catch (er) {
    // install ffmpeg on windows
    if (Deno.build.os === "windows") {
      log("ffmpeg not found");
    }
  }

  return true;
}

export async function installPackage(pkgName: string) {
  await ensureWinget();

  const installCmd = new Deno.Command("winget", {
    args: [
      "install",
      pkgName, // Specify source to avoid ambiguity
      "--accept-package-agreements",
      "--accept-source-agreements",
      // Optional: --silent
      // Optional: --scope machine (requires elevated terminal) or --scope user
    ],
    // Pipe output so you can see the installation progress in the console
    stdout: "inherit",
    stderr: "inherit",
  });

  try {
    const process = installCmd.spawn();

    const status = await process.status;

    if (status.success) {
      console.log(
        `${pkgName} installation with Winget completed successfully!`,
      );
      console.log(
        `You might need to restart your terminal or log out/in for ${pkgName} to be available in your PATH.`,
      );
    } else {
      console.error(
        `${pkgName} installation with Winget failed with exit code ${status.code}.`,
      );
      console.error(
        "Check the output above for details. Ensure you ran the script in an elevated terminal.",
      );
    }
  } catch (error) {
    console.error("An error occurred while trying to run Winget:", error);
    console.error(
      "Ensure Winget is installed and the script is running in an elevated terminal.",
    );
  }
}

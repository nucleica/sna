export function capturePhoto(outputFile: string) {
  const os = Deno.build.os;

  const device = os === "linux" ? "/dev/video0" : "video=Integrated Camera";

  const cmd = new Deno.Command("ffmpeg", {
    args: ffmpegCommand(Deno.build.os, device, outputFile),
    stdout: "piped",
  }).spawn();

  return cmd.output().then((out) => {
    out.stdout.values().forEach((chunk) => {
      // log(chunk);
    });

    return cmd.status;
  });
}

export function ffmpegCommand(os: string, device: string, outputFile: string) {
  switch (os) {
    case "windows":
      return ["-f", "dshow", "-i", device, "-vframes", "1", outputFile];

    default:
      return ["-y", "-f", "v4l2", "-i", device, "-vframes", "1", outputFile];
  }
}

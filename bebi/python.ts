export let PYTHON_PATH = "";

if (Deno.build.os === "windows") {
  PYTHON_PATH = "C:\\Users\\dev\\cognition\\Scripts\\python.exe";
} else {
  PYTHON_PATH = "/home/dev/.cognition/bin/python";
}

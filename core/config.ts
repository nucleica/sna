export function readConfig() {
  return JSON.parse(new TextDecoder().decode(
    Deno.readFileSync(Deno.cwd() + "/deno.json"),
  ));
}

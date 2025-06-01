export function commandSync(command: string, args: string[] = []) {
  const shell = new Deno.Command(command, { args }).outputSync();
  return new TextDecoder().decode(shell.stdout);
}

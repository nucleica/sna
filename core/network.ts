export function myIp() {
  return Deno.networkInterfaces()[1].address;
}

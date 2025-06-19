export interface Directory extends File {
  directories?: Directory[];
}

export interface File {
  name: string;
}

export function pathLookup(path: string) {
  const sources = Deno.readDirSync(path);
  const directories: Directory[] = [];
  const files: File[] = [];

  for (const source of sources) {
    let dir: Directory = { name: source.name };

    if (source.isDirectory) {
      directories.push(dir);
    } else if (source.isFile) {
      files.push(dir);
    }
  }

  return {
    directories,
    files,
  };
}

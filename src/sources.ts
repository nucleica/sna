import { pathLookup } from "./fs.ts";

export function checkSources() {
  const sources = pathLookup(SOURCES_PATH);
  const nucleic = [];
  const others = [];

  for (const directory of sources.directories) {
    if (NUCLEIC_LIBRARIES.includes(directory.name)) {
      nucleic.push(directory);
    } else {
      others.push(directory);
    }
  }

  return {
    nucleic,
    others,
  };
}

export const SOURCES_PATH = "/home/dev/sources";

export const NUCLEIC_LIBRARIES = [
  "matter",
  "cell",
  "neye",
  "venous",
  "turtle",
  "vein",
  "she",
  "sna",
  "mem",
];

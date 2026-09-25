export interface ScratchExtensionSpec {
  id:
    | "pen"
    | "wedo2"
    | "music"
    | "microbit"
    | "text2speech"
    | "translate"
    | "videoSensing"
    | "ev3"
    | "makeymakey"
    | "boost"
    | "gdxfor";
  runtimeSupport:
    | "core"
    | "hardware"
    | "web-limited";
  generatorSupport:
    | "planned"
    | "supported";
}

export const SCRATCH_EXTENSIONS:
  ReadonlyArray<ScratchExtensionSpec> = [
    {
      id: "pen",
      runtimeSupport: "core",
      generatorSupport: "supported"
    },
    {
      id: "wedo2",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    },
    {
      id: "music",
      runtimeSupport: "core",
      generatorSupport: "planned"
    },
    {
      id: "microbit",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    },
    {
      id: "text2speech",
      runtimeSupport: "web-limited",
      generatorSupport: "planned"
    },
    {
      id: "translate",
      runtimeSupport: "web-limited",
      generatorSupport: "planned"
    },
    {
      id: "videoSensing",
      runtimeSupport: "web-limited",
      generatorSupport: "planned"
    },
    {
      id: "ev3",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    },
    {
      id: "makeymakey",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    },
    {
      id: "boost",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    },
    {
      id: "gdxfor",
      runtimeSupport: "hardware",
      generatorSupport: "planned"
    }
  ];

export function isKnownExtension(
  value: string
): value is ScratchExtensionSpec["id"] {
  return SCRATCH_EXTENSIONS.some(
    (extension) =>
      extension.id === value
  );
}

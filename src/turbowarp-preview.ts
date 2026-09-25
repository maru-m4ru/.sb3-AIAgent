
import { buildSb3 } from "./sb3/builder";
import type { LoadedScratchProject } from "./core/types";

type TurboWarpRuntime = {
  width: number;
  height: number;
  resizeMode: string;
  editableLists: boolean;
  shouldConnectPeripherals: boolean;
  usePackagedRuntime: boolean;
  setup: () => void;
  appendTo: (element: HTMLElement) => void;
  loadProject: (project: ArrayBuffer | Uint8Array) => Promise<void>;
  greenFlag: () => void;
};

type TurboWarpGlobal = {
  Scaffolding: new () => TurboWarpRuntime;
};

declare global {
  interface Window {
    Scaffolding?: TurboWarpGlobal;
  }
}

const RUNTIME_URL =
  "https://cdn.jsdelivr.net/npm/@turbowarp/scaffolding@0.4.0/dist/scaffolding-min.js";

let runtimePromise: Promise<TurboWarpGlobal> | null = null;

function loadRuntime(): Promise<TurboWarpGlobal> {
  if (window.Scaffolding) {
    return Promise.resolve(window.Scaffolding);
  }

  if (runtimePromise) {
    return runtimePromise;
  }

  runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = RUNTIME_URL;
    script.async = true;

    script.onload = () => {
      if (!window.Scaffolding) {
        reject(
          new Error(
            "TurboWarp Runtime was loaded but Scaffolding is unavailable."
          )
        );
        return;
      }

      resolve(window.Scaffolding);
    };

    script.onerror = () => {
      reject(
        new Error(
          "TurboWarp Runtime could not be loaded."
        )
      );
    };

    document.head.appendChild(script);
  });

  return runtimePromise;
}

export async function openTurboWarpPreview(
  project: LoadedScratchProject
): Promise<void> {
  const overlay =
    document.querySelector<HTMLDivElement>(
      "#preview-overlay"
    );
  const stage =
    document.querySelector<HTMLDivElement>(
      "#preview-stage"
    );

  if (!overlay || !stage) {
    throw new Error(
      "Preview container is missing."
    );
  }

  overlay.hidden = false;
  stage.replaceChildren();

  const runtimeModule = await loadRuntime();
  const runtime = new runtimeModule.Scaffolding();

  runtime.width = 480;
  runtime.height = 360;
  runtime.resizeMode = "preserve-ratio";
  runtime.editableLists = false;
  runtime.shouldConnectPeripherals = true;
  runtime.usePackagedRuntime = false;

  runtime.setup();
  runtime.appendTo(stage);

  const blob = await buildSb3(project);
  const data = await blob.arrayBuffer();

  await runtime.loadProject(data);
  runtime.greenFlag();
}

export function closeTurboWarpPreview(): void {
  const overlay =
    document.querySelector<HTMLDivElement>(
      "#preview-overlay"
    );
  const stage =
    document.querySelector<HTMLDivElement>(
      "#preview-stage"
    );

  if (stage) {
    stage.replaceChildren();
  }

  if (overlay) {
    overlay.hidden = true;
  }
}

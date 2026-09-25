import { buildSb3, downloadBlob } from "./sb3/builder";
import { fetchScratchProject } from "./scratch/project";
import { evaluateScratchFeasibility } from "./agent/feasibility";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <style>
    :root {
      color-scheme: dark;
      font-family: system-ui, sans-serif;
    }

    body {
      margin: 0;
      background: #0b0f14;
      color: #edf2f7;
    }

    main {
      max-width: 1000px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    .panel {
      background: #111821;
      border: 1px solid #263341;
      border-radius: 12px;
      padding: 18px;
      margin-top: 16px;
    }

    input, textarea, button {
      width: 100%;
      box-sizing: border-box;
      padding: 11px;
      margin-top: 8px;
      border-radius: 8px;
      border: 1px solid #32404e;
      background: #0c1117;
      color: inherit;
      font: inherit;
    }

    textarea {
      min-height: 130px;
      resize: vertical;
    }

    button {
      cursor: pointer;
      font-weight: 700;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>

  <h1>SB3 AI Agent</h1>
  <p>Scratch-first generation and project editing foundation.</p>

  <section class="panel">
    <strong>Project ID</strong>
    <input id="project-id" placeholder="例: 123456789">
    <button id="load-project">Scratch Projectを取得</button>
    <pre id="project-status">未取得</pre>
  </section>

  <section class="panel">
    <strong>Scratch implementation request</strong>
    <textarea id="request" placeholder="例: プレイヤーが壁をすり抜けないようにする"></textarea>
    <button id="check-feasibility">Scratch実装可能性を確認</button>
    <pre id="feasibility-status">未確認</pre>
  </section>

  <section class="panel">
    <strong>SB3 export</strong>
    <button id="export-sb3" disabled>.sb3を生成</button>
    <pre id="export-status">プロジェクトを取得すると有効になります。</pre>
  </section>
`;

let loadedProject:
  Awaited<ReturnType<typeof fetchScratchProject>> | null = null;

const projectStatus =
  document.querySelector<HTMLPreElement>("#project-status");

const feasibilityStatus =
  document.querySelector<HTMLPreElement>("#feasibility-status");

const exportStatus =
  document.querySelector<HTMLPreElement>("#export-status");

const projectIdInput =
  document.querySelector<HTMLInputElement>("#project-id");

const requestInput =
  document.querySelector<HTMLTextAreaElement>("#request");

const exportButton =
  document.querySelector<HTMLButtonElement>("#export-sb3");

document
  .querySelector<HTMLButtonElement>("#load-project")
  ?.addEventListener("click", async () => {
    if (!projectIdInput || !projectStatus || !exportButton) {
      return;
    }

    projectStatus.textContent = "取得中...";
    exportButton.disabled = true;

    try {
      loadedProject = await fetchScratchProject(projectIdInput.value);

      projectStatus.textContent = JSON.stringify(
        {
          id: loadedProject.id,
          title: loadedProject.metadata.title,
          targets: loadedProject.project.targets.length,
          assets: loadedProject.assets.length
        },
        null,
        2
      );

      exportButton.disabled = false;
    } catch (error) {
      loadedProject = null;
      projectStatus.textContent = String(error);
    }
  });

document
  .querySelector<HTMLButtonElement>("#check-feasibility")
  ?.addEventListener("click", () => {
    if (!requestInput || !feasibilityStatus) {
      return;
    }

    const result = evaluateScratchFeasibility(requestInput.value);
    feasibilityStatus.textContent = JSON.stringify(result, null, 2);
  });

exportButton?.addEventListener("click", async () => {
  if (!loadedProject || !exportStatus) {
    return;
  }

  exportStatus.textContent = ".sb3生成中...";

  try {
    const blob = await buildSb3(loadedProject);
    const id = loadedProject.id;

    downloadBlob(blob, `scratch-project-${id}.sb3`);
    exportStatus.textContent = "生成完了";
  } catch (error) {
    exportStatus.textContent = String(error);
  }
});

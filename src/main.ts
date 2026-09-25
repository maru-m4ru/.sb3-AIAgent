import { buildSb3, downloadBlob } from "./sb3/builder";
import { fetchScratchProject } from "./scratch/project";
import { createScratchAsset, createScratchProject } from "./scratch/project-factory";
import { applyScratchProgram } from "./scratch/compiler";
import { evaluateScratchFeasibility } from "./agent/feasibility";
import { planScratchRequest } from "./agent/demo-planner";
import { validateGenerationPlan } from "./agent/plan-validator";\nimport { compileCostumes } from "./costume/compiler";

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
      max-width: 1100px;
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

    input,
    textarea,
    button {
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

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (max-width: 760px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  </style>

  <h1>SB3 AI Agent</h1>
  <p>Scratch-first generation and project editing foundation.</p>

  <section class="panel">
    <strong>Generate</strong>
    <textarea id="request" placeholder="例: 旗が押されたら10歩動いて、こんにちはと言う"></textarea>

    <div class="row">
      <button id="plan">生成計画を作る</button>
      <button id="generate">新規SB3を生成</button>
    </div>

    <pre id="generation-status">未実行</pre>
  </section>

  <section class="panel">
    <strong>Existing Project ID</strong>
    <input id="project-id" placeholder="例: 123456789">
    <button id="load-project">Scratch Projectを取得</button>
    <pre id="project-status">未取得</pre>
  </section>

  <section class="panel">
    <strong>Scratch feasibility</strong>
    <button id="check-feasibility">Scratch実装可能性を確認</button>
    <pre id="feasibility-status">生成リクエストを入力して確認してください。</pre>
  </section>

  <section class="panel">
    <strong>Export</strong>
    <button id="export-sb3" disabled>.sb3を生成</button>
    <pre id="export-status">生成プロジェクトまたはProject ID取得後に有効になります。</pre>
  </section>
`;

let loadedProject:
  Awaited<ReturnType<typeof fetchScratchProject>> | null = null;

let generatedProject:
  Awaited<ReturnType<typeof createScratchProject>> | null = null;

let generatedAssets:
  ReturnType<typeof createScratchAsset>[] = [];

const requestInput =
  document.querySelector<HTMLTextAreaElement>("#request");

const generationStatus =
  document.querySelector<HTMLPreElement>("#generation-status");

const feasibilityStatus =
  document.querySelector<HTMLPreElement>("#feasibility-status");

const exportStatus =
  document.querySelector<HTMLPreElement>("#export-status");

const projectStatus =
  document.querySelector<HTMLPreElement>("#project-status");

const projectIdInput =
  document.querySelector<HTMLInputElement>("#project-id");

const exportButton =
  document.querySelector<HTMLButtonElement>("#export-sb3");

document
  .querySelector<HTMLButtonElement>("#plan")
  ?.addEventListener("click", () => {
    if (!requestInput || !generationStatus) {
      return;
    }

    try {
      const plan = planScratchRequest(
        requestInput.value
      );

      generationStatus.textContent =
        JSON.stringify(plan, null, 2);
    } catch (error) {
      generationStatus.textContent = String(error);
    }
  });

document
  .querySelector<HTMLButtonElement>("#generate")
  ?.addEventListener("click", () => {
    if (!requestInput || !generationStatus || !exportButton) {
      return;
    }

    try {
      const rawPlan = planScratchRequest(
        requestInput.value
      );

      const plan = validateGenerationPlan(
        rawPlan
      );

      if (plan.verdict === "OPPOSE") {
        generationStatus.textContent =
          JSON.stringify(plan, null, 2);

        generatedProject = null;
        generatedAssets = [];
        exportButton.disabled = true;
        return;
      }

      const project = createScratchProject();
      applyScratchProgram(
        project,
        plan.script
      );

      generatedAssets = [
        createScratchAsset()
      ];

      const sprite = project.targets.find(
        (target) => target.name === plan.script.target
      );

      if (!sprite) {
        throw new Error(
          `Scratch target not found: ${plan.script.target}`
        );
      }

      generatedAssets.push(
        ...compileCostumes(
          sprite,
          plan.script.costumes ?? []
        )
      );

      generatedProject = project;

      generationStatus.textContent =
        JSON.stringify(
          {
            verdict: plan.verdict,
            goal: plan.goal,
            target: plan.script.target,
            operations: plan.script.operations
          },
          null,
          2
        );

      exportButton.disabled = false;
      exportStatus!.textContent =
        "新規プロジェクトの生成準備完了";
    } catch (error) {
      generatedProject = null;
      generatedAssets = [];
      exportButton.disabled = true;
      generationStatus.textContent = String(error);
    }
  });

document
  .querySelector<HTMLButtonElement>("#load-project")
  ?.addEventListener("click", async () => {
    if (!projectIdInput || !projectStatus || !exportButton) {
      return;
    }

    projectStatus.textContent = "取得中...";
    exportButton.disabled = true;

    try {
      loadedProject = await fetchScratchProject(
        projectIdInput.value
      );

      generatedProject = null;
      generatedAssets = [];

      projectStatus.textContent =
        JSON.stringify(
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

    const result =
      evaluateScratchFeasibility(
        requestInput.value
      );

    feasibilityStatus.textContent =
      JSON.stringify(
        result,
        null,
        2
      );
  });

exportButton?.addEventListener(
  "click",
  async () => {
    if (!exportStatus) {
      return;
    }

    exportStatus.textContent =
      ".sb3生成中...";

    try {
      if (generatedProject) {
        const blob = await buildSb3({
          id: "generated",
          metadata: {
            id: 0,
            title: "Generated Scratch Project"
          },
          project: generatedProject,
          assets: generatedAssets
        });

        downloadBlob(
          blob,
          "generated-scratch-project.sb3"
        );

        exportStatus.textContent =
          "生成プロジェクトを出力しました。";
        return;
      }

      if (loadedProject) {
        const blob = await buildSb3(
          loadedProject
        );

        downloadBlob(
          blob,
          `scratch-project-${loadedProject.id}.sb3`
        );

        exportStatus.textContent =
          "取得したプロジェクトを再パックしました。";
        return;
      }

      exportStatus.textContent =
        "出力対象がありません。";
    } catch (error) {
      exportStatus.textContent =
        String(error);
    }
  }
);

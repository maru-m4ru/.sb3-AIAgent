
import "./ui.css";
import { buildSb3, downloadBlob } from "./sb3/builder";
import { loadScratchProjectFile } from "./scratch/local-project";
import { createScratchAsset, createScratchProject } from "./scratch/project-factory";
import { applyScratchProgram } from "./scratch/compiler";
import { planScratchRequest } from "./agent/demo-planner";
import { validateGenerationPlan } from "./agent/plan-validator";
import { compileCostumes } from "./costume/compiler";
import {
  openTurboWarpPreview,
  closeTurboWarpPreview
} from "./turbowarp-preview";

const app =
  document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = [
  '<div class="app-shell">',
  '  <aside class="sidebar">',
  '    <div class="model-name">SB3 AI Agent</div>',
  '    <nav class="nav" aria-label="メインメニュー">',
  '      <button class="nav-button" id="new-chat" type="button">',
  '        <span class="nav-icon" aria-hidden="true">',
  '          <svg viewBox="0 0 28 28">',
  '            <rect x="4" y="7" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"></rect>',
  '            <path d="M13 17 22 8l2 2-9 9-4 .7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>',
  '            <path d="m19.8 10.2 2 2" fill="none" stroke="currentColor" stroke-width="1.5"></path>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">新しいチャット</span>',
  '          <span class="nav-subtitle">new chat</span>',
  '        </span>',
  '      </button>',
  '      <button class="nav-button" id="file-menu" type="button">',
  '        <span class="nav-icon" aria-hidden="true">',
  '          <svg viewBox="0 0 28 28">',
  '            <path d="M4 6.5h8l2 2h10v13H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>',
  '            <path d="M14 8.5h10" fill="none" stroke="currentColor" stroke-width="1.5"></path>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">ファイル</span>',
  '          <span class="nav-subtitle">file</span>',
  '        </span>',
  '      </button>',
  '      <button class="nav-button" id="preview-menu" type="button">',
  '        <span class="nav-icon" aria-hidden="true">',
  '          <svg viewBox="0 0 28 28">',
  '            <rect x="3.5" y="4" width="21" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"></rect>',
  '            <path d="M10 23h8M14 19v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">プレビュー</span>',
  '          <span class="nav-subtitle">preview</span>',
  '        </span>',
  '      </button>',
  '    </nav>',
  '    <div class="sidebar-bottom">',
  '      <button class="settings-button" id="settings-menu" type="button" aria-label="設定">⚙</button>',
  '      <div class="settings-popover" id="settings-popover" hidden>',
  '        <div class="settings-title">SB3 AI Agent</div>',
  '        <div class="settings-body">Scratch 3プロジェクト生成。<br>プレビューはTurboWarp Runtimeを使用します。</div>',
  '      </div>',
  '    </div>',
  '    <input class="hidden-input" id="file-input" type="file" accept=".sb3,application/x.scratch.sb3,application/zip">',
  '  </aside>',
  '  <main class="workspace">',
  '    <section class="hero">',
  '      <div>',
  '        <h1 class="hero-title">SB3 AI Agent</h1>',
  '        <span class="hero-version">(0.1.0)</span>',
  '      </div>',
  '    </section>',
  '    <section class="composer-area">',
  '      <form class="composer" id="composer">',
  '        <textarea class="composer-input" id="request" rows="1" placeholder="作成したいプロジェクトのイメージは？" aria-label="Scratchプロジェクトの作成指示"></textarea>',
  '        <button class="send-button" type="submit" aria-label="生成">↑</button>',
  '      </form>',
  '      <div class="status" id="status">新しいプロジェクトを作成できます。</div>',
  '    </section>',
  '  </main>',
  '</div>',
  '<div class="preview-overlay" id="preview-overlay" hidden>',
  '  <div class="preview-shell" role="dialog" aria-modal="true" aria-labelledby="preview-title">',
  '    <div class="preview-head">',
  '      <div class="preview-title" id="preview-title">TurboWarp プレビュー</div>',
  '      <button class="preview-close" id="preview-close" type="button" aria-label="閉じる">×</button>',
  '    </div>',
  '    <div class="preview-stage" id="preview-stage"></div>',
  '    <div class="preview-actions">',
  '      <button class="preview-save" id="preview-save" type="button">.sb3を保存</button>',
  '    </div>',
  '  </div>',
  '</div>'
].join("");

type ScratchLoaded =
  Awaited<ReturnType<typeof loadScratchProjectFile>>;

let loadedProject: ScratchLoaded | null = null;
let generatedProject:
  Awaited<ReturnType<typeof createScratchProject>> | null = null;
let generatedAssets:
  ReturnType<typeof createScratchAsset>[] = [];

const requestInput =
  document.querySelector<HTMLTextAreaElement>("#request");

const status =
  document.querySelector<HTMLDivElement>("#status");

const fileInput =
  document.querySelector<HTMLInputElement>("#file-input");

const settingsPopover =
  document.querySelector<HTMLDivElement>(
    "#settings-popover"
  );

function getCurrentProject(): ScratchLoaded | null {
  if (generatedProject) {
    return {
      id: "generated",
      metadata: {
        id: 0,
        title: "Generated Scratch Project"
      },
      project: generatedProject,
      assets: generatedAssets
    };
  }

  return loadedProject;
}

function setStatus(message: string): void {
  if (status) {
    status.textContent = message;
  }
}

function clearProjectState(): void {
  generatedProject = null;
  generatedAssets = [];
  loadedProject = null;
}

document
  .querySelector<HTMLButtonElement>("#new-chat")
  ?.addEventListener(
    "click",
    () => {
      closeTurboWarpPreview();
      clearProjectState();

      if (requestInput) {
        requestInput.value = "";
        requestInput.style.height = "auto";
      }

      setStatus("新しいチャットを開始しました。");
      requestInput?.focus();
    }
  );

document
  .querySelector<HTMLButtonElement>("#file-menu")
  ?.addEventListener(
    "click",
    () => {
      fileInput?.click();
    }
  );

fileInput?.addEventListener(
  "change",
  async () => {
    const file =
      fileInput.files?.[0];

    if (!file) {
      return;
    }

    setStatus("プロジェクトを読み込んでいます...");

    try {
      loadedProject =
        await loadScratchProjectFile(file);

      generatedProject = null;
      generatedAssets = [];

      setStatus(
        "読み込み完了: " + file.name
      );
    } catch (error) {
      loadedProject = null;
      setStatus(String(error));
    } finally {
      fileInput.value = "";
    }
  }
);

document
  .querySelector<HTMLFormElement>("#composer")
  ?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (!requestInput) {
        return;
      }

      const request =
        requestInput.value.trim();

      if (!request) {
        setStatus("生成内容を入力してください。");
        requestInput.focus();
        return;
      }

      setStatus("生成計画を作成しています...");

      try {
        const rawPlan =
          planScratchRequest(request);

        const plan =
          validateGenerationPlan(rawPlan);

        if (plan.verdict === "OPPOSE") {
          setStatus(
            "この内容は現在の生成器では安定して実装できません。"
          );
          return;
        }

        const project =
          createScratchProject();

        applyScratchProgram(
          project,
          plan.script
        );

        const assets = [
          createScratchAsset()
        ];

        const sprite =
          project.targets.find(
            (target) =>
              target.name === plan.script.target
          );

        if (!sprite) {
          throw new Error(
            "Scratch target not found: " +
            plan.script.target
          );
        }

        assets.push(
          ...compileCostumes(
            sprite,
            plan.script.costumes ?? []
          )
        );

        generatedProject = project;
        generatedAssets = assets;
        loadedProject = null;

        setStatus(
          "生成完了。プレビューからTurboWarpで実行できます。"
        );
      } catch (error) {
        generatedProject = null;
        generatedAssets = [];
        setStatus(String(error));
      }
    }
  );

document
  .querySelector<HTMLButtonElement>("#preview-menu")
  ?.addEventListener(
    "click",
    async () => {
      const project =
        getCurrentProject();

      if (!project) {
        setStatus(
          "先にプロジェクトを生成するか、.sb3ファイルを読み込んでください。"
        );
        return;
      }

      setStatus(
        "TurboWarpプレビューを準備しています..."
      );

      try {
        await openTurboWarpPreview(
          project
        );

        setStatus(
          "TurboWarpプレビューを表示しています。"
        );
      } catch (error) {
        setStatus(String(error));
      }
    }
  );

document
  .querySelector<HTMLButtonElement>("#preview-close")
  ?.addEventListener(
    "click",
    () => {
      closeTurboWarpPreview();
      setStatus("プレビューを閉じました。");
    }
  );

document
  .querySelector<HTMLButtonElement>("#preview-save")
  ?.addEventListener(
    "click",
    async () => {
      const project =
        getCurrentProject();

      if (!project) {
        setStatus(
          "保存できるプロジェクトがありません。"
        );
        return;
      }

      try {
        const blob =
          await buildSb3(project);

        const filename =
          project.id === "generated"
            ? "generated-scratch-project.sb3"
            : "scratch-project-" +
              project.id +
              ".sb3";

        downloadBlob(
          blob,
          filename
        );

        setStatus(
          ".sb3を保存しました。"
        );
      } catch (error) {
        setStatus(String(error));
      }
    }
  );

document
  .querySelector<HTMLButtonElement>("#settings-menu")
  ?.addEventListener(
    "click",
    () => {
      if (!settingsPopover) {
        return;
      }

      settingsPopover.hidden =
        !settingsPopover.hidden;
    }
  );

requestInput?.addEventListener(
  "input",
  () => {
    if (!requestInput) {
      return;
    }

    requestInput.style.height =
      "auto";

    requestInput.style.height =
      Math.min(
        requestInput.scrollHeight,
        140
      ) + "px";
  }
);

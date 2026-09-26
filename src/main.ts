import "./ui.css";
import { buildSb3, downloadBlob } from "./sb3/builder";
import { loadScratchProjectFile } from "./scratch/local-project";
import {
  createScratchAsset,
  createScratchProject
} from "./scratch/project-factory";
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

const icons = {
  newChat: `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <path d="M4 8.5a2.5 2.5 0 0 1 2.5-2.5h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18.5 20H10l-5 4v-15.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <path d="m20 10 6-6 3 3-6 6-3.6.7.6-3.7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
</svg>`,
  file: `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <path d="M5 12h22v14H5z" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <path d="M16 3v12M11.5 7.5 16 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  preview: `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <rect x="4.5" y="6" width="23" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <path d="M11 26h10M16 21v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
</svg>`,
  settings: `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <path d="m16 4 2 2.5 3-.2.8 3 2.7 1.3-1 2.8 1.8 2.4-1.8 2.4 1 2.8-2.7 1.3-.8 3-3-.2L16 28l-2-2.4-3 .2-.8-3-2.7-1.3 1-2.8-1.8-2.4 1.8-2.4-1-2.8 2.7-1.3.8-3 3 .2L16 4Z" fill="currentColor"/>
  <circle cx="16" cy="16" r="5" fill="#fff"/>
</svg>`,
  send: `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="14" fill="#1677ff"/>
  <path d="m16 23V10M11.5 14.5 16 10l4.5 4.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
};

app.innerHTML = `
<div class="app">
  <aside class="sidebar">
    <div class="sidebar-brand">モデル名</div>

    <nav class="sidebar-nav" aria-label="メインメニュー">
      <button class="nav-item nav-item-active" type="button" data-screen="home">
        <span class="nav-icon">${icons.newChat}</span>
        <span class="nav-text">
          <span class="nav-title">新しいチャット</span>
          <span class="nav-subtitle">new chat</span>
        </span>
      </button>

      <button class="nav-item" type="button" data-screen="files">
        <span class="nav-icon">${icons.file}</span>
        <span class="nav-text">
          <span class="nav-title">ファイル</span>
          <span class="nav-subtitle">file</span>
        </span>
      </button>

      <button class="nav-item" type="button" data-screen="preview">
        <span class="nav-icon">${icons.preview}</span>
        <span class="nav-text">
          <span class="nav-title">プレビュー</span>
          <span class="nav-subtitle">preview</span>
        </span>
      </button>
    </nav>

    <button class="settings-button" id="settings-menu" type="button" aria-label="設定">
      ${icons.settings}
    </button>

    <input
      class="hidden-input"
      id="file-input"
      type="file"
      accept=".sb3,application/x.scratch.sb3,application/zip"
    >
  </aside>

  <main class="main">
    <section class="screen screen-home" id="screen-home">
      <div class="home-content">
        <div class="model-heading">
          <h1>モデル名</h1>
          <div>(バージョン)</div>
        </div>

        <form class="prompt-form" id="composer">
          <textarea
            class="prompt-input"
            id="request"
            rows="1"
            placeholder="作成したいプロジェクトのイメージは？"
            aria-label="Scratchプロジェクトの作成指示"
            spellcheck="false"
          ></textarea>

          <button class="prompt-send" type="submit" aria-label="生成">
            ${icons.send}
          </button>
        </form>

        <div class="home-status" id="status" aria-live="polite"></div>
      </div>
    </section>

    <section class="screen screen-files" id="screen-files" hidden>
      <div class="screen-content">
        <header class="screen-header">
          <div class="screen-heading">
            <h1>ファイル</h1>
            <p>generated files</p>
          </div>
          <button class="header-button" id="file-import" type="button">
            .sb3を取り込む
          </button>
        </header>

        <div class="screen-divider"></div>

        <div class="file-list" id="file-list"></div>
      </div>
    </section>

    <section class="screen screen-preview" id="screen-preview" hidden>
      <div class="screen-content">
        <header class="screen-header">
          <div class="screen-heading">
            <h1>プレビュー</h1>
            <p>preview</p>
          </div>
          <button class="header-button" id="preview-save" type="button">
            .sb3を保存
          </button>
        </header>

        <div class="screen-divider"></div>

        <div class="preview-area">
          <div class="preview-panel">
            <div class="preview-overlay" id="preview-overlay" hidden>
              <div class="preview-stage" id="preview-stage"></div>
            </div>
            <div class="preview-empty" id="preview-empty">
              <div class="preview-empty-title">プレビューするプロジェクトがありません</div>
              <div class="preview-empty-copy">新しいチャットで生成するか、ファイルからプロジェクトを読み込んでください。</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
`;

type ScratchLoaded =
  Awaited<ReturnType<typeof loadScratchProjectFile>>;

type GeneratedFile = {
  name: string;
  project: ScratchLoaded;
};

let loadedProject: ScratchLoaded | null = null;
let generatedProject:
  Awaited<ReturnType<typeof createScratchProject>> | null = null;
let generatedAssets:
  ReturnType<typeof createScratchAsset>[] = [];
let generatedFiles: GeneratedFile[] = [];
let activeScreen = "home";

const requestInput =
  document.querySelector<HTMLTextAreaElement>("#request");

const status =
  document.querySelector<HTMLDivElement>("#status");

const fileInput =
  document.querySelector<HTMLInputElement>("#file-input");

const fileList =
  document.querySelector<HTMLDivElement>("#file-list");

const previewOverlay =
  document.querySelector<HTMLDivElement>("#preview-overlay");

const previewStage =
  document.querySelector<HTMLDivElement>("#preview-stage");

const previewEmpty =
  document.querySelector<HTMLDivElement>("#preview-empty");

const settingsButton =
  document.querySelector<HTMLButtonElement>("#settings-menu");

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

function setStatus(
  message: string
): void {
  if (status) {
    status.textContent = message;
  }
}

function clearProjectState(): void {
  generatedProject = null;
  generatedAssets = [];
  loadedProject = null;
}

function setActiveNav(
  screen: string
): void {
  document
    .querySelectorAll<HTMLButtonElement>(".nav-item")
    .forEach((button) => {
      button.classList.toggle(
        "nav-item-active",
        button.dataset.screen === screen
      );
    });
}

function showScreen(
  screen: string
): void {
  if (
    activeScreen === "preview" &&
    screen !== "preview"
  ) {
    closeTurboWarpPreview();
  }

  document
    .querySelectorAll<HTMLElement>(".screen")
    .forEach((element) => {
      element.hidden =
        element.id !== "screen-" + screen;
    });

  activeScreen =
    screen;

  setActiveNav(
    screen
  );

  if (screen === "files") {
    renderFileManager();
  }

  if (screen === "preview") {
    renderPreviewState();
  }
}

function renderFileManager(): void {
  if (!fileList) {
    return;
  }

  if (generatedFiles.length === 0) {
    fileList.innerHTML = `
      <div class="file-empty">
        <div>
          <div class="file-empty-title">AI生成ファイルはありません</div>
          <div class="file-empty-copy">新しいチャットでプロジェクトを生成すると、ここに保存されます。</div>
        </div>
      </div>
    `;
    return;
  }

  fileList.innerHTML =
    generatedFiles
      .map(
        (file, index) => {
          const safeName =
            file.name
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;");

          return `
            <article class="file-row">
              <div class="file-badge">SB3</div>
              <div class="file-info">
                <div class="file-name">${safeName}</div>
                <div class="file-meta">Scratch 3 Project</div>
              </div>
              <div class="file-actions">
                <button class="file-action" data-file-preview="${index}" type="button">プレビュー</button>
                <button class="file-action" data-file-save="${index}" type="button">保存</button>
                <button class="file-action file-action-muted" data-file-delete="${index}" type="button">削除</button>
              </div>
            </article>
          `;
        }
      )
      .join("");
}

function renderPreviewState(): void {
  const project =
    getCurrentProject();

  const hasProject =
    Boolean(project);

  if (previewEmpty) {
    previewEmpty.hidden =
      hasProject;
  }

  if (previewOverlay) {
    previewOverlay.hidden =
      !hasProject;
  }

  if (previewStage) {
    previewStage.hidden =
      !hasProject;
  }

  if (hasProject) {
    void startTurboWarpPreview(
      project!
    );
  }
}

async function startTurboWarpPreview(
  project: ScratchLoaded
): Promise<void> {
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
    setStatus(
      String(error)
    );
  }
}

async function saveProject(
  project: ScratchLoaded,
  filename: string
): Promise<void> {
  const blob =
    await buildSb3(
      project
    );

  downloadBlob(
    blob,
    filename
  );
}

document
  .querySelectorAll<HTMLButtonElement>(".nav-item")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const screen =
          button.dataset.screen;

        if (!screen) {
          return;
        }

        if (screen === "home") {
          closeTurboWarpPreview();
          clearProjectState();

          if (requestInput) {
            requestInput.value = "";
            requestInput.style.height = "auto";
          }

          setStatus("");
        }

        showScreen(
          screen
        );
      }
    );
  });

fileList?.addEventListener(
  "click",
  async (event) => {
    const target =
      event.target as HTMLElement;

    const previewIndex =
      target.dataset.filePreview;

    const saveIndex =
      target.dataset.fileSave;

    const deleteIndex =
      target.dataset.fileDelete;

    if (previewIndex !== undefined) {
      const file =
        generatedFiles[Number(previewIndex)];

      if (!file) {
        return;
      }

      generatedProject = null;
      generatedAssets = [];
      loadedProject = file.project;

      showScreen(
        "preview"
      );

      return;
    }

    if (saveIndex !== undefined) {
      const file =
        generatedFiles[Number(saveIndex)];

      if (!file) {
        return;
      }

      try {
        await saveProject(
          file.project,
          file.name
        );

        setStatus(
          "ファイルを保存しました。"
        );
      } catch (error) {
        setStatus(
          String(error)
        );
      }

      return;
    }

    if (deleteIndex !== undefined) {
      generatedFiles.splice(
        Number(deleteIndex),
        1
      );

      renderFileManager();

      setStatus(
        "ファイルを削除しました。"
      );
    }
  }
);

document
  .querySelector<HTMLButtonElement>("#file-import")
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

    setStatus(
      "プロジェクトを読み込んでいます..."
    );

    try {
      loadedProject =
        await loadScratchProjectFile(
          file
        );

      generatedProject = null;
      generatedAssets = [];

      showScreen(
        "preview"
      );

      setStatus(
        "読み込み完了: " +
        file.name
      );
    } catch (error) {
      loadedProject = null;

      setStatus(
        String(error)
      );
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
        setStatus(
          "生成内容を入力してください。"
        );

        requestInput.focus();

        return;
      }

      setStatus(
        "生成計画を作成しています..."
      );

      try {
        const rawPlan =
          planScratchRequest(
            request
          );

        const plan =
          validateGenerationPlan(
            rawPlan
          );

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
              target.name ===
              plan.script.target
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

        generatedProject =
          project;

        generatedAssets =
          assets;

        loadedProject = null;

        const filename =
          "generated-" +
          new Date()
            .toISOString()
            .replace(/[^\d]/g, "")
            .slice(0, 14) +
          ".sb3";

        generatedFiles.unshift({
          name: filename,
          project: {
            id:
              "generated-" +
              Date.now(),
            metadata: {
              id: 0,
              title: filename
            },
            project,
            assets
          }
        });

        showScreen(
          "preview"
        );

        setStatus(
          "生成完了。TurboWarpでプレビューしています。"
        );
      } catch (error) {
        generatedProject = null;
        generatedAssets = [];

        setStatus(
          String(error)
        );
      }
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
        const filename =
          project.id === "generated"
            ? "generated-scratch-project.sb3"
            : "scratch-project-" +
              project.id +
              ".sb3";

        await saveProject(
          project,
          filename
        );

        setStatus(
          ".sb3を保存しました。"
        );
      } catch (error) {
        setStatus(
          String(error)
        );
      }
    }
  );

settingsButton?.addEventListener(
  "click",
  () => {
    setStatus(
      "設定画面は準備中です。"
    );
  }
);

requestInput?.addEventListener(
  "input",
  () => {
    requestInput.style.height =
      "auto";

    requestInput.style.height =
      Math.min(
        requestInput.scrollHeight,
        150
      ) + "px";
  }
);

setActiveNav("home");

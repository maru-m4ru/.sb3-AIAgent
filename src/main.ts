
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

const uiBase =
  import.meta.env.BASE_URL;

const uiAsset =
  uiBase + "ui/";

app.innerHTML = [
  '<div class="app-shell">',
  '  <aside class="sidebar">',
  '    <div class="model-name">モデル名</div>',
  '    <nav class="nav" aria-label="メインメニュー">',
  '      <button class="nav-button nav-button-active" id="new-chat" type="button" data-screen="home">',
  '        <span class="nav-icon"><img src="' + uiAsset + 'new-chat.svg" alt=""></span>',
  '        <span class="nav-copy"><span class="nav-title">新しいチャット</span><span class="nav-subtitle">new chat</span></span>',
  '      </button>',
  '      <button class="nav-button" id="file-menu" type="button" data-screen="files">',
  '        <span class="nav-icon nav-icon-file"><img src="' + uiAsset + 'file.svg" alt=""></span>',
  '        <span class="nav-copy"><span class="nav-title">ファイル</span><span class="nav-subtitle">file</span></span>',
  '      </button>',
  '      <button class="nav-button" id="preview-menu" type="button" data-screen="preview">',
  '        <span class="nav-icon nav-icon-preview"><img src="' + uiAsset + 'preview.svg" alt=""></span>',
  '        <span class="nav-copy"><span class="nav-title">プレビュー</span><span class="nav-subtitle">preview</span></span>',
  '      </button>',
  '    </nav>',
  '    <div class="sidebar-bottom">',
  '      <button class="settings-button" id="settings-menu" type="button" aria-label="設定">',
  '        <img src="' + uiAsset + 'settings.svg" alt="">',
  '      </button>',
  '    </div>',
  '    <input class="hidden-input" id="file-input" type="file" accept=".sb3,application/x.scratch.sb3,application/zip">',
  '  </aside>',
  '  <main class="workspace">',
  '    <section class="screen screen-home" id="screen-home">',
  '      <div class="home-reference">',
  '        <img class="home-reference-image" src="' + uiBase + 'ui/reference.svg" alt="">',
  '        <form class="reference-composer" id="composer">',
  '          <textarea class="reference-input" id="request" rows="1" aria-label="Scratchプロジェクトの作成指示" spellcheck="false"></textarea>',
  '          <button class="reference-send" type="submit" aria-label="生成">',
  '            <img src="' + uiAsset + 'send.svg" alt="">',
  '          </button>',
  '        </form>',
  '        <div class="reference-status" id="status">新しいプロジェクトを作成できます。</div>',
  '      </div>',
  '    </section>',
  '    <section class="screen screen-files" id="screen-files" hidden>',
  '      <div class="screen-header">',
  '        <div class="screen-heading">',
  '          <h1 class="screen-title">AI生成ファイル</h1>',
  '          <div class="screen-subtitle">generated files</div>',
  '        </div>',
  '        <button class="screen-primary" id="file-import" type="button">.sb3を取り込む</button>',
  '      </div>',
  '      <div class="section-rule"></div>',
  '      <div class="file-list" id="file-list"></div>',
  '    </section>',
  '    <section class="screen screen-preview" id="screen-preview" hidden>',
  '      <div class="screen-header">',
  '        <div class="screen-heading">',
  '          <h1 class="screen-title">プレビュー</h1>',
  '          <div class="screen-subtitle">TurboWarp</div>',
  '        </div>',
  '        <button class="screen-primary" id="preview-save" type="button">.sb3を保存</button>',
  '      </div>',
  '      <div class="section-rule"></div>',
  '      <div class="preview-workspace">',
  '        <div class="preview-card">',
  '          <div class="preview-stage" id="preview-stage"></div>',
  '          <div class="preview-empty" id="preview-empty">',
  '            <div class="preview-empty-title">プレビューするプロジェクトがありません</div>',
  '            <div class="preview-empty-copy">新しいチャットで生成するか、ファイルからプロジェクトを読み込んでください。</div>',
  '          </div>',
  '        </div>',
  '      </div>',
  '    </section>',
  '  </main>',
  '</div>'
].join("");

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
    .querySelectorAll<HTMLButtonElement>(
      ".nav-button"
    )
    .forEach((button) => {
      button.classList.toggle(
        "nav-button-active",
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

  activeScreen = screen;
  setActiveNav(screen);

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
    fileList.innerHTML =
      '<div class="file-empty"><div><div class="file-empty-title">AI生成ファイルはありません</div><div class="file-empty-copy">新しいチャットからプロジェクトを生成すると、ここに保存されます。</div></div></div>';
    return;
  }

  fileList.innerHTML =
    generatedFiles.map(
      (file, index) => {
        const safeName =
          file.name
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");

        return [
          '<article class="file-row">',
          '  <div class="file-type">SB3</div>',
          '  <div class="file-row-copy">',
          '    <div class="file-row-name">' + safeName + '</div>',
          '    <div class="file-row-meta">Scratch 3 Project</div>',
          '  </div>',
          '  <div class="file-row-actions">',
          '    <button class="file-action" data-file-preview="' + index + '" type="button">プレビュー</button>',
          '    <button class="file-action" data-file-save="' + index + '" type="button">保存</button>',
          '    <button class="file-action file-action-delete" data-file-delete="' + index + '" type="button">削除</button>',
          '  </div>',
          '</article>'
        ].join("");
      }
    ).join("");
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
  .querySelectorAll<HTMLButtonElement>(
    ".nav-button"
  )
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
            requestInput.style.height =
              "auto";
          }

          setStatus(
            "新しいプロジェクトを作成できます。"
          );
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

    if (
      previewIndex !== undefined
    ) {
      const file =
        generatedFiles[
          Number(previewIndex)
        ];

      if (!file) {
        return;
      }

      generatedProject = null;
      generatedAssets = [];
      loadedProject =
        file.project;

      showScreen(
        "preview"
      );

      return;
    }

    if (
      saveIndex !== undefined
    ) {
      const file =
        generatedFiles[
          Number(saveIndex)
        ];

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

    if (
      deleteIndex !== undefined
    ) {
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
  .querySelector<HTMLButtonElement>(
    "#file-import"
  )
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
  .querySelector<HTMLFormElement>(
    "#composer"
  )
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

        if (
          plan.verdict === "OPPOSE"
        ) {
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
  .querySelector<HTMLButtonElement>(
    "#preview-save"
  )
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
        140
      ) + "px";
  }
);

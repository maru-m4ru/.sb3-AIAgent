
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
  '    <div class="model-name">モデル名</div>',
  '    <nav class="nav" aria-label="メインメニュー">',
  '      <button class="nav-button nav-button-active" id="new-chat" type="button" data-screen="home">',
  '        <span class="nav-icon nav-icon-chat" aria-hidden="true">',
  '          <svg viewBox="10 96 27 23" preserveAspectRatio="xMinYMid meet">',
  '            <path d="M13.68424 115.38229V100.5955C13.68424 100.02601 14.37607 99.6933 15.46626 99.6933H28.55459C29.53334 99.6933 30.56212 100.545 30.56212 101.39479V115.18249C30.56212 116.04364 29.87519 116.57033 29.15405 116.57033H15.16653C14.24952 116.57033 13.68424 116.00297 13.68424 115.38229Z" fill="#ffffff" stroke="#000000" stroke-width="1"></path>',
  '            <path d="M21.47655 107.01545L31.70457 96.78743C31.70457 96.78743 33.28327 97.42656 33.843 97.98629C34.40984 98.55313 35.08457 100.16742 35.08457 100.16742L24.85653 110.39545L21.02137 110.80658Z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"></path>',
  '            <path d="M32.09955 102.5116C32.09955 102.5116 30.78793 101.88329 30.29308 101.38844C29.78471 100.88007 29.0888 99.50084 29.0888 99.50084" fill="none" stroke="#000000" stroke-width="1" stroke-linecap="round"></path>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">新しいチャット</span>',
  '          <span class="nav-subtitle">new chat</span>',
  '        </span>',
  '      </button>',
  '      <button class="nav-button" id="file-menu" type="button" data-screen="files">',
  '        <span class="nav-icon nav-icon-file" aria-hidden="true">',
  '          <svg viewBox="10 156 27 18" preserveAspectRatio="xMinYMid meet">',
  '            <path d="M13.21815 169.61688V158.70902H33.90658V169.61688Z" fill="#ffffff" stroke="#000000" stroke-width="1"></path>',
  '            <path d="M17.67967 166.49191V157.55582H29.44507V166.49191Z" fill="#ffffff"></path>',
  '            <text x="15.79717" y="162.94599" transform="scale(1.41187 1.29538)" font-size="11" fill="#000000">↕</text>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">ファイル</span>',
  '          <span class="nav-subtitle">file</span>',
  '        </span>',
  '      </button>',
  '      <button class="nav-button" id="preview-menu" type="button" data-screen="preview">',
  '        <span class="nav-icon nav-icon-preview" aria-hidden="true">',
  '          <svg viewBox="10 198 28 24" preserveAspectRatio="xMinYMid meet">',
  '            <path d="M13.6134 211.36846C13.6134 209.91607 13.6134 204.28334 13.6134 201.84533C13.6134 201.1471 14.13049 200.71099 15.0041 200.71099C19.23853 200.71099 31.84804 200.71099 34.54438 200.71099C35.53298 200.71099 36.47798 201.48818 36.47798 202.21611C36.47798 203.63809 36.47798 208.70108 36.47798 211.24454C36.47798 212.14157 35.80092 212.72524 35.03908 212.72524C32.59067 212.72524 19.35898 212.72524 15.00329 212.72524C14.12942 212.72524 13.6134 212.035 13.6134 211.36846Z" fill="#ffffff" stroke="#000000" stroke-width="1"></path>',
  '            <path d="M16.74588 220.31653C16.74588 220.31653 17.20685 216.40875 17.72942 216.40875C19.39021 216.40875 28.29608 216.40875 31.62541 216.40875C32.40786 216.40875 32.88232 220.31653 32.88232 220.31653Z" fill="#000000"></path>',
  '          </svg>',
  '        </span>',
  '        <span class="nav-copy">',
  '          <span class="nav-title">プレビュー</span>',
  '          <span class="nav-subtitle">preview</span>',
  '        </span>',
  '      </button>',
  '    </nav>',
  '    <div class="sidebar-bottom">',
  '      <button class="settings-button" id="settings-menu" type="button" aria-label="設定">',
  '        <svg viewBox="7 337 24 21" aria-hidden="true">',
  '          <g fill="#2e2e2e">',
  '            <path d="M12.00997 348.41456L8.18053 347.95369V346.25695L11.9362 345.58545H16.18286C15.9779 345.92102 15.8598 346.31541 15.8598 346.7374C15.8598 347.40787 16.15794 348.0087 16.5642 348.41456Z"></path>',
  '            <path d="M23.96094 348.41456H19.517C19.98794 348.0087 20.28598 347.40787 20.28598 346.7374C20.28598 346.31541 20.16788 345.92102 19.96292 345.58545H23.96084L27.81937 346.18319V347.80616Z"></path>',
  '            <path d="M16.58544 352.96094V348.37613C16.9784 348.73304 17.50027 348.95054 18.07293 348.95054C18.57734 348.95054 19.04234 348.78179 19.41455 348.49767V352.96093L18.81681 356.81947H17.19384Z"></path>',
  '            <path d="M16.58544 341.00998L17.04631 337.18053H18.74305L19.41455 340.9362V344.97712C19.04234 344.69299 18.57734 344.52425 18.07293 344.52425C17.50027 344.52425 16.9784 344.74175 16.58544 345.09866Z"></path>',
  '            <path d="M12.80705 350.26316L15.90176 347.16846C16.10233 348.1844 16.99847 348.95054 18.07365 348.95054C18.08977 348.95054 18.10584 348.95037 18.12187 348.95002L14.80824 352.26365L11.65718 354.56939L10.50956 353.42178Z"></path>',
  '            <path d="M21.25766 341.81256L24.29137 339.43062L25.49114 340.6304L23.3103 343.76088L20.28556 346.78562C20.28591 346.7696 20.28608 346.75352 20.28608 346.7374C20.28608 345.66262 19.51995 344.76648 18.50401 344.56592Z"></path>',
  '            <path d="M25.49114 353.42177L24.34352 354.56939L21.19246 352.26365L17.87019 348.94138C17.93696 348.94745 18.00459 348.95054 18.07294 348.95054C19.10535 348.95054 19.97265 348.24361 20.2172 347.28741L23.19295 350.26316Z"></path>',
  '            <path d="M12.6897 343.76088L10.50886 340.63039L11.70863 339.43062L14.74234 341.81256L17.52292 344.59314C16.56672 344.83768 15.8598 345.70498 15.8598 346.7374C15.8598 346.80575 15.86289 346.87339 15.86905 346.94016Z"></path>',
  '          </g>',
  '          <path d="M11.743 347C11.743 343.54666 14.39277 340.743 18 340.743C21.60724 340.743 24.257 343.38149 24.257 347C24.257 350.61851 21.61935 353.257 18 353.257C14.38065 353.257 11.743 350.45334 11.743 347Z M18.08239 349.20336C19.4631 349.20336 20.58239 348.08407 20.58239 346.70336C20.58239 345.32265 19.4631 344.20336 18.08239 344.20336C16.70168 344.20336 15.58239 345.32265 15.58239 346.70336C15.58239 348.08407 16.70168 349.20336 18.08239 349.20336Z" fill="#000000" fill-rule="evenodd"></path>',
  '        </svg>',
  '      </button>',
  '    </div>',
  '    <input class="hidden-input" id="file-input" type="file" accept=".sb3,application/x.scratch.sb3,application/zip">',
  '  </aside>',
  '  <main class="workspace">',
  '    <section class="screen screen-home" id="screen-home">',
  '      <div class="hero">',
  '        <div class="hero-copy">',
  '          <h1 class="hero-title">モデル名</h1>',
  '          <span class="hero-version">(バージョン)</span>',
  '        </div>',
  '      </div>',
  '      <section class="composer-area">',
  '        <form class="composer" id="composer">',
  '          <textarea class="composer-input" id="request" rows="1" placeholder="作成したいプロジェクトのイメージは？" aria-label="Scratchプロジェクトの作成指示"></textarea>',
  '          <button class="send-button" type="submit" aria-label="生成">',
  '            <svg viewBox="0 0 18 18" aria-hidden="true">',
  '              <circle cx="9" cy="9" r="7.634" fill="#006eff"></circle>',
  '              <path d="M9 12.2V5.6M6.55 8.05L9 5.6l2.45 2.45" fill="none" stroke="#ffffff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>',
  '            </svg>',
  '          </button>',
  '        </form>',
  '        <div class="status" id="status">新しいプロジェクトを作成できます。</div>',
  '      </section>',
  '    </section>',
  '    <section class="screen screen-files" id="screen-files" hidden>',
  '      <div class="screen-header">',
  '        <div>',
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
  '        <div>',
  '          <h1 class="screen-title">プレビュー</h1>',
  '          <div class="screen-subtitle">TurboWarp</div>',
  '        </div>',
  '        <button class="screen-primary" id="preview-save" type="button">.sb3を保存</button>',
  '      </div>',
  '      <div class="section-rule"></div>',
  '      <div class="preview-workspace">',
  '        <div class="preview-stage" id="preview-stage"></div>',
  '        <div class="preview-empty" id="preview-empty">',
  '          <div class="preview-empty-title">プレビューするプロジェクトがありません</div>',
  '          <div class="preview-empty-copy">新しいチャットで生成するか、ファイルからプロジェクトを読み込んでください。</div>',
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

function setActiveNav(screen: string): void {
  document
    .querySelectorAll<HTMLButtonElement>(".nav-button")
    .forEach((button) => {
      button.classList.toggle(
        "nav-button-active",
        button.dataset.screen === screen
      );
    });
}

function showScreen(screen: string): void {
  if (activeScreen === screen) {
    if (screen === "files") {
      renderFileManager();
    }

    if (screen === "preview") {
      renderPreviewState();
    }

    return;
  }

  if (activeScreen === "preview" && screen !== "preview") {
    closeTurboWarpPreview();
  }

  document
    .querySelectorAll<HTMLElement>(".screen")
    .forEach((element) => {
      element.hidden = element.id !== "screen-" + screen;
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
      '<div class="file-empty">AIが生成したファイルはまだありません。</div>';
    return;
  }

  fileList.innerHTML =
    generatedFiles.map((file, index) => {
      const safeName =
        file.name
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");

      return [
        '<div class="file-row">',
        '  <div class="file-row-icon">',
        '    <span>.sb3</span>',
        '  </div>',
        '  <div class="file-row-copy">',
        '    <div class="file-row-name">' + safeName + '</div>',
        '    <div class="file-row-meta">Scratch 3 Project</div>',
        '  </div>',
        '  <button class="file-action" data-file-preview="' + index + '" type="button">プレビュー</button>',
        '  <button class="file-action" data-file-save="' + index + '" type="button">保存</button>',
        '  <button class="file-action file-action-delete" data-file-delete="' + index + '" type="button">削除</button>',
        '</div>'
      ].join("");
    }).join("");
}

function renderPreviewState(): void {
  const project = getCurrentProject();
  const hasProject = Boolean(project);

  if (previewEmpty) {
    previewEmpty.hidden = hasProject;
  }

  if (previewStage) {
    previewStage.hidden = !hasProject;
  }

  if (hasProject) {
    void startTurboWarpPreview(project!);
  }
}

async function startTurboWarpPreview(
  project: ScratchLoaded
): Promise<void> {
  setStatus("TurboWarpプレビューを準備しています...");

  try {
    await openTurboWarpPreview(project);
    setStatus("TurboWarpプレビューを表示しています。");
  } catch (error) {
    setStatus(String(error));
  }
}

async function saveProject(
  project: ScratchLoaded,
  filename: string
): Promise<void> {
  const blob =
    await buildSb3(project);

  downloadBlob(
    blob,
    filename
  );
}

document
  .querySelectorAll<HTMLButtonElement>(".nav-button")
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

          setStatus("新しいプロジェクトを作成できます。");
        }

        showScreen(screen);
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

      showScreen("preview");
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

        setStatus("ファイルを保存しました。");
      } catch (error) {
        setStatus(String(error));
      }

      return;
    }

    if (deleteIndex !== undefined) {
      generatedFiles.splice(
        Number(deleteIndex),
        1
      );

      renderFileManager();
      setStatus("ファイルを削除しました。");
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

    setStatus("プロジェクトを読み込んでいます...");

    try {
      loadedProject =
        await loadScratchProjectFile(file);

      generatedProject = null;
      generatedAssets = [];

      showScreen("preview");
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
            id: "generated-" + Date.now(),
            metadata: {
              id: 0,
              title: filename
            },
            project,
            assets
          }
        });

        showScreen("preview");
        setStatus("生成完了。TurboWarpでプレビューしています。");
      } catch (error) {
        generatedProject = null;
        generatedAssets = [];
        setStatus(String(error));
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

        setStatus(".sb3を保存しました。");
      } catch (error) {
        setStatus(String(error));
      }
    }
  );

settingsButton?.addEventListener(
  "click",
  () => {
    setStatus("設定画面は準備中です。");
  }
);

requestInput?.addEventListener(
  "input",
  () => {
    requestInput.style.height = "auto";
    requestInput.style.height =
      Math.min(
        requestInput.scrollHeight,
        140
      ) + "px";
  }
);

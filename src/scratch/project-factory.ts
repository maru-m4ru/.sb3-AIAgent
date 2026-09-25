import type {
  ScratchProjectJson,
  ScratchTarget
} from "../core/types";

const ASSET_ID = "b3ed278df5520ee6b6d2ad0a13150c64";
const ASSET_NAME = `${ASSET_ID}.svg`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect x="4" y="4" width="72" height="72" rx="16" fill="#ffab19"/><circle cx="28" cy="32" r="5" fill="#222"/><circle cx="52" cy="32" r="5" fill="#222"/><path d="M24 50 Q40 62 56 50" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/></svg>`;

export function createScratchAsset(): {
  md5ext: string;
  bytes: Uint8Array;
} {
  return {
    md5ext: ASSET_NAME,
    bytes: new TextEncoder().encode(SVG)
  };
}

export function createScratchProject(): ScratchProjectJson {
  return {
    targets: [
      createStage(),
      createSprite()
    ],
    monitors: [],
    extensions: [],
    meta: {
      semver: "3.0.0",
      vm: "0.2.0",
      agent: "sb3-AIAgent"
    }
  };
}

function createStage(): ScratchTarget {
  return {
    isStage: true,
    name: "Stage",
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [
      {
        assetId: ASSET_ID,
        name: "backdrop1",
        bitmapResolution: 1,
        md5ext: ASSET_NAME,
        dataFormat: "svg",
        rotationCenterX: 40,
        rotationCenterY: 40
      }
    ],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: "on",
    textToSpeechLanguage: null
  };
}

function createSprite(): ScratchTarget {
  return {
    isStage: false,
    name: "Sprite1",
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [
      {
        assetId: ASSET_ID,
        name: "costume1",
        bitmapResolution: 1,
        md5ext: ASSET_NAME,
        dataFormat: "svg",
        rotationCenterX: 40,
        rotationCenterY: 40
      }
    ],
    sounds: [],
    volume: 100,
    layerOrder: 1,
    visible: true,
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: "all around"
  };
}

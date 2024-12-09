("use client");
import { EventType, eventWithTime } from "@rrweb/types";
import { useEffect, useRef } from "react";
import { ReplayPlugin } from "rrweb/typings/types";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import { flushOutlines, ReactScanInternals } from "react-scan";
import { signal } from "@preact/signals";

const previousOutlines = new Map();

class ReactScanReplayPlugin implements ReplayPlugin {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private replayer: any | null = null;

  handler(event: any, isSync: boolean, context: { replayer: any }) {
    if (!this.replayer) {
      this.replayer = context.replayer;
    }

    if (
      event.type === EventType.Plugin &&
      event.data.plugin === "react-scan-plugin"
    ) {
      const data = event.data.payload.data as any;

      console.log("data, did i fuck this up", data.data, Object.keys(data));
      const nodeId = data.payload.nodeId;
      const mirror = this.replayer.getMirror();
      const node = mirror.getNode(nodeId) as HTMLElement | null;

      if (!node) {
        return;
      }

      if (!this.canvas) {
        this.initCanvas(this.replayer.iframe);
      }

      ReactScanInternals.scheduledOutlines.push({
        domNode: node,
        rect: node.getBoundingClientRect(),
        renders: data.payload.outline.renders,
      });

      flushOutlines(this.ctx!, previousOutlines);
    }
  }

  private initCanvas(iframe: HTMLIFrameElement) {
    this.canvas = document.createElement("canvas");
    const iframeRect = iframe.getBoundingClientRect();
    const dpi = window.devicePixelRatio || 1;

    let wrapper = iframe.parentElement;
    if (wrapper) {
      wrapper.style.position = "relative";
    }

    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${iframeRect.width}px;
      height: ${iframeRect.height}px;
      pointer-events: none;
      z-index: 2147483647;
      background: transparent;
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
    `;

    this.canvas.width = iframeRect.width * dpi;
    this.canvas.height = iframeRect.height * dpi;

    iframe.parentElement?.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    if (this.ctx) {
      this.ctx.scale(dpi, dpi);
    }
  }
}

const setupMouseTail = (iframe: HTMLIFrameElement) => {
  const mouseTailCanvas = iframe.parentElement?.querySelector(
    ".replayer-mouse-tail"
  ) as HTMLCanvasElement;
  if (mouseTailCanvas) {
    const iframeRect = iframe.getBoundingClientRect();
    mouseTailCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${iframeRect.width}px;
      height: ${iframeRect.height}px;
      pointer-events: none;
      z-index: 2147483646;
      background: transparent;
    `;
  }
};

export const createReplayer = (
  events: Array<eventWithTime>,
  root: HTMLElement
): rrwebPlayer => {
  if (!ReactScanInternals.instrumentation) {
    ReactScanInternals.instrumentation = {
      fiberRoots: new Set(),
      isPaused: signal(false),
      onCommitFiberRoot: () => {},
    };
  }
  ReactScanInternals.instrumentation!.isPaused.value = false;

  const player = new rrwebPlayer({
    target: root,
    props: {
      events,
      plugins: [new ReactScanReplayPlugin()],
    },
  });

  return player;
};

export const Replay = ({ replay }: { replay: any }) => {
  const replayerDiv = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    createReplayer(replay, replayerDiv.current!);

    return () => {
      replayerDiv.current?.replaceChildren();
    };
  }, []);
  return (
    <div className="min-h-screen w-full bg-zinc-950 p-8">
      <div className="mx-auto max-w-6xl">
        {/* <div className="mb-4 flex items-center gap-4">
          <button
            onClick={async () => {
              replayerDiv.current?.replaceChildren();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Start Replay (
            {(
              (new Date(replay.at(-1)?.timestamp!).getTime() -
                new Date(replay.at(0)?.timestamp!).getTime()) /
              1000
            ).toFixed(1)}
            s)
          </button>
        </div> */}

        <div
          ref={replayerDiv}
          className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
        />
      </div>

      <style>{`
        /* Override rrweb-player styles */
        .rr-player {
          width: 100% !important;
          background: transparent !important;
          border: none !important;
          aspect-ratio: 16/9;
          max-height: 80vh;
        }

        .rr-player__frame {
          border-radius: 0.5rem !important;
        }

        .rr-controller {
          background: rgb(15 15 17) !important;
          border-top: 1px solid rgb(39 39 42) !important;
          padding: 12px !important;
        }

        .rr-timeline {
          height: 24px !important;
          margin: 0 12px !important;
        }

        /* Add styling for timeline time indicators */
        .rr-timeline__time {
          color: rgb(161 161 170) !important;
          font-size: 11px !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          opacity: 0.8 !important;
        }

        .rr-timeline__time:hover {
          color: rgb(212 212 216) !important;
          opacity: 1 !important;
        }

        .rr-timeline__pointer {
          background: rgb(99 102 241) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2) !important;
        }

        .rr-progress__offset {
          background: rgba(99, 102, 241, 0.4) !important;
        }

        .rr-controller__btns {
          padding: 0 8px !important;
        }

        .rr-controller__btns button {
          color: rgb(212 212 216) !important;
          opacity: 1 !important;
          transition: all 150ms ease-in-out !important;
        }

        .rr-controller__btns button:hover {
          color: white !important;
          transform: scale(1.1) !important;
        }

        .rr-controller__btns button:active {
          transform: scale(0.95) !important;
        }

        .rr-controller__timer {
          color: rgb(212 212 216) !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }

        /* Speed controls */
        .rr-controller__speed {
          color: rgb(212 212 216) !important;
        }

        .rr-controller__speed-menu {
          background: rgb(24 24 27) !important;
          border: 1px solid rgb(39 39 42) !important;
          border-radius: 6px !important;
        }

        .rr-controller__speed-option {
          color: rgb(212 212 216) !important;
        }

        .rr-controller__speed-option:hover {
          background: rgb(39 39 42) !important;
        }

        .rr-controller__speed-option.active {
          color: rgb(99 102 241) !important;
          background: rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

interface RenderInfo {
  type: string;
  count: number;
  trigger: boolean;
  name: string;
  time: number;
  forget: boolean;
  changes: any[];
}

interface Outline {
  rect: null;
  renders: RenderInfo[];
}

interface ReactScanPayload {
  nodeId: number;
  outline: Outline;
}

interface ReactScanData {
  tag: string;
  plugin: string;
  payload: ReactScanPayload;
}

interface PluginData {
  plugin: string;
  payload: {
    data: ReactScanData;
  };
}

export interface ReactScanEvent {
  type: number;
  data: PluginData;
  timestamp: number;
}

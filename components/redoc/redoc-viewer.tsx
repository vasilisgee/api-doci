"use client";

import { useEffect, useRef } from "react";

const REDOC_BUNDLE_URL = "/redoc.standalone.js";

const specUrl = process.env.NEXT_PUBLIC_OPENAPI_URL || "/api/spec";

type RedocInit = {
  init: (
    specOrSpecUrl: string | Record<string, unknown>,
    options: unknown,
    element: HTMLElement
  ) => void;
};

declare global {
  interface Window {
    Redoc?: RedocInit;
    __API_DOCI_REDOC_LOADER__?: Promise<void>;
  }
}

const redocOptions = {
  disableSearch: false,
  hideDownloadButton: true,
  jsonSamplesExpandLevel: 1,
  generatedPayloadSamplesMaxDepth: 2,
  generatedSamplesMaxDepth: 2,
  nativeScrollbars: true,
  pathInMiddlePanel: false,
  requiredPropsFirst: true,
  sortPropsAlphabetically: false,
  theme: {
    colors: {
      primary: {
        main: "#141c2d"
      },
      text: {
        primary: "#1F2D18",
        secondary: "#4A6540"
      },
      border: {
        dark: "#E8E8E8",
        light: "#F2F2F2"
      },
      success: {
        main: "#6EBE45"
      },
      http: {
        get: "#6EBE45",
        post: "#2F80ED",
        put: "#F59E0B",
        options: "#14B8A6",
        patch: "#8B5CF6",
        delete: "#DC2626",
        basic: "#475569",
        link: "#0EA5E9",
        head: "#64748B"
      }
    },
    sidebar: {
      backgroundColor: "#111827",
      textColor: "#CBD5E1",
      activeTextColor: "#6EBE45",
      groupItems: {
        activeBackgroundColor: "#1F2937",
        activeTextColor: "#6EBE45"
      },
      level1Items: {
        activeBackgroundColor: "#1F2937",
        activeTextColor: "#6EBE45"
      },
      width: "320px"
    },
    rightPanel: {
      backgroundColor: "#1F2937",
      textColor: "#E5E7EB"
    },
    typography: {
      fontSize: "14px",
      lineHeight: "1.5em",
      fontFamily: "Inter, sans-serif",
      fontWeightRegular: "400",
      fontWeightBold: "700",
      headings: {
        fontFamily: "Inter, sans-serif",
        fontWeight: "700"
      },
      links: {
        color: "#6EBE45",
        visited: "#5AA737"
      }
    },
    spacing: {
      unit: 8,
      sectionHorizontal: 32,
      sectionVertical: 24
    },
    schema: {
      linesColor: "#E8E8E8",
      typeNameColor: "#808080",
      typeTitleColor: "#111827"
    },
    codeBlock: {
      backgroundColor: "#111827"
    }
  }
};

function ensureRedocBundleLoaded(): Promise<void> {
  if (window.Redoc) {
    return Promise.resolve();
  }

  if (!window.__API_DOCI_REDOC_LOADER__) {
    window.__API_DOCI_REDOC_LOADER__ = new Promise<void>(
      (resolve, reject) => {
        const existingScript = document.querySelector(
          "script[data-redoc-bundle='api-doci']"
        ) as HTMLScriptElement | null;

        if (existingScript) {
          if (window.Redoc) {
            resolve();
            return;
          }

          existingScript.addEventListener("load", () => resolve(), {
            once: true
          });
          existingScript.addEventListener(
            "error",
            () => reject(new Error("Failed to load ReDoc bundle.")),
            { once: true }
          );
          return;
        }

        const script = document.createElement("script");
        script.src = REDOC_BUNDLE_URL;
        script.async = true;
        script.dataset.redocBundle = "api-doci";
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener(
          "error",
          () => {
            window.__API_DOCI_REDOC_LOADER__ = undefined;
            reject(new Error("Failed to load ReDoc bundle."));
          },
          { once: true }
        );
        document.body.appendChild(script);
      }
    );
  }

  return window.__API_DOCI_REDOC_LOADER__;
}

export function RedocViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    const mountRedoc = async () => {
      await ensureRedocBundleLoaded();

      if (isUnmounted || !containerRef.current || !window.Redoc) {
        return;
      }

      containerRef.current.innerHTML = "";
      window.Redoc.init(specUrl, redocOptions, containerRef.current);
    };

    void mountRedoc();

    return () => {
      isUnmounted = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return <div id="redoc-container" ref={containerRef} />;
}

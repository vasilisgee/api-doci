"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

type EmotionRegistry = {
  cache: ReturnType<typeof createCache>;
  flush: () => string[];
};

function createEmotionRegistry(): EmotionRegistry {
  const cache = createCache({ key: "chakra" });
  cache.compat = true;

  const insert = cache.insert;
  let insertedNames: string[] = [];

  cache.insert = (...args: Parameters<typeof insert>) => {
    const serialized = args[1];
    if (cache.inserted[serialized.name] === undefined) {
      insertedNames.push(serialized.name);
    }

    return insert(...args);
  };

  return {
    cache,
    flush() {
      const names = insertedNames;
      insertedNames = [];
      return names;
    }
  };
}

type EmotionCacheProviderProps = {
  children: React.ReactNode;
};

export function EmotionCacheProvider({ children }: EmotionCacheProviderProps) {
  const [registry] = useState(() => createEmotionRegistry());

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) {
      return null;
    }

    let styles = "";
    for (const name of names) {
      const style = registry.cache.inserted[name];
      if (typeof style === "string") {
        styles += style;
      }
    }

    return (
      <style
        data-emotion={`${registry.cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}

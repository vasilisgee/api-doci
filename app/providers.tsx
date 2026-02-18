"use client";

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig
} from "@chakra-ui/react";
import { AppToaster } from "@/components/ui/toaster";
import { EmotionCacheProvider } from "@/app/emotion-cache-provider";

type ProvidersProps = {
  children: React.ReactNode;
};

const chakraSystem = createSystem(
  defaultConfig,
  defineConfig({
    preflight: false
  })
);

export function Providers({ children }: ProvidersProps) {
  return (
    <EmotionCacheProvider>
      <ChakraProvider value={chakraSystem}>
        {children}
        <AppToaster />
      </ChakraProvider>
    </EmotionCacheProvider>
  );
}

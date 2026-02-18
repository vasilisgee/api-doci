"use client";

import {
  CloseButton,
  HStack,
  Icon,
  Portal,
  Spinner,
  Stack,
  Toast,
  Toaster,
  createToaster
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top",
  max: 4,
  overlap: false
});

function ErrorToastIcon() {
  return (
    <Icon
      as="svg"
      boxSize="4.5"
      viewBox="0 0 24 24"
      color="#FCA5A5"
      flexShrink={0}
      mt="0.5"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 7.5v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
    </Icon>
  );
}

function LogoutToastIcon() {
  return (
    <Icon
      as="svg"
      boxSize="4.5"
      viewBox="0 0 24 24"
      color="#FCA5A5"
      flexShrink={0}
      mt="0.5"
      fill="none"
    >
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function AppToaster() {
  return (
    <Portal>
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root
            width={{ base: "calc(100vw - 2rem)", md: "22rem" }}
            px="4"
            py="3"
            border="1px solid var(--app-border)"
            borderRadius="18px"
            bg="linear-gradient(180deg, rgba(17, 24, 39, 0.97) 0%, rgba(9, 14, 24, 0.97) 100%)"
            color="var(--app-text)"
            boxShadow="0 20px 70px rgba(2, 8, 23, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
            backdropFilter="blur(8px)"
          >
            <HStack gap="3" align="flex-start" flex="1" minW="0">
              {toast.type === "error" ? (
                toast.meta?.icon === "logout" ? (
                  <LogoutToastIcon />
                ) : (
                  <ErrorToastIcon />
                )
              ) : null}
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description color="var(--app-muted)">
                    {toast.description}
                  </Toast.Description>
                )}
              </Stack>
            </HStack>
            {toast.type === "loading" ? (
              <Spinner size="sm" mt="1" />
            ) : (
              <Toast.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  alignSelf="flex-start"
                  bg="transparent"
                  color="var(--app-muted)"
                  borderRadius="md"
                  _hover={{ bg: "whiteAlpha.200", color: "var(--app-text)" }}
                  _active={{ bg: "whiteAlpha.300" }}
                  _focusVisible={{ boxShadow: "none" }}
                />
              </Toast.CloseTrigger>
            )}
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}

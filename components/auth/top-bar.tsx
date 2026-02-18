"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Menu,
  Portal,
  Text
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

type TopBarUser = {
  name: string;
  email: string;
};

type TopBarProps = {
  user: TopBarUser;
};

function LogoutIcon() {
  return (
    <Icon
      as="svg"
      boxSize="4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user.name.trim();
  const displayIdentity = displayName || user.email;
  const normalizedName = displayName.toLowerCase();
  const normalizedEmail = user.email.trim().toLowerCase();
  const shouldShowDisplayName = Boolean(displayName) && normalizedName !== normalizedEmail;

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
      toaster.create({
        type: "error",
        title: "Logout failed",
        description: "Please try again."
      });
    }
  };

  return (
    <Flex
      as="header"
      className="app-topbar"
      align="center"
      justify="space-between"
      pl={{ base: "6", md: "8" }}
      pr={{ base: "1", md: "2" }}
      gap="4"
    >
      <HStack gap="3" minW="0">
        <Image
          src="/portal-logo.png"
          alt="Project House logo"
          // h="100%"
          // w="36px"
          maxW="130px"
          borderRadius="md"
        />
      </HStack>

      <Menu.Root
        lazyMount={false}
        unmountOnExit={false}
        positioning={{ placement: "bottom-end", gutter: 8 }}
      >
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            px="2"
            h="auto"
            minH="40px"
            color="gray.100"
            _hover={{ bg: "#1E293B" }}
            _active={{ bg: "#334155" }}
            _expanded={{ bg: "#1E293B" }}
          >
            <HStack gap="3">
              <Image
                src="/default-avatar.svg"
                alt={user.name}
                w="30px"
                h="30px"
                borderRadius="full"
                display="block"
                boxShadow="none"
                outline="none"
              />
              <Text
                color="gray.200"
                fontSize="sm"
                lineHeight="1.2"
                fontWeight="500"
                display={{ base: "none", md: "block" }}
              >
                {displayIdentity}
              </Text>
            </HStack>
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              minW="240px"
              bg="#111827"
              borderColor="#334155"
              borderRadius="12px"
              boxShadow="lg"
              color="gray.100"
              p="0"
              overflow="hidden"
            >
              <Box px="3" py="2.5" borderBottom="1px solid #334155">
                <Text color="gray.400" fontSize="xs" mb="1">
                  Signed in as:
                </Text>
                {shouldShowDisplayName ? (
                  <Text
                    color="gray.100"
                    fontSize="sm"
                    fontWeight="600"
                    lineHeight="1.1"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    mb="0"
                  >
                    {displayName}
                  </Text>
                ) : null}
                <Text
                  color="gray.400"
                  fontSize="sm"
                  fontWeight="500"
                  lineHeight="1.1"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  mt="1"
                >
                  {user.email}
                </Text>
              </Box>
              <Menu.Item
                value="logout"
                px="3"
                py="2.5"
                h="10"
                rounded="none"
                color="#FCA5A5"
                disabled={isLoggingOut}
                cursor={isLoggingOut ? "not-allowed" : "pointer"}
                _highlighted={{
                  bg: "rgba(252, 165, 165, 0.16)",
                  color: "#FECACA"
                }}
                onSelect={() => {
                  void handleLogout();
                }}
              >
                <HStack gap="2">
                  <LogoutIcon />
                  <Menu.ItemText>
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Menu.ItemText>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Field,
  Flex,
  Image,
  Input,
  Link,
  Text,
  VStack
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

type LoginFormValues = {
  username: string;
  password: string;
  website: string;
};

type LoginFormProps = {
  minSubmitMs: number;
};

type LoginResponse = {
  ok?: boolean;
  message?: string;
};

export function LoginForm({ minSubmitMs }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timingReady, setTimingReady] = useState(false);
  const reasonToastShownRef = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
      website: ""
    }
  });

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setTimingReady(true);
    }, minSubmitMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [minSubmitMs]);

  useEffect(() => {
    if (reasonToastShownRef.current) {
      return;
    }

    const reason = searchParams.get("reason");
    if (!reason) {
      return;
    }

    reasonToastShownRef.current = true;
    const toastPayload =
      reason === "inactive" || reason === "expired"
        ? {
            type: "error" as const,
            title: "Session expired",
            description: "Please sign in again.",
            duration: Infinity,
            meta: {
              icon: "logout"
            }
          }
        : reason === "unauthorized"
          ? {
              type: "error" as const,
              title: "Authentication required",
              description: "Please sign in to continue."
            }
          : null;

    if (!toastPayload) {
      return;
    }

    const timerId = window.setTimeout(() => {
      toaster.create(toastPayload);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [searchParams]);

  const onSubmit = handleSubmit(async (values) => {
    const username = values.username.trim();
    const password = values.password;

    // Client-side bot check #1: honeypot must stay empty.
    if (values.website.trim()) {
      toaster.create({
        type: "error",
        title: "Login failed",
        description: "Unable to validate login request."
      });
      return;
    }

    // Client-side bot check #2: submission must not happen too quickly.
    if (!timingReady) {
      const waitSeconds = Math.max(1, Math.ceil(minSubmitMs / 1000));
      toaster.create({
        title: "Please wait a moment",
        description: `Submit again in ${waitSeconds} second(s).`
      });
      return;
    }

    if (!navigator.onLine) {
      toaster.create({
        type: "error",
        title: "You are offline",
        description: "Check your internet connection and try again."
      });
      return;
    }

    try {
      // Step 3: server route performs the real auth flow and creates secure cookie.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify({ username, password })
      });

      const data = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toaster.create({
            type: "error",
            title: "Login failed",
            description: "Invalid username or password."
          });
          return;
        }

        if (response.status === 429) {
          toaster.create({
            type: "error",
            title: "Too many attempts",
            description: "Please wait a bit before trying again."
          });
          return;
        }

        if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          toaster.create({
            type: "error",
            title: "Auth service unavailable",
            description: "Please try again in a moment."
          });
          return;
        }

        if (response.status >= 500) {
          toaster.create({
            type: "error",
            title: "Login temporarily unavailable",
            description: "Please try again shortly."
          });
          return;
        }

        toaster.create({
          type: "error",
          title: "Login failed",
          description: data?.message ?? "Unable to authenticate."
        });
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      toaster.create({
        type: "error",
        title: "Network error",
        description: "Could not reach authentication service."
      });
    }
  });

  return (
    <Flex className="login-screen" align="center" justify="center">
      <Box className="login-card" p={{ base: "7", md: "9" }}>
        <VStack gap="6" align="stretch">
          <Flex justify="left">
            <Image
              src="/portal-logo.png"
              alt="Project House logo"
              // width="56px"
              // height="56px"
              maxW="180px"
              borderRadius="md"
            />
          </Flex>

          <form onSubmit={onSubmit} noValidate>
            <input
              className="login-honeypot"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              {...register("website")}
            />

            <VStack gap="4" align="stretch">
              <Field.Root invalid={Boolean(errors.username)}>
                <Field.Label color="gray.300">Username</Field.Label>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="name@example.com"
                  bg="#0B1220"
                  borderColor="#34465F"
                  color="gray.100"
                  _placeholder={{ color: "gray.500" }}
                  {...register("username", {
                    required: "Username is required."
                  })}
                />
                <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={Boolean(errors.password)}>
                <Field.Label color="gray.300">Password</Field.Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  bg="#0B1220"
                  borderColor="#34465F"
                  color="gray.100"
                  _placeholder={{ color: "gray.500" }}
                  {...register("password", {
                    required: "Password is required."
                  })}
                />
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                loading={isSubmitting}
                cursor="pointer"
                bg="#7ED957"
                color="#111827"
                _hover={{ bg: "#93EA68" }}
                _active={{ bg: "#6FCB49" }}
                mt="2"
              >
                Sign in
              </Button>
            </VStack>
          </form>
          <Flex justify="center" mt="1">
            <Link
              href="https://github.com/vasilisgee/api-doci"
              target="_blank"
              rel="noopener noreferrer"
              display="inline-flex"
              alignItems="center"
              gap="2"
              fontSize="xs"
              color="white"
              _hover={{ color: "gray.200", textDecoration: "none" }}
            >
              <Image
                src="/github-mark-white.svg"
                alt=""
                aria-hidden="true"
                boxSize="16px"
                display="block"
                flexShrink={0}
              />
              <Text as="span">View project on GitHub</Text>
            </Link>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
}

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { ScreenEntry } from "../../state/useShell";

interface ScreenProps {
  entries: ScreenEntry[];
  children: React.ReactNode;
}

const variantColor: Record<string, string> = {
  out: "lb.consoleText",
  err: "lb.no",
  sys: "#6f8493",
  good: "lb.ok",
  warn: "lb.warn",
};

export default function Screen({ entries, children }: ScreenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <Box
      ref={ref}
      flex="1 1 auto"
      overflowY="auto"
      px="1.1rem"
      pt="0.9rem"
      pb="1.4rem"
      fontFamily="mono"
      fontSize="0.83rem"
      lineHeight="1.55"
      color="lb.consoleText"
      whiteSpace="pre-wrap"
      sx={{ wordBreak: "break-word" }}
      cursor="text"
    >
      {entries.map((e) =>
        e.kind === "input" ? (
          <Box key={e.id}>
            <Text as="span" color="lb.prompt">
              labex@sandbox
            </Text>
            :<Text as="span" color="#9ad3a6">{e.promptPath}</Text>
            {"$ "}
            {e.command}
          </Box>
        ) : (
          <Box key={e.id} color={variantColor[e.variant] || "lb.consoleText"} fontStyle={e.variant === "sys" ? "italic" : undefined} fontFamily={e.variant === "sys" ? "serif" : undefined} fontSize={e.variant === "sys" ? "0.86rem" : undefined}>
            {e.text}
          </Box>
        )
      )}
      {children}
    </Box>
  );
}

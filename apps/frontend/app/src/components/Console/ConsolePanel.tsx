import { Box, Text } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import Screen from "./Screen";
import InputLine, { type InputLineHandle } from "./InputLine";
import type { UseShellApi } from "../../state/useShell";

interface ConsolePanelProps {
  shellApi: UseShellApi;
  conTitle: string;
  onSubmit: (value: string) => void;
  onHelp: () => void;
}

const ConsolePanel = forwardRef<InputLineHandle, ConsolePanelProps>(function ConsolePanel({ shellApi, conTitle, onSubmit, onHelp }, ref) {
  const inputRef = useRef<InputLineHandle>(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (v: string) => inputRef.current?.setValue(v),
  }));

  return (
    <Box
      as="section"
      flex="1 1 auto"
      display="flex"
      flexDirection="column"
      minW={0}
      bg="lb.console"
      onClick={() => {
        const sel = window.getSelection()?.toString();
        if (!sel) inputRef.current?.focus();
      }}
    >
      <Box flex="0 0 auto" display="flex" alignItems="center" gap="0.5rem" px="0.9rem" py="0.45rem" bg="lb.console2" borderBottom="1px solid #223039">
        <Box w="0.62rem" h="0.62rem" borderRadius="full" bg="#2f414d" />
        <Box w="0.62rem" h="0.62rem" borderRadius="full" bg="#2f414d" />
        <Box w="0.62rem" h="0.62rem" borderRadius="full" bg="#2f414d" />
        <Text fontFamily="mono" fontSize="0.72rem" color="#7e909d" ml="0.4rem">
          {conTitle}
        </Text>
        <Text as="button" onClick={onHelp} ml="auto" fontFamily="mono" fontSize="0.7rem" color="#7e909d" _hover={{ color: "lb.prompt" }}>
          type `help` for commands
        </Text>
      </Box>
      <Screen entries={shellApi.entries}>
        <InputLine
          ref={inputRef}
          promptPath={shellApi.promptPath()}
          isHeredoc={shellApi.isHeredoc()}
          onSubmit={onSubmit}
          onHistoryUp={shellApi.historyUp}
          onHistoryDown={shellApi.historyDown}
          onComplete={shellApi.complete}
          onListMatches={(_value, matches) => {
            shellApi.pushLine(matches.join("  "));
          }}
          onClear={shellApi.clearScreen}
          onCtrlC={() => {
            shellApi.cancelHeredoc();
          }}
        />
      </Screen>
    </Box>
  );
});

export default ConsolePanel;

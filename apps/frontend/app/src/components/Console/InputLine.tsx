import { Box, Input, Text } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface InputLineHandle {
  focus: () => void;
  setValue: (v: string) => void;
}

interface InputLineProps {
  promptPath: string;
  isHeredoc: boolean;
  onSubmit: (value: string) => void;
  onHistoryUp: (current: string) => string;
  onHistoryDown: () => string;
  onComplete: (current: string) => { value: string; matches: string[] };
  onListMatches: (value: string, matches: string[]) => void;
  onClear: () => void;
  onCtrlC: (current: string) => void;
}

const InputLine = forwardRef<InputLineHandle, InputLineProps>(function InputLine(
  { promptPath, isHeredoc, onSubmit, onHistoryUp, onHistoryDown, onComplete, onListMatches, onClear, onCtrlC },
  ref
) {
  const [value, setValue] = useState("");
  const inputElRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputElRef.current?.focus(),
    setValue: (v: string) => {
      setValue(v);
      inputElRef.current?.focus();
    },
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setValue(onHistoryUp(value));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setValue(onHistoryDown());
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const { value: next, matches } = onComplete(value);
      if (matches.length) onListMatches(value, matches);
      else setValue(next);
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      onClear();
      return;
    }
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      onCtrlC(value);
      setValue("");
    }
  };

  return (
    <Box display="flex" alignItems="baseline" fontFamily="mono" fontSize="0.83rem">
      <Text as="span" flex="0 0 auto">
        {isHeredoc ? (
          "> "
        ) : (
          <>
            <Text as="span" color="lb.prompt">
              labex@sandbox
            </Text>
            :<Text as="span" color="#9ad3a6">{promptPath}</Text>
            {"$ "}
          </>
        )}
      </Text>
      <Input
        ref={inputElRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="unstyled"
        flex="1"
        color="#e8f1f7"
        fontFamily="mono"
        fontSize="0.83rem"
        pl="0.5ch"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="terminal input"
      />
    </Box>
  );
});

export default InputLine;

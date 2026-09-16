import { Box, Button, Text } from "@chakra-ui/react";
import type { LabCommand } from "../../data/types";

interface CommandChipProps {
  cmd: LabCommand;
  onRun: (cmd: string) => void;
}

export default function CommandChip({ cmd, onRun }: CommandChipProps) {
  return (
    <Button
      onClick={() => onRun(cmd.cmd)}
      variant="unstyled"
      display="flex"
      alignItems="baseline"
      gap="0.7rem"
      w="100%"
      textAlign="left"
      fontFamily="mono"
      fontSize="0.8rem"
      fontWeight="normal"
      h="auto"
      px="0.5rem"
      py="0.32rem"
      pl="0.7rem"
      color="#1a2027"
      borderRadius="0 3px 3px 0"
      _hover={{ bg: "lb.tealSoft" }}
      role="group"
    >
      <Text as="span" fontWeight={600} whiteSpace="pre">
        {cmd.cmd}
      </Text>
      {cmd.note && (
        <Text as="span" fontFamily="serif" fontSize="0.82rem" fontStyle="italic" color="#6d7a85">
          {cmd.note}
        </Text>
      )}
      <Box
        as="span"
        ml="auto"
        fontSize="0.62rem"
        color="lb.teal"
        opacity={0}
        pl="0.6rem"
        _groupHover={{ opacity: 1 }}
      >
        run
      </Box>
    </Button>
  );
}

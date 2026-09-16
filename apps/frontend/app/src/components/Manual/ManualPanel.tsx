import { Box, Heading } from "@chakra-ui/react";
import type { Lab } from "../../data/types";
import LessonBody from "./LessonBody";
import TaskList from "./TaskList";
import ActionBar from "./ActionBar";

interface ManualPanelProps {
  lab: Lab;
  taskDone: boolean[];
  isLastLab: boolean;
  onRunCommand: (cmd: string) => void;
  onCheck: () => void;
  onHint: () => void;
  onSolution: () => void;
  onReset: () => void;
  onNext: () => void;
}

export default function ManualPanel({ lab, taskDone, isLastLab, onRunCommand, onCheck, onHint, onSolution, onReset, onNext }: ManualPanelProps) {
  return (
    <Box
      as="section"
      flex={{ base: "0 0 auto", md: "0 0 44%" }}
      maxW={{ base: "none", md: "640px" }}
      maxH={{ base: "47%", md: "none" }}
      bg="lb.manual"
      borderRight={{ base: "none", md: "1px solid" }}
      borderBottom={{ base: "1px solid", md: "none" }}
      borderColor="lb.manualEdge"
      display="flex"
      flexDirection="column"
      minH={0}
    >
      <Box overflowY="auto" px={{ base: "1.1rem", md: "1.9rem" }} pt={{ base: "1rem", md: "1.6rem" }} pb="1.2rem" flex="1 1 auto" sx={{ scrollbarWidth: "thin" }}>
        <LessonBody lab={lab} onRunCommand={onRunCommand} />
      </Box>
      <Box borderTop="1px solid" borderColor="lb.manualEdge" bg="#eff2f4" px={{ base: "1.1rem", md: "1.9rem" }} pt={{ base: "0.7rem", md: "0.9rem" }} flex="0 0 auto" maxH={{ base: "none", md: "44%" }} overflowY="auto">
        <Heading as="h2" fontSize="0.8rem" fontWeight={600} color="lb.inkSoft" mb="0.5rem">
          Tasks — these tick themselves as you go
        </Heading>
        <TaskList lab={lab} taskDone={taskDone} />
        <ActionBar onCheck={onCheck} onHint={onHint} onSolution={onSolution} onReset={onReset} onNext={onNext} nextDisabled={isLastLab} />
      </Box>
    </Box>
  );
}

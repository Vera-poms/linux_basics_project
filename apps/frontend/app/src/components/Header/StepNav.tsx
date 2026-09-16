import { Button, HStack, Wrap } from "@chakra-ui/react";
import type { Lab } from "../../data/types";

interface StepNavProps {
  labs: Lab[];
  currentIndex: number;
  doneIds: Record<number, boolean>;
  onSelect: (index: number) => void;
}

export default function StepNav({ labs, currentIndex, doneIds, onSelect }: StepNavProps) {
  return (
    <Wrap ml="auto" spacing="0.3rem" as={HStack}>
      {labs.map((lab, i) => {
        const isCurrent = i === currentIndex;
        const isDone = !!doneIds[lab.id];
        return (
          <Button
            key={lab.id}
            aria-label={`Lab ${lab.id}: ${lab.title}`}
            title={lab.title}
            onClick={() => onSelect(i)}
            size="sm"
            w="1.9rem"
            h="1.9rem"
            minW="1.9rem"
            borderRadius="full"
            fontFamily="mono"
            fontSize="0.72rem"
            fontWeight={isCurrent ? 700 : 400}
            border="1px solid"
            borderColor={isDone ? "lb.ok" : isCurrent ? "lb.prompt" : "#2c3d49"}
            bg={isCurrent ? (isDone ? "lb.ok" : "lb.prompt") : "transparent"}
            color={isCurrent ? (isDone ? "#062514" : "#07222f") : isDone ? "lb.ok" : "#7e909d"}
            _hover={{ borderColor: "lb.prompt", color: isCurrent ? undefined : "#cfe6f5" }}
          >
            {lab.id}
          </Button>
        );
      })}
    </Wrap>
  );
}

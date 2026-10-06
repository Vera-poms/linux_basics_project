import { useEffect, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import type { Lab } from "../../data/types";

interface TaskListProps {
  lab: Lab;
  taskDone: boolean[];
}

export default function TaskList({ lab, taskDone }: TaskListProps) {
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});

  // Hints are per task, so close them all when the learner moves to another lab.
  useEffect(() => setOpenHints({}), [lab.id]);

  return (
    <Box>
      {lab.tasks.map((task, i) => {
        const done = !!taskDone[i];
        const open = !!openHints[i];
        return (
          <Box key={i} py="0.26rem">
            <HStack align="flex-start" spacing="0.6rem" fontSize="0.88rem" lineHeight="1.5" color={done ? "#7d8a93" : "#2a323a"}>
              <Box
                flex="0 0 auto"
                w="1.05rem"
                h="1.05rem"
                mt="0.14rem"
                border="1.5px solid"
                borderColor={done ? "lb.ok" : "#b3bec6"}
                bg={done ? "lb.ok" : "transparent"}
                borderRadius="3px"
                display="grid"
                placeItems="center"
                fontSize="0.7rem"
                color="#fff"
              >
                {done ? "✓" : ""}
              </Box>
              <Text as="span" flex="1 1 auto" textDecoration={done ? "line-through" : "none"} textDecorationThickness="1px" dangerouslySetInnerHTML={{ __html: task.text }} />
              <Text
                as="button"
                flex="0 0 auto"
                fontSize="0.75rem"
                color="lb.teal"
                textDecoration="underline"
                aria-expanded={open}
                onClick={() => setOpenHints((cur) => ({ ...cur, [i]: !cur[i] }))}
              >
                {open ? "hide hint" : "hint"}
              </Text>
            </HStack>
            {open && (
              <Box
                ml="1.65rem"
                mt="0.3rem"
                p="0.55rem 0.7rem"
                fontSize="0.82rem"
                lineHeight="1.55"
                color="#2a323a"
                bg="#fff"
                border="1px solid"
                borderColor="lb.rule"
                borderRadius="4px"
                dangerouslySetInnerHTML={{ __html: task.hint }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

import { Box, HStack, Text } from "@chakra-ui/react";
import type { Lab } from "../../data/types";

interface TaskListProps {
  lab: Lab;
  taskDone: boolean[];
}

export default function TaskList({ lab, taskDone }: TaskListProps) {
  return (
    <Box>
      {lab.tasks.map((task, i) => {
        const done = !!taskDone[i];
        return (
          <HStack key={i} align="flex-start" spacing="0.6rem" fontSize="0.88rem" lineHeight="1.5" py="0.26rem" color={done ? "#7d8a93" : "#2a323a"}>
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
            <Text as="span" textDecoration={done ? "line-through" : "none"} textDecorationThickness="1px" dangerouslySetInnerHTML={{ __html: task.text }} />
          </HStack>
        );
      })}
    </Box>
  );
}

import { Box, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Box minH="100%" bg="lb.console" display="flex" alignItems="center" justifyContent="center" px="1rem">
      <VStack
        spacing="1.5rem"
        bg="lb.manual"
        borderRadius="8px"
        p={{ base: "1.5rem", md: "2.5rem" }}
        w="100%"
        maxW="380px"
        boxShadow="0 20px 60px rgba(0,0,0,0.35)"
      >
        <Box textAlign="center">
          <Text fontFamily="mono" fontSize="0.82rem" letterSpacing="0.02em" color="lb.inkSoft">
            <Text as="b" color="lb.ink" fontWeight={600}>
              linux basics
            </Text>{" "}
            hands-on terminal
          </Text>
        </Box>

        {mode === "login" ? <LoginForm onSwitchToRegister={() => setMode("register")} /> : <RegisterForm onSwitchToLogin={() => setMode("login")} />}
      </VStack>
    </Box>
  );
}

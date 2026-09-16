import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { ProgressProvider } from "./state/ProgressContext";
import { apiProgressStore } from "./state/progressStore";
import AuthScreen from "./components/Auth/AuthScreen";
import App from "./App";

function LoadingScreen() {
  return (
    <Box minH="100%" bg="lb.console" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing="1rem">
        <Spinner color="lb.prompt" />
        <Text color="lb.consoleText" fontFamily="mono" fontSize="0.85rem">
          Loading…
        </Text>
      </VStack>
    </Box>
  );
}

function Gate() {
  const { token, user, isLoading } = useAuth();
  const store = useMemo(() => apiProgressStore(() => token), [token]);

  if (isLoading) return <LoadingScreen />;
  if (!token || !user) return <AuthScreen />;

  return (
    <ProgressProvider store={store} key={user.id}>
      <App />
    </ProgressProvider>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

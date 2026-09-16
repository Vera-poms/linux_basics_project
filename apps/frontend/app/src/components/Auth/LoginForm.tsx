import { Box, Button, FormControl, FormLabel, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // error already surfaced via context
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit} w="100%">
      <VStack spacing="1rem" align="stretch">
        <Heading as="h1" size="md" textAlign="center" color="lb.ink">
          Sign in
        </Heading>

        <FormControl isRequired>
          <FormLabel fontSize="0.85rem">Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} autoComplete="email" bg="white" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontSize="0.85rem">Password</FormLabel>
          <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} autoComplete="current-password" bg="white" />
        </FormControl>

        {error && (
          <Text color="lb.no" fontSize="0.85rem">
            {error}
          </Text>
        )}

        <Button type="submit" bg="lb.teal" color="white" _hover={{ bg: "#0a5952" }} isLoading={isSubmitting}>
          Sign in
        </Button>

        <Text fontSize="0.85rem" textAlign="center" color="lb.inkSoft">
          New here?{" "}
          <Text as="button" type="button" onClick={onSwitchToRegister} color="lb.teal" fontWeight={600} textDecoration="underline">
            Create an account
          </Text>
        </Text>
      </VStack>
    </Box>
  );
}

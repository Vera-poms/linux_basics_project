import { Box, Button, FormControl, FormLabel, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";

export default function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(email, password);
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
          Create an account
        </Heading>

        <FormControl isRequired>
          <FormLabel fontSize="0.85rem">Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} autoComplete="email" bg="white" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontSize="0.85rem">Password</FormLabel>
          <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} autoComplete="new-password" bg="white" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontSize="0.85rem">Confirm password</FormLabel>
          <Input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); clearError(); }} autoComplete="new-password" bg="white" />
        </FormControl>

        {(localError || error) && (
          <Text color="lb.no" fontSize="0.85rem">
            {localError || error}
          </Text>
        )}

        <Button type="submit" bg="lb.teal" color="white" _hover={{ bg: "#0a5952" }} isLoading={isSubmitting}>
          Create account
        </Button>

        <Text fontSize="0.85rem" textAlign="center" color="lb.inkSoft">
          Already have an account?{" "}
          <Text as="button" type="button" onClick={onSwitchToLogin} color="lb.teal" fontWeight={600} textDecoration="underline">
            Sign in
          </Text>
        </Text>
      </VStack>
    </Box>
  );
}

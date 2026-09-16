import { Button, Wrap } from "@chakra-ui/react";

interface ActionBarProps {
  onCheck: () => void;
  onHint: () => void;
  onSolution: () => void;
  onReset: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}

const actBtn = {
  fontFamily: "serif",
  fontSize: "0.85rem",
  px: "1rem",
  py: "0.44rem",
  borderRadius: "4px",
  border: "1px solid",
  borderColor: "lb.rule",
  bg: "white",
  color: "#2a323a",
  _hover: { borderColor: "#98a6b0", bg: "white" },
};

export default function ActionBar({ onCheck, onHint, onSolution, onReset, onNext, nextDisabled }: ActionBarProps) {
  return (
    <Wrap
      spacing="0.5rem"
      py="0.85rem"
      position="sticky"
      bottom={0}
      bg="#eff2f4"
    >
      <Button {...actBtn} bg="lb.teal" borderColor="lb.teal" color="white" fontWeight={600} _hover={{ bg: "#0a5952", borderColor: "#0a5952" }} onClick={onCheck}>
        Check my work
      </Button>
      <Button {...actBtn} onClick={onHint}>
        Hint
      </Button>
      <Button {...actBtn} onClick={onSolution}>
        Show solution
      </Button>
      <Button {...actBtn} onClick={onReset}>
        Reset lab
      </Button>
      <Button {...actBtn} onClick={onNext} isDisabled={nextDisabled} opacity={nextDisabled ? 0.45 : 1}>
        Next lab →
      </Button>
    </Wrap>
  );
}

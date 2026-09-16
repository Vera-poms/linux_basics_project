import { Flex, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef } from "react";
import { LABS } from "./data/labs";
import { taskState } from "./data/labHelpers";
import type { LabCheckCtx } from "./data/types";
import { useProgress } from "./state/ProgressContext";
import { useAuth } from "./state/AuthContext";
import { useShell } from "./state/useShell";
import StepNav from "./components/Header/StepNav";
import ManualPanel from "./components/Manual/ManualPanel";
import ConsolePanel from "./components/Console/ConsolePanel";
import type { InputLineHandle } from "./components/Console/InputLine";

const META_COMMANDS = ["check", "hint", "solution", "reset", "next", "labs"] as const;
type MetaCommand = (typeof META_COMMANDS)[number];

function doCheckOutput(lab: (typeof LABS)[number], st: boolean[]): string {
  const passed = st.filter(Boolean).length;
  let out = "";
  lab.tasks.forEach((t, i) => {
    const plain = t.text.replace(/<[^>]+>/g, "");
    out += (st[i] ? "  PASS  " : "  FAIL  ") + plain + "\n";
  });
  out += "\n  " + passed + " of " + st.length + " complete.";
  out += passed === st.length ? "  Lab " + lab.id + " done.\n" : "  Try `hint` if you are stuck.\n";
  return out;
}

export default function App() {
  const { progress, currentLabIndex, isLoading, gotoLab, markLabDone, revealNextHint } = useProgress();
  const { user, logout } = useAuth();
  const shellApi = useShell();
  const consoleRef = useRef<InputLineHandle>(null);
  const bootedRef = useRef(false);

  const lab = LABS[currentLabIndex];

  const ctx: LabCheckCtx = useMemo(() => ({ fs: shellApi.shell.fs, ranScripts: shellApi.shell.ranScripts }), [shellApi.shell]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taskDone = useMemo(() => taskState(lab, ctx), [lab, shellApi.version]);

  // Boot: reset the filesystem for the persisted lab and greet, once progress has actually loaded.
  // (currentLabIndex is a default 0 until the async progress fetch resolves — seeding before that
  // would reset the sandbox for lab 1 even when the user's saved progress points somewhere else.)
  useEffect(() => {
    if (bootedRef.current || isLoading) return;
    bootedRef.current = true;
    shellApi.resetFs(LABS.map((l) => l.setup), currentLabIndex);
    shellApi.pushLine("Ubuntu 22.04 sandbox. Everything here is simulated in your browser — nothing touches your real machine.", "sys");
    shellApi.pushLine("Click any command in the manual to run it. Tab completes paths, ↑ recalls history, `help` lists what works.", "sys");
    shellApi.pushLine(`── lab ${lab.id}: ${lab.title} ──`, "sys");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Mirror the original renderTasks(): auto mark a lab done/undone as its tasks flip.
  const taskKey = taskDone.join(",");
  useEffect(() => {
    if (!bootedRef.current) return;
    const allDone = taskDone.length > 0 && taskDone.every(Boolean);
    const wasDone = !!progress.done[lab.id];
    if (allDone && !wasDone) {
      markLabDone(lab.id, true);
      shellApi.pushLine(
        `✓ All ${lab.tasks.length} tasks for lab ${lab.id} complete.` +
          (currentLabIndex < LABS.length - 1 ? " Type `next` or use the button to continue." : " That is the whole path — well done."),
        "good"
      );
    } else if (!allDone && wasDone) {
      markLabDone(lab.id, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskKey]);

  function handleGotoLab(index: number) {
    if (index < 0 || index >= LABS.length) return;
    gotoLab(index);
    const target = LABS[index];
    shellApi.runSetup(target.setup);
    shellApi.pushLine(`── lab ${target.id}: ${target.title} ──`, "sys");
    consoleRef.current?.focus();
  }

  function runCheck() {
    shellApi.pushLine(doCheckOutput(lab, taskState(lab, ctx)));
  }
  function runHint() {
    const idx = progress.hintIdx[lab.id] || 0;
    if (idx >= lab.hints.length) {
      shellApi.pushLine("No more hints — try `solution`.", "sys");
      return;
    }
    const text = lab.hints[idx].replace(/<\/?code>/g, "`").replace(/<\/?strong>/g, "").replace(/<\/?em>/g, "");
    shellApi.pushLine(`hint ${idx + 1}/${lab.hints.length}: ${text}`, "warn");
    revealNextHint(lab.id);
  }
  function runSolution() {
    shellApi.pushLine(`Solution for lab ${lab.id} — read it, then type it yourself:`, "warn");
    lab.solution.forEach((l) => shellApi.pushLine("  " + l));
    shellApi.pushLine("Type these in, or press Reset lab to start clean.", "sys");
  }
  function runReset() {
    shellApi.resetFs(LABS.map((l) => l.setup), currentLabIndex);
    shellApi.pushLine(`Workspace reset for lab ${lab.id}.`, "sys");
  }
  function runNext() {
    if (currentLabIndex < LABS.length - 1) handleGotoLab(currentLabIndex + 1);
    else shellApi.pushLine("That was the last lab.", "sys");
  }
  function runLabsSummary() {
    shellApi.pushLine(LABS.map((l) => (progress.done[l.id] ? " ✓ " : "   ") + String(l.id).padStart(2, "0") + "  " + l.title).join("\n"));
  }

  function dispatchMeta(name: MetaCommand) {
    if (name === "check") runCheck();
    else if (name === "hint") runHint();
    else if (name === "solution") runSolution();
    else if (name === "reset") runReset();
    else if (name === "next") runNext();
    else if (name === "labs") runLabsSummary();
  }

  function handleSubmit(raw: string) {
    const trimmed = raw.trim();
    if (!shellApi.isHeredoc() && (META_COMMANDS as readonly string[]).includes(trimmed)) {
      shellApi.echoInput(raw);
      shellApi.shell.session.history.push(raw);
      dispatchMeta(trimmed as MetaCommand);
      return;
    }
    shellApi.submit(raw);
  }

  function handleRunCommand(cmdStr: string) {
    consoleRef.current?.focus();
    if (/<<'?[A-Za-z]/.test(cmdStr)) {
      consoleRef.current?.setValue(cmdStr);
      return;
    }
    handleSubmit(cmdStr);
  }

  function handleHelp() {
    shellApi.echoInput("help");
    const res = shellApi.shell.cmds.help([]);
    shellApi.pushLine(res.out);
    consoleRef.current?.focus();
  }

  const conTitle = `labex@sandbox: ${shellApi.promptPath()}`;

  return (
    <Flex direction="column" h="100%" overflow="hidden">
      <Flex
        as="header"
        flex="0 0 auto"
        bg="lb.console"
        color="lb.consoleText"
        borderBottom="1px solid #223039"
        px="1rem"
        py="0.55rem"
        align="center"
        gap="1.2rem"
        wrap="wrap"
      >
        <Text fontFamily="mono" fontSize="0.82rem" letterSpacing="0.02em" color="#8fa3b0">
          <Text as="b" color="#e6eef4" fontWeight={600}>
            linux basics
          </Text>{" "}
          hands-on terminal
        </Text>
        <StepNav labs={LABS} currentIndex={currentLabIndex} doneIds={progress.done} onSelect={handleGotoLab} />
        <Text fontFamily="mono" fontSize="0.72rem" color="#7e909d">
          {user?.email}
        </Text>
        <Text as="button" onClick={logout} fontFamily="mono" fontSize="0.72rem" color="#7e909d" _hover={{ color: "lb.prompt" }}>
          log out
        </Text>
      </Flex>

      <Flex as="main" flex="1 1 auto" minH={0} direction={{ base: "column", md: "row" }}>
        <ManualPanel
          lab={lab}
          taskDone={taskDone}
          isLastLab={currentLabIndex >= LABS.length - 1}
          onRunCommand={handleRunCommand}
          onCheck={() => {
            shellApi.echoInput("check");
            runCheck();
            consoleRef.current?.focus();
          }}
          onHint={() => {
            runHint();
            consoleRef.current?.focus();
          }}
          onSolution={() => {
            runSolution();
            consoleRef.current?.focus();
          }}
          onReset={() => {
            runReset();
            consoleRef.current?.focus();
          }}
          onNext={runNext}
        />
        <ConsolePanel ref={consoleRef} shellApi={shellApi} conTitle={conTitle} onSubmit={handleSubmit} onHelp={handleHelp} />
      </Flex>
    </Flex>
  );
}

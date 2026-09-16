import { Box, Heading, Link, Table, Tbody, Td, Text, Th, Thead, Tr, Wrap, WrapItem } from "@chakra-ui/react";
import type { Lab } from "../../data/types";
import CommandChip from "./CommandChip";

interface LessonBodyProps {
  lab: Lab;
  onRunCommand: (cmd: string) => void;
}

const Html = ({ html, ...rest }: { html: string; [key: string]: unknown }) => (
  // Content comes only from the static, developer-authored LABS data (src/data/labs.ts),
  // never from user input, so injecting its small set of inline tags (<code>/<strong>/<em>) is safe.
  <Box dangerouslySetInnerHTML={{ __html: html }} {...rest} />
);

function TreeBlock({ children }: { children: string }) {
  return (
    <Box
      as="pre"
      fontFamily="mono"
      fontSize="0.78rem"
      lineHeight="1.5"
      bg="#eaeef0"
      p="0.8rem 1rem"
      borderRadius="4px"
      whiteSpace="pre"
      overflowX="auto"
      my="0.8rem"
    >
      {children}
    </Box>
  );
}

export default function LessonBody({ lab, onRunCommand }: LessonBodyProps) {
  return (
    <Box>
      <Heading as="h1" fontSize="1.55rem" lineHeight="1.18" fontWeight={600} letterSpacing="-0.01em" mb="0.15rem">
        {lab.title}
      </Heading>
      <Text fontFamily="mono" fontSize="0.72rem" color="lb.teal" mb="1.1rem">
        lab {String(lab.id).padStart(2, "0")} of 10 &nbsp;·&nbsp; {lab.sub}
      </Text>
      <Html html={lab.intro} fontSize="0.95rem" lineHeight="1.62" my="0.6rem" maxW="62ch" color="#232a32" />

      {lab.body.map((sec, i) => (
        <Box key={i}>
          {sec.h && (
            <Heading as="h2" fontSize="0.94rem" fontWeight={600} mt="1.7rem" mb="0.5rem" pb="0.3rem" borderBottom="1px solid" borderColor="lb.rule">
              {sec.h}
            </Heading>
          )}
          {sec.p && <Html html={sec.p} fontSize="0.95rem" lineHeight="1.62" my="0.6rem" maxW="62ch" color="#232a32" />}
          {sec.table && (
            <Table size="sm" fontSize="0.86rem" my="0.8rem">
              <Thead>
                <Tr>
                  <Th borderColor="lb.rule">Mode</Th>
                  <Th borderColor="lb.rule">Means</Th>
                  <Th borderColor="lb.rule">Used for</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sec.table.map((row, ri) => (
                  <Tr key={ri}>
                    <Td borderColor="lb.rule">
                      <code>{row[0]}</code>
                    </Td>
                    <Td borderColor="lb.rule">{row[1]}</Td>
                    <Td borderColor="lb.rule">{row[2]}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          {sec.cmds && (
            <Box my="0.7rem" borderLeft="2px solid" borderColor="lb.teal">
              {sec.cmds.map((cmd, ci) => (
                <CommandChip key={ci} cmd={cmd} onRun={onRunCommand} />
              ))}
            </Box>
          )}
          {sec.tree && <TreeBlock>{sec.tree}</TreeBlock>}
          {sec.refs && sec.refs.length > 0 && (
            <Wrap spacing="0.4rem" my="0.5rem" maxW="62ch">
              {sec.refs.map((r, ri) => (
                <WrapItem key={ri}>
                  <Link
                    href={r.url}
                    isExternal
                    fontSize="0.76rem"
                    color="lb.teal"
                    bg="#eaeef0"
                    px="0.55rem"
                    py="0.2rem"
                    borderRadius="999px"
                    _hover={{ textDecoration: "none", bg: "#dfe6e6" }}
                  >
                    {r.label} ↗
                  </Link>
                </WrapItem>
              ))}
            </Wrap>
          )}
          {sec.aside && (
            <Html
              html={sec.aside}
              bg="#eef1ee"
              borderLeft="2px solid"
              borderColor="lb.warn"
              p="0.6rem 0.9rem"
              my="0.9rem"
              fontSize="0.9rem"
              lineHeight="1.55"
              maxW="62ch"
            />
          )}
        </Box>
      ))}

      {lab.tree && (
        <>
          <Heading as="h2" fontSize="0.94rem" fontWeight={600} mt="1.7rem" mb="0.5rem" pb="0.3rem" borderBottom="1px solid" borderColor="lb.rule">
            Build this
          </Heading>
          <TreeBlock>{lab.tree}</TreeBlock>
        </>
      )}
      {lab.brief && (
        <>
          <Heading as="h2" fontSize="0.94rem" fontWeight={600} mt="1.7rem" mb="0.5rem" pb="0.3rem" borderBottom="1px solid" borderColor="lb.rule">
            The three lines
          </Heading>
          <TreeBlock>{lab.brief}</TreeBlock>
        </>
      )}
    </Box>
  );
}

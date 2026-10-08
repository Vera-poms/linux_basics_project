import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
  Box, Button, Heading, Link, ListItem, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, UnorderedList, Wrap, WrapItem,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { Lab } from "../../data/types";
import { LABS } from "../../data/labs";
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

function TreeBlock({ children }: { children: ReactNode }) {
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

function DeepItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AccordionItem borderColor="lb.rule">
      <AccordionButton px="0.2rem" py="0.6rem">
        <Box flex="1" textAlign="left" fontSize="0.9rem" fontWeight={600}>
          {title}
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel px="0.2rem" pb="1rem">
        {children}
      </AccordionPanel>
    </AccordionItem>
  );
}

const PROSE = { fontSize: "0.92rem", lineHeight: "1.62", my: "0.6rem", maxW: "62ch", color: "#232a32" };

export default function LessonBody({ lab, onRunCommand }: LessonBodyProps) {
  return (
    <Box>
      <Heading as="h1" fontSize="1.55rem" lineHeight="1.18" fontWeight={600} letterSpacing="-0.01em" mb="0.15rem">
        {lab.title}
      </Heading>
      <Text fontFamily="mono" fontSize="0.72rem" color="lb.teal" mb="1.1rem">
        lab {String(lab.id).padStart(2, "0")} of {LABS.length} &nbsp;·&nbsp; {lab.sub}
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
          {sec.syntax && (
            <TreeBlock>
              <Box as="span" color="lb.teal">Syntax: </Box>
              {sec.syntax}
            </TreeBlock>
          )}
          {sec.options && sec.options.length > 0 && (
            <Table size="sm" fontSize="0.86rem" my="0.8rem">
              <Thead>
                <Tr>
                  <Th borderColor="lb.rule">Option</Th>
                  <Th borderColor="lb.rule">What it does</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sec.options.map((row, ri) => (
                  <Tr key={ri}>
                    <Td borderColor="lb.rule">
                      <code>{row[0]}</code>
                    </Td>
                    <Td borderColor="lb.rule"><Html as="span" html={row[1]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          {sec.examples?.map((ex, ei) => (
            <Box key={ei} my="1rem">
              <Text fontSize="0.9rem" fontWeight={600} mb="0.2rem">
                {ex.title}
              </Text>
              {ex.note && <Html html={ex.note} fontSize="0.9rem" lineHeight="1.55" maxW="62ch" color="#232a32" />}
              <TreeBlock>
                {ex.cmd.split("\n").map((l) => "$ " + l).join("\n")}
                {ex.output ? "\n" + ex.output : ""}
              </TreeBlock>
              <Button size="xs" variant="outline" fontFamily="mono" onClick={() => ex.cmd.split("\n").forEach((line) => onRunCommand(line))}>
                Run this
              </Button>
            </Box>
          ))}
          {((sec.whenToUse && sec.whenToUse.length > 0) || (sec.whenNotToUse && sec.whenNotToUse.length > 0)) && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1rem" my="1rem" maxW="62ch">
              {sec.whenToUse && sec.whenToUse.length > 0 && (
                <Box>
                  <Text fontSize="0.82rem" fontWeight={600} color="lb.teal" mb="0.3rem">
                    Use it when
                  </Text>
                  <UnorderedList fontSize="0.9rem" lineHeight="1.5" spacing="0.25rem" ml="1rem">
                    {sec.whenToUse.map((t, ti) => (
                      <ListItem key={ti}><Html as="span" html={t} /></ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
              {sec.whenNotToUse && sec.whenNotToUse.length > 0 && (
                <Box>
                  <Text fontSize="0.82rem" fontWeight={600} color="lb.warn" mb="0.3rem">
                    Avoid it when
                  </Text>
                  <UnorderedList fontSize="0.9rem" lineHeight="1.5" spacing="0.25rem" ml="1rem">
                    {sec.whenNotToUse.map((t, ti) => (
                      <ListItem key={ti}><Html as="span" html={t} /></ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
            </SimpleGrid>
          )}
          {sec.warning && (
            <Html
              html={"<strong>Consequences:</strong> " + sec.warning}
              bg="#f7ecea"
              borderLeft="3px solid"
              borderColor="red.500"
              p="0.6rem 0.9rem"
              my="0.9rem"
              fontSize="0.9rem"
              lineHeight="1.55"
              maxW="62ch"
            />
          )}
          {(sec.how || sec.anatomy || sec.mistakes || sec.compare) && (
            <Accordion allowMultiple defaultIndex={[0]} my="1.1rem" maxW="70ch" borderColor="lb.rule">
              {sec.how && (
                <DeepItem title="How it works">
                  {sec.how.map((para, pi) => (
                    <Html key={pi} html={para} {...PROSE} />
                  ))}
                </DeepItem>
              )}
              {sec.anatomy && sec.anatomy.length > 0 && (
                <DeepItem title="Reading the output">
                  {sec.anatomy.map((an, ai) => (
                    <Box key={ai} mb="1.2rem">
                      <Text fontSize="0.9rem" fontWeight={600}>{an.title}</Text>
                      <TreeBlock>{an.sample}</TreeBlock>
                      <Table size="sm" fontSize="0.86rem">
                        <Thead>
                          <Tr>
                            <Th borderColor="lb.rule">Part</Th>
                            <Th borderColor="lb.rule">Meaning</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {an.parts.map((row, ri) => (
                            <Tr key={ri}>
                              <Td borderColor="lb.rule" verticalAlign="top"><code>{row[0]}</code></Td>
                              <Td borderColor="lb.rule" whiteSpace="normal"><Html as="span" html={row[1]} /></Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ))}
                </DeepItem>
              )}
              {sec.mistakes && sec.mistakes.length > 0 && (
                <DeepItem title="Common mistakes and how to recover">
                  {sec.mistakes.map((m, mi) => (
                    <Box key={mi} mb="1.1rem" pl="0.8rem" borderLeft="3px solid" borderColor="red.300">
                      <Html html={"<strong>" + m.symptom + "</strong>"} fontSize="0.92rem" lineHeight="1.5" />
                      {m.cmd && (
                        <TreeBlock>
                          {m.cmd.split("\n").map((l) => "$ " + l).join("\n")}
                          {m.output ? "\n" + m.output : ""}
                        </TreeBlock>
                      )}
                      <Html html={"<em>Why:</em> " + m.cause} fontSize="0.9rem" lineHeight="1.55" my="0.3rem" />
                      <Html html={"<em>Fix:</em> " + m.fix} fontSize="0.9rem" lineHeight="1.55" my="0.3rem" />
                    </Box>
                  ))}
                </DeepItem>
              )}
              {sec.compare && (
                <DeepItem title={sec.compare.title}>
                  <Box overflowX="auto">
                    <Table size="sm" fontSize="0.86rem">
                      <Thead>
                        <Tr>
                          {sec.compare.head.map((h, hi) => (
                            <Th key={hi} borderColor="lb.rule">{h}</Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sec.compare.rows.map((row, ri) => (
                          <Tr key={ri}>
                            {row.map((cell, ci) => (
                              <Td key={ci} borderColor="lb.rule" whiteSpace="normal" verticalAlign="top">
                                <Html as="span" html={cell} />
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </DeepItem>
              )}
            </Accordion>
          )}
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

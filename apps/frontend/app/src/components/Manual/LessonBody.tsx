import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
  Box, Button, Code, Flex, Heading, IconButton, Link, ListItem, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, UnorderedList, Wrap, WrapItem,
} from "@chakra-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import type { Lab } from "../../data/types";
import { LABS } from "../../data/labs";
import { Shell } from "../../engine/runner";
import { HOME } from "../../engine/filesystem";
import CommandChip from "./CommandChip";
import { exampleKey, sectionKey, topicDomId, useBookmarks } from "../../state/BookmarksContext";

interface LessonBodyProps {
  lab: Lab;
  onRunCommand: (cmd: string) => void;
}

const Html = ({ html, ...rest }: { html: string; [key: string]: unknown }) => (
  // Content comes only from the static, developer-authored LABS data (src/data/labs.ts),
  // never from user input, so injecting its small set of inline tags (<code>/<strong>/<em>) is safe.
  <Box dangerouslySetInnerHTML={{ __html: html }} {...rest} />
);

// First-column cells: some entries are plain text (e.g. "-l"), others already carry <code> markup
// with HTML entities (e.g. "<code>&gt; FILE</code>"). Wrap the plain ones so both render as code.
const CodeCell = ({ html }: { html: string }) => (
  <Html as="span" html={html.includes("<code>") ? html : `<code>${html}</code>`} />
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

/** Event the app fires when jumping to a bookmark, so a collapsed accordion item can open before the scroll. */
export const OPEN_TOPIC_EVENT = "lb-open-topic";

/** Accordion whose items open when a bookmark inside the section (key `s{i}{h|a|m|c}…`) is selected. */
function DeepAccordion({ sectionIndex, kinds, children }: { sectionIndex: number; kinds: string[]; children: ReactNode }) {
  const [open, setOpen] = useState<number[]>([0]);
  useEffect(() => {
    const prefix = `s${sectionIndex}`;
    const onOpen = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (!key.startsWith(prefix)) return;
      const at = kinds.indexOf(key.charAt(prefix.length));
      if (at >= 0) setOpen((cur) => (cur.includes(at) ? cur : [...cur, at]));
    };
    window.addEventListener(OPEN_TOPIC_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TOPIC_EVENT, onOpen);
  }, [sectionIndex, kinds]);
  return (
    <Accordion allowMultiple index={open} onChange={(i) => setOpen(Array.isArray(i) ? i : [i])} my="1.1rem" maxW="70ch" borderColor="lb.rule">
      {children}
    </Accordion>
  );
}

const plainText = (html: string) => new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";

function DeepItem({ title, id, bookmark, children }: { title: string; id?: string; bookmark?: ReactNode; children: ReactNode }) {
  return (
    <AccordionItem borderColor="lb.rule" id={id} scrollMarginTop="0.5rem">
      <AccordionButton px="0.2rem" py="0.6rem">
        <Box flex="1" textAlign="left" fontSize="0.9rem" fontWeight={600}>
          {title}
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel px="0.2rem" pb="1rem">
        {bookmark && <Flex justify="flex-end">{bookmark}</Flex>}
        {children}
      </AccordionPanel>
    </AccordionItem>
  );
}

const transcriptCache = new Map<string, string>();

/**
 * Terminal-style transcript for an example. A multi-line example is replayed in a fresh sandbox so each
 * command is followed by its own output, as in a real terminal. Single commands use the authored output.
 */
function transcript(cmd: string, output: string, labId: number): string {
  const lines = cmd.split("\n");
  const plain = () => lines.map((l) => "$ " + l).join("\n") + (output ? "\n" + output : "");
  if (lines.length < 2) return plain();
  const key = labId + "\u0000" + cmd;
  const hit = transcriptCache.get(key);
  if (hit !== undefined) return hit;
  let text: string;
  try {
    const sh = new Shell();
    sh.reset(() => {
      for (let i = 0; i < labId; i++) LABS[i]?.setup?.(sh.fs);
    });
    sh.fs.cwd = HOME;
    const parts: string[] = [];
    for (const line of lines) {
      const r = sh.feedLine(line);
      parts.push("$ " + line);
      if (r.pending) continue;
      const out = (r.out + r.err).replace(/\n$/, "");
      if (out) parts.push(out);
    }
    text = parts.join("\n");
  } catch {
    text = plain();
  }
  transcriptCache.set(key, text);
  return text;
}

const PROSE ={ fontSize: "0.92rem", lineHeight: "1.62", my: "0.6rem", maxW: "62ch", color: "#232a32" };

function BookmarkButton({ title, active, onToggle }: { title: string; active: boolean; onToggle: () => void }) {
  return (
    <IconButton
      aria-label={(active ? "Remove bookmark: " : "Bookmark: ") + title}
      aria-pressed={active}
      title={active ? "Remove bookmark" : "Bookmark this topic"}
      size="xs"
      variant="ghost"
      color={active ? "lb.teal" : "lb.inkSoft"}
      onClick={onToggle}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      }
    />
  );
}

export default function LessonBody({ lab, onRunCommand }: LessonBodyProps) {
  const { has, toggle } = useBookmarks();
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
            <Flex
              id={topicDomId(lab.id, sectionKey(i))}
              align="center"
              justify="space-between"
              gap="0.5rem"
              mt="1.7rem"
              mb="0.5rem"
              pb="0.3rem"
              borderBottom="1px solid"
              borderColor="lb.rule"
              scrollMarginTop="0.5rem"
            >
              <Heading as="h2" fontSize="0.94rem" fontWeight={600}>
                {sec.h}
              </Heading>
              <BookmarkButton title={sec.h} active={has(lab.id, sectionKey(i))} onToggle={() => toggle(lab.id, sectionKey(i), sec.h!)} />
            </Flex>
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
                      <CodeCell html={row[0]} />
                    </Td>
                    <Td borderColor="lb.rule"><Html as="span" html={row[1]} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          {sec.examples?.map((ex, ei) => (
            <Box key={ei} my="1rem" id={topicDomId(lab.id, exampleKey(i, ei))} scrollMarginTop="0.5rem">
              <Flex align="center" justify="space-between" gap="0.5rem" mb="0.2rem">
                <Text fontSize="0.9rem" fontWeight={600}>
                  {ex.title}
                </Text>
                <BookmarkButton title={ex.title} active={has(lab.id, exampleKey(i, ei))} onToggle={() => toggle(lab.id, exampleKey(i, ei), ex.title)} />
              </Flex>
              {ex.note && <Html html={ex.note} fontSize="0.9rem" lineHeight="1.55" maxW="62ch" color="#232a32" />}
              <TreeBlock>
                {transcript(ex.cmd, ex.output, lab.id)}
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
                    Use {sec.subject ? <Code>{sec.subject}</Code> : "it"} when
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
                    Avoid {sec.subject ? <Code>{sec.subject}</Code> : "it"} when
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
            <DeepAccordion
              sectionIndex={i}
              kinds={[sec.how && "h", sec.anatomy && sec.anatomy.length > 0 && "a", sec.mistakes && sec.mistakes.length > 0 && "m", sec.compare && "c"].filter(Boolean) as string[]}
            >
              {sec.how && (
                <DeepItem
                  title="How it works"
                  id={topicDomId(lab.id, `s${i}h`)}
                  bookmark={<BookmarkButton title="How it works" active={has(lab.id, `s${i}h`)} onToggle={() => toggle(lab.id, `s${i}h`, (sec.h ?? "") + ": How it works")} />}
                >
                  {sec.how.map((para, pi) => (
                    <Html key={pi} html={para} {...PROSE} />
                  ))}
                </DeepItem>
              )}
              {sec.anatomy && sec.anatomy.length > 0 && (
                <DeepItem title="Reading the output">
                  {sec.anatomy.map((an, ai) => (
                    <Box key={ai} mb="1.2rem" id={topicDomId(lab.id, `s${i}a${ai}`)} scrollMarginTop="0.5rem">
                      <Flex align="center" justify="space-between" gap="0.5rem">
                        <Text fontSize="0.9rem" fontWeight={600}>{an.title}</Text>
                        <BookmarkButton title={an.title} active={has(lab.id, `s${i}a${ai}`)} onToggle={() => toggle(lab.id, `s${i}a${ai}`, an.title)} />
                      </Flex>
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
                              <Td borderColor="lb.rule" verticalAlign="top"><CodeCell html={row[0]} /></Td>
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
                    <Box key={mi} mb="1.1rem" pl="0.8rem" borderLeft="3px solid" borderColor="red.300" id={topicDomId(lab.id, `s${i}m${mi}`)} scrollMarginTop="0.5rem">
                      <Flex align="flex-start" justify="space-between" gap="0.5rem">
                        <Html html={"<strong>" + m.symptom + "</strong>"} fontSize="0.92rem" lineHeight="1.5" />
                        <BookmarkButton
                          title={plainText(m.symptom)}
                          active={has(lab.id, `s${i}m${mi}`)}
                          onToggle={() => toggle(lab.id, `s${i}m${mi}`, plainText(m.symptom).slice(0, 255))}
                        />
                      </Flex>
                      {m.cmd && (
                        <TreeBlock>
                          {transcript(m.cmd, m.output ?? "", lab.id)}
                        </TreeBlock>
                      )}
                      <Html html={"<em>Why:</em> " + m.cause} fontSize="0.9rem" lineHeight="1.55" my="0.3rem" />
                      <Html html={"<em>Fix:</em> " + m.fix} fontSize="0.9rem" lineHeight="1.55" my="0.3rem" />
                    </Box>
                  ))}
                </DeepItem>
              )}
              {sec.compare && (
                <DeepItem
                  title={sec.compare.title}
                  id={topicDomId(lab.id, `s${i}c`)}
                  bookmark={<BookmarkButton title={sec.compare.title} active={has(lab.id, `s${i}c`)} onToggle={() => toggle(lab.id, `s${i}c`, sec.compare!.title)} />}
                >
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
            </DeepAccordion>
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
                      <CodeCell html={row[0]} />
                    </Td>
                    <Td borderColor="lb.rule"><Html as="span" html={row[1]} /></Td>
                    <Td borderColor="lb.rule"><Html as="span" html={row[2]} /></Td>
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

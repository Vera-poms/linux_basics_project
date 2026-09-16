import { extendTheme } from "@chakra-ui/react";

export const fonts = {
  mono: '"SF Mono", ui-monospace, "JetBrains Mono", "Cascadia Mono", Menlo, Consolas, monospace',
  serif: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
};

export const colors = {
  lb: {
    ink: "#161b22",
    inkSoft: "#4a5560",
    rule: "#d3dae1",
    manual: "#f5f7f8",
    manualEdge: "#e7ebee",
    console: "#0d1318",
    console2: "#141d24",
    consoleText: "#c6d2da",
    prompt: "#68b8e8",
    ok: "#5fbf87",
    no: "#e87070",
    warn: "#dda74a",
    teal: "#0d6f68",
    tealSoft: "#e2efed",
  },
};

const theme = extendTheme({
  fonts: {
    heading: fonts.serif,
    body: fonts.serif,
    mono: fonts.mono,
  },
  colors,
  styles: {
    global: {
      "html, body, #root": { height: "100%" },
      body: { margin: 0, backgroundColor: "lb.console", overflow: "hidden" },
      "::-webkit-scrollbar": { width: "9px", height: "9px" },
      "::-webkit-scrollbar-thumb": { background: "#39464f", borderRadius: "9px" },
      "::-webkit-scrollbar-track": { background: "transparent" },
      code: {
        fontFamily: fonts.mono,
        fontSize: "0.84em",
        background: "#e8ecef",
        padding: "0.1em 0.32em",
        borderRadius: "3px",
      },
    },
  },
});

export default theme;

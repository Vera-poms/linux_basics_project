import { HOME, USR_BIN } from "../engine/filesystem";
import type { Lab } from "./types";
import {
  c, has, dir, read, mode, link, nlines, match, isFile, tarMembers, ranScript, PASSWD, lines,
  owner, group, passwdEntry, inGroup, shadowUnlocked,
} from "./labHelpers";

export const LABS: Lab[] = [
  {
    id: 1,
    title: "Find your way around",
    sub: "pwd · ls · cd · paths",
    intro:
      "Everything else you will ever do in a terminal assumes you know two things: where you are, and what is around you. Three commands answer that, and you will type them tens of thousands of times.",
    body: [
      {
        h: "Where am I?",
        p: "The shell always has a current directory. <code>pwd</code> prints it. The prompt on the right shows it too, with <code>~</code> standing in for your home directory.",
        cmds: [c("pwd", "print working directory")],
        refs: [{ label: "pwd(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/pwd.1.html" }],
      },
      {
        h: "What is here?",
        p: "<code>ls</code> lists the current directory. Its flags are worth learning properly now rather than guessing at forever. Run these and compare the output.",
        cmds: [
          c("ls", "bare names, columns"),
          c("ls -l", "long: permissions, owner, size, date"),
          c("ls -a", "include hidden entries, the dot files"),
          c("ls -la", "both together — the one you'll type most"),
          c("ls -lh", "sizes as 4.0K instead of 4096"),
          c("ls -l /etc", "point it anywhere, not just here"),
        ],
        refs: [
          { label: "ls(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/ls.1.html" },
          { label: "GNU Coreutils: ls invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/ls-invocation.html" },
        ],
      },
      {
        h: "Moving",
        p: "<code>cd</code> changes directory. An <strong>absolute</strong> path starts at the root <code>/</code> and works from anywhere. A <strong>relative</strong> path starts from where you already are.",
        cmds: [
          c("cd /etc", "absolute"),
          c("pwd", ""),
          c("cd ..", "up one level"),
          c("cd ~", "home"),
          c("cd", "home as well, with no argument"),
        ],
        refs: [{ label: "cd — Bash Reference Manual", url: "https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html" }],
      },
      {
        h: "Sending output into a file",
        p: "<code>&gt;</code> takes whatever a command would have printed and writes it to a file instead. You need it for the tasks below, and constantly thereafter.",
        cmds: [c("ls /etc > /tmp/demo.txt", "write"), c("cat /tmp/demo.txt", "read it back")],
        refs: [{ label: "Bash Reference Manual: Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" }],
      },
    ],
    tasks: [
      { text: "Create a directory called <code>lab01</code> in your home directory", check: (ctx) => dir(ctx, "lab01") },
      {
        text: "Write the absolute path of your home directory into <code>lab01/where.txt</code>",
        check: (ctx) => match(ctx, "lab01/where.txt", /\/home\/labex/),
      },
      {
        text: "Save a long-format, human-readable listing of <code>/etc</code> to <code>lab01/etc-listing.txt</code>",
        check: (ctx) =>
          match(ctx, "lab01/etc-listing.txt", /^[-dl]rw[-x]/m) &&
          match(ctx, "lab01/etc-listing.txt", /passwd/) &&
          match(ctx, "lab01/etc-listing.txt", /\d+(\.\d)?K|\b\d{3,}\b/),
      },
      {
        text: "Save the number of entries in <code>/usr/bin</code> to <code>lab01/bin-count.txt</code> — the number alone",
        check: (ctx) => {
          const t = read(ctx, "lab01/bin-count.txt");
          return t !== null && new RegExp("^\\s*" + USR_BIN.length + "\\s*$").test(t.trim());
        },
      },
    ],
    hints: [
      "Task 2: run <code>pwd</code> while you are in your home directory and redirect it with <code>&gt;</code>.",
      "Task 3: two flags on <code>ls</code>, combined, pointed at <code>/etc</code>.",
      "Task 4: <code>ls /usr/bin</code> prints one name per line when its output goes to a file or pipe, so pipe it into <code>wc -l</code>.",
    ],
    solution: ["cd ~", "mkdir lab01", "pwd > lab01/where.txt", "ls -lh /etc > lab01/etc-listing.txt", "ls /usr/bin | wc -l > lab01/bin-count.txt"],
  },
  {
    id: 2,
    title: "Make and read files",
    sub: "touch · echo · cat · head · tail · wc",
    intro:
      "Files are where the work lives. Creating them, appending to them and pulling pieces out of them is most of what a shell session actually consists of.",
    body: [
      {
        h: "Creating",
        p: "<code>touch</code> makes an empty file. <code>echo</code> plus a redirect makes one with content in it.",
        cmds: [
          c("touch empty.txt", ""),
          c('echo "hello" > greet.txt', "> writes, replacing everything"),
          c('echo "again" >> greet.txt', ">> appends one line"),
          c("cat greet.txt", ""),
        ],
        refs: [
          { label: "touch(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/touch.1.html" },
          { label: "Bash Reference Manual: Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
        ],
      },
      {
        h: "The difference that costs people data",
        p: "<code>&gt;</code> empties the file to zero bytes <em>before</em> writing. <code>&gt;&gt;</code> adds to the end. Getting these confused is how an afternoon disappears.",
        aside: "When you are not certain, use <code>&gt;&gt;</code>. An extra line is recoverable; an overwritten file is not.",
      },
      {
        h: "Reading",
        p: "Whole file, top, bottom, or just a count.",
        cmds: [
          c("cat /etc/hosts", "whole file"),
          c("cat -n /etc/passwd", "with line numbers"),
          c("head -n 3 /etc/passwd", "first 3 lines"),
          c("tail -n 2 /etc/passwd", "last 2 lines"),
          c("wc -l /etc/passwd", "count lines"),
          c("wc -l < /etc/passwd", "same count, without the filename"),
        ],
        refs: [
          { label: "cat(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cat.1.html" },
          { label: "head(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/head.1.html" },
          { label: "tail(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tail.1.html" },
          { label: "wc(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/wc.1.html" },
        ],
      },
      {
        h: "Several lines at once",
        p: "A heredoc feeds everything up to your chosen marker into the command. Type this line, press Enter, and the prompt changes to <code>&gt;</code> until you type <code>EOF</code>.",
        cmds: [c("cat > demo.txt <<'EOF'", "then type lines, then EOF on its own")],
        refs: [{ label: "Bash Reference Manual: Here Documents", url: "https://www.gnu.org/software/bash/manual/html_node/Here-Documents.html" }],
      },
    ],
    tasks: [
      {
        text: "Create <code>lab02</code> and, inside it, <code>notes.txt</code> holding exactly the three lines from the brief below",
        check: (ctx) =>
          dir(ctx, "lab02") &&
          match(ctx, "lab02/notes.txt", /^Linux is a kernel$/m) &&
          match(ctx, "lab02/notes.txt", /^Bash is a shell$/m) &&
          match(ctx, "lab02/notes.txt", /^Everything is a file$/m),
      },
      {
        text: "Append a fourth line, <code>Paths are case sensitive</code>, without losing the first three",
        check: (ctx) => match(ctx, "lab02/notes.txt", /^Paths are case sensitive$/m) && nlines(ctx, "lab02/notes.txt") === 4,
      },
      {
        text: "Save the first 10 lines of <code>/etc/passwd</code> to <code>lab02/users-head.txt</code>",
        check: (ctx) => nlines(ctx, "lab02/users-head.txt") === 10 && match(ctx, "lab02/users-head.txt", /^root:/m),
      },
      {
        text: "Save the line count of <code>/etc/passwd</code> to <code>lab02/users-count.txt</code> — the number with no filename beside it",
        check: (ctx) => {
          const t = read(ctx, "lab02/users-count.txt");
          return t !== null && new RegExp("^\\s*" + lines(PASSWD).length + "\\s*$").test(t.trim());
        },
      },
    ],
    brief: "Linux is a kernel\nBash is a shell\nEverything is a file",
    hints: [
      "Three <code>echo</code> lines works: the first with <code>&gt;</code>, the next two with <code>&gt;&gt;</code>. Or use a heredoc.",
      "Task 2 must use <code>&gt;&gt;</code>. If the check for task 1 suddenly goes red, you used <code>&gt;</code> and wiped the file.",
      "Task 4: <code>wc -l file</code> prints the count <em>and</em> the name. Feed the file in on stdin instead — <code>wc -l &lt; file</code> — and you get only the number.",
    ],
    solution: [
      "mkdir lab02",
      'echo "Linux is a kernel" > lab02/notes.txt',
      'echo "Bash is a shell" >> lab02/notes.txt',
      'echo "Everything is a file" >> lab02/notes.txt',
      'echo "Paths are case sensitive" >> lab02/notes.txt',
      "head -n 10 /etc/passwd > lab02/users-head.txt",
      "wc -l < /etc/passwd > lab02/users-count.txt",
    ],
  },
  {
    id: 3,
    title: "Scaffold a project",
    sub: "mkdir -p · brace expansion · tree",
    intro: "Laying out a new project by hand is the single most common thing you will do in a terminal. Done well it is one command; done badly it is twenty.",
    body: [
      {
        h: "Parents for free",
        p: "Plain <code>mkdir</code> fails if the parent does not exist yet. <code>-p</code> creates the whole chain, and does not complain if it is already there — which is why it is safe inside scripts.",
        cmds: [
          c("mkdir -p demo/src/components", "three levels, one command"),
          c("mkdir -p demo/src/components", "run it twice — no error"),
          c("tree demo", ""),
        ],
        refs: [{ label: "mkdir(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/mkdir.1.html" }],
      },
      {
        h: "Brace expansion",
        p: "<code>{a,b,c}</code> is pure text substitution done by the shell before the command runs. <code>mkdir -p site/{css,js,img}</code> is really three arguments. It nests, too.",
        cmds: [
          c("mkdir -p site/{css,js,img}", ""),
          c("tree site", ""),
          c("mkdir -p app/{src/{lib,ui},tests}", "nested"),
          c("tree app", ""),
        ],
        refs: [{ label: "Bash Reference Manual: Brace Expansion", url: "https://www.gnu.org/software/bash/manual/html_node/Brace-Expansion.html" }],
      },
      {
        h: "Seeing what you built",
        p: "<code>tree</code> draws the shape. <code>-a</code> includes dot files, which matters when your scaffold has a <code>.gitignore</code> in it.",
        cmds: [c("tree -a site", ""), c("ls -R site", "the same thing without tree")],
        refs: [{ label: "tree(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tree.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Build every directory of the <code>webapp</code> tree shown below",
        check: (ctx) =>
          ["webapp", "webapp/src", "webapp/src/css", "webapp/src/js", "webapp/assets", "webapp/assets/images", "webapp/assets/fonts", "webapp/tests", "webapp/docs"].every((p) => dir(ctx, p)),
      },
      {
        text: "Create the three empty files under <code>src/</code>: <code>index.html</code>, <code>css/style.css</code>, <code>js/main.js</code>",
        check: (ctx) => ["webapp/src/index.html", "webapp/src/css/style.css", "webapp/src/js/main.js"].every((p) => isFile(ctx, p)),
      },
      { text: "<code>webapp/README.md</code> starts with the line <code># WebApp</code>", check: (ctx) => match(ctx, "webapp/README.md", /^# WebApp/) },
      { text: "<code>webapp/.gitignore</code> has a line reading <code>node_modules/</code>", check: (ctx) => match(ctx, "webapp/.gitignore", /^node_modules\/$/m) },
      { text: "<code>webapp/docs/setup.md</code> mentions <code>Installation</code>", check: (ctx) => match(ctx, "webapp/docs/setup.md", /Installation/) },
    ],
    tree: "webapp/\n├── .gitignore\n├── README.md\n├── src/\n│   ├── index.html\n│   ├── css/style.css\n│   └── js/main.js\n├── assets/\n│   ├── images/\n│   └── fonts/\n├── tests/\n└── docs/setup.md",
    hints: [
      "All nine directories fit in one <code>mkdir -p</code> with braces: <code>webapp/{src/{css,js},assets/{images,fonts},tests,docs}</code>.",
      "<code>touch</code> takes several paths at once.",
      "A leading dot only hides a file from plain <code>ls</code>; creating <code>.gitignore</code> is no different from any other file.",
    ],
    solution: [
      "mkdir -p webapp/{src/{css,js},assets/{images,fonts},tests,docs}",
      "touch webapp/src/index.html webapp/src/css/style.css webapp/src/js/main.js",
      'echo "# WebApp" > webapp/README.md',
      'echo "node_modules/" > webapp/.gitignore',
      'echo "## Installation" > webapp/docs/setup.md',
      "tree -a webapp",
    ],
  },
  {
    id: 4,
    title: "Copy, move, rename",
    sub: "cp · cp -r · mv",
    intro: "<code>mv</code> is both move and rename — the same operation, seen from two angles. Both <code>cp</code> and <code>mv</code> will overwrite an existing file without a word of warning.",
    body: [
      {
        h: "Copying",
        p: "Directories need <code>-r</code>. Without it <code>cp</code> refuses and tells you why.",
        cmds: [c("cp /etc/hosts hosts.bak", "file to file"), c("cp -r webapp demo-copy", "whole tree"), c("ls demo-copy", "")],
        refs: [{ label: "cp(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cp.1.html" }],
      },
      {
        h: "Moving and renaming",
        p: "Same command. If the destination is an existing directory you move into it; otherwise you rename.",
        cmds: [c("mv hosts.bak hosts.old", "rename"), c("mkdir -p attic", ""), c("mv hosts.old attic/", "move into a directory"), c("ls attic", "")],
        refs: [{ label: "mv(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/mv.1.html" }],
      },
      {
        h: "Where it bites",
        p: "<code>cp -r src dest</code> behaves differently depending on whether <code>dest</code> already exists: if it does you get <code>dest/src</code>, if it does not you get <code>dest</code> as a copy of <code>src</code>.",
        aside: "Run <code>ls</code> straight after every <code>cp -r</code> and <code>mv</code> until checking is reflex. It takes one second and saves whole afternoons.",
      },
    ],
    tasks: [
      {
        text: "Make a full recursive copy of <code>webapp</code> called <code>webapp-backup</code>",
        check: (ctx) => dir(ctx, "webapp-backup") && has(ctx, "webapp-backup/README.md") && dir(ctx, "webapp-backup/src/css"),
      },
      {
        text: "Rename <code>webapp/src/js/main.js</code> to <code>app.js</code>",
        check: (ctx) => !has(ctx, "webapp/src/js/main.js") && (has(ctx, "webapp/src/js/app.js") || has(ctx, "webapp/src/scripts/app.js")),
      },
      {
        text: "Create <code>utils.js</code> and <code>api.js</code> beside it, then move all three into a new <code>webapp/src/scripts/</code>",
        check: (ctx) => ["app.js", "utils.js", "api.js"].every((f2) => has(ctx, "webapp/src/scripts/" + f2)),
      },
      {
        text: "Leave <code>webapp/src/js/</code> in place but empty",
        check: (ctx) => {
          const n = ctx.fs.getNode(ctx.fs.resolve("webapp/src/js", HOME));
          return !!n && n.t === "d" && Object.keys(n.children).length === 0;
        },
      },
      {
        text: "Copy <code>webapp/README.md</code> into <code>webapp/docs/</code>, keeping the original",
        check: (ctx) => has(ctx, "webapp/docs/README.md") && has(ctx, "webapp/README.md"),
      },
    ],
    hints: [
      "Task 3: make the target directory first, then <code>mv webapp/src/js/*.js webapp/src/scripts/</code> moves all three in one go.",
      "Task 4 is why you use <code>mv</code> for the files and never touch the directory itself.",
      "Task 5 says keep the original, so that is <code>cp</code>, not <code>mv</code>.",
    ],
    solution: [
      "cp -r webapp webapp-backup",
      "mv webapp/src/js/main.js webapp/src/js/app.js",
      "touch webapp/src/js/utils.js webapp/src/js/api.js",
      "mkdir -p webapp/src/scripts",
      "mv webapp/src/js/*.js webapp/src/scripts/",
      "cp webapp/README.md webapp/docs/",
      "tree webapp/src",
    ],
  },
  {
    id: 5,
    title: "Delete without regret",
    sub: "rm · rm -r · rmdir",
    intro: "There is no recycle bin. <code>rm</code> unlinks the data and the shell returns to the prompt as if nothing happened. Three habits make this safe.",
    body: [
      {
        h: "The three commands",
        p: "",
        cmds: [
          c("ls lab05", "a pile of junk has been set up for you"),
          c("rm lab05/junk.txt", "one file"),
          c("rmdir lab05/scratch-empty", "only works when empty — a free safety net"),
          c("rm -r lab05/scratch", "directory and everything under it"),
        ],
        refs: [
          { label: "rm(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/rm.1.html" },
          { label: "rmdir(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/rmdir.1.html" },
        ],
      },
      {
        h: "Look before you delete",
        p: "Run <code>ls</code> with exactly the glob you are about to hand to <code>rm</code>. What <code>ls</code> prints is precisely what will be destroyed.",
        cmds: [c("ls lab05/*.tmp", "rehearse"), c("ls lab05/*.txt", "note which files do and don't match")],
        refs: [{ label: "Bash Reference Manual: Filename Expansion", url: "https://www.gnu.org/software/bash/manual/html_node/Filename-Expansion.html" }],
        aside:
          "Second habit: never let a space creep into <code>rm -rf /path/to/dir</code>. Third: reach for <code>rmdir</code> whenever you believe a directory is empty. If it refuses, your belief was wrong and it just saved you.",
      },
    ],
    tasks: [
      { text: "Delete every <code>.tmp</code> file in <code>lab05/</code>", check: (ctx) => ["a.tmp", "b.tmp", "c.tmp"].every((f2) => !has(ctx, "lab05/" + f2)) },
      { text: "Leave <code>lab05/keep.tmp.txt</code> alone — it is not a <code>.tmp</code> file", check: (ctx) => has(ctx, "lab05/keep.tmp.txt") },
      { text: "Remove <code>lab05/cache/</code> and everything inside it", check: (ctx) => !has(ctx, "lab05/cache") },
      { text: "Remove <code>lab05/empty/</code> with the command that would have refused had it held anything", check: (ctx) => !has(ctx, "lab05/empty") },
      { text: "Leave <code>lab05/important.txt</code> and <code>lab05/logs/</code> untouched", check: (ctx) => has(ctx, "lab05/important.txt") && has(ctx, "lab05/logs/old.log") },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab05/cache/sub");
      fs.mkdirp(HOME + "/lab05/empty");
      fs.mkdirp(HOME + "/lab05/logs");
      fs.mkdirp(HOME + "/lab05/scratch-empty");
      fs.mkdirp(HOME + "/lab05/scratch");
      fs.writeFile(HOME + "/lab05/scratch/throwaway.txt", "practice\n");
      ["a.tmp", "b.tmp", "c.tmp"].forEach((n) => fs.writeFile(HOME + "/lab05/" + n, "scratch\n"));
      fs.writeFile(HOME + "/lab05/keep.tmp.txt", "do not delete me\n");
      fs.writeFile(HOME + "/lab05/junk.txt", "throwaway\n");
      fs.writeFile(HOME + "/lab05/important.txt", "the only copy\n");
      fs.writeFile(HOME + "/lab05/cache/data.bin", "cached\n");
      fs.writeFile(HOME + "/lab05/cache/sub/more.bin", "cached\n");
      fs.writeFile(HOME + "/lab05/logs/old.log", "old log line\n");
    },
    hints: [
      "The glob <code>*.tmp</code> anchors to the end of the name, so <code>keep.tmp.txt</code> does not match. Confirm with <code>ls lab05/*.tmp</code> before deleting.",
      "<code>cache/</code> has files in it, so <code>rmdir</code> will refuse — that is the recursive case.",
      "<code>empty/</code> is the <code>rmdir</code> case. Using <code>rm -r</code> there would also work, which is exactly why it is the weaker habit.",
    ],
    solution: ["ls lab05/*.tmp", "rm lab05/*.tmp", "rm -r lab05/cache", "rmdir lab05/empty", "ls -a lab05"],
  },
  {
    id: 6,
    title: "Find files, search text",
    sub: "find · grep",
    intro: "The two are constantly confused. <strong>find matches names. grep matches lines inside files.</strong> Hold onto that and the flags sort themselves out.",
    body: [
      {
        h: "find — by name",
        p: "Quote the pattern, or the shell expands it before <code>find</code> ever sees it.",
        cmds: [
          c('find lab06 -name "*.log"', "by name"),
          c("find lab06 -type d", "directories only"),
          c('find lab06 -type f -name "*.js"', "combine"),
          c("find /etc -maxdepth 1 -type f", "stop descending"),
        ],
        refs: [{ label: "find(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/find.1.html" }],
      },
      {
        h: "grep — inside files",
        p: "grep prints every line that matches, in the order it meets them — including a line more than once if the file itself repeats it. Two lines of identical text in the source file mean two identical lines of output; that's grep reporting faithfully, not a bug.",
        cmds: [
          c("grep ERROR lab06/logs/app.log", "plain match"),
          c("grep -i error lab06/logs/app.log", "ignore case — same result here since the log is already upper-case"),
          c("grep -c INFO lab06/logs/app.log", "count instead of print"),
          c("grep -v INFO lab06/logs/app.log", "invert: everything else"),
          c("grep -n TODO lab06/src/main.js", "with line numbers"),
          c("grep -rn TODO lab06/src/utils", "recurse a whole tree"),
        ],
        refs: [
          { label: "grep(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/grep.1.html" },
          { label: "GNU grep manual", url: "https://www.gnu.org/software/grep/manual/grep.html" },
        ],
      },
      {
        h: "Reading grep output",
        p: "With <code>-r</code> across several files, each line is prefixed <code>path:</code>. Add <code>-n</code> and it becomes <code>path:line:</code> — the format every editor can jump straight to.",
      },
    ],
    tasks: [
      {
        text: "Create <code>lab06/out/</code> and list the paths of every <code>.log</code> file under <code>lab06</code> into <code>lab06/out/logs.txt</code>",
        check: (ctx) => match(ctx, "lab06/out/logs.txt", /app\.log/) && match(ctx, "lab06/out/logs.txt", /old\.log/),
      },
      {
        text: "Put the <code>ERROR</code> lines from <code>lab06/logs/app.log</code> into <code>lab06/out/errors.txt</code> — those lines only",
        check: (ctx) => nlines(ctx, "lab06/out/errors.txt") === 3 && !match(ctx, "lab06/out/errors.txt", /INFO|WARN/),
      },
      { text: "Put the <em>count</em> of <code>WARN</code> lines into <code>lab06/out/warn-count.txt</code>", check: (ctx) => match(ctx, "lab06/out/warn-count.txt", /^\s*3\s*$/) },
      {
        text: "Search <code>lab06/src/</code> recursively for <code>TODO</code>, with filename and line number, into <code>lab06/out/todos.txt</code>",
        check: (ctx) => match(ctx, "lab06/out/todos.txt", /main\.js:\d+:/) && nlines(ctx, "lab06/out/todos.txt") === 3,
      },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab06/logs");
      fs.mkdirp(HOME + "/lab06/src/utils");
      fs.mkdirp(HOME + "/lab06/archive");
      fs.writeFile(
        HOME + "/lab06/logs/app.log",
        "2026-09-10 INFO server started on port 8080\n2026-09-10 WARN config file missing, using defaults\n2026-09-10 ERROR database connection refused\n2026-09-10 INFO retrying connection\n2026-09-10 ERROR database connection refused\n2026-09-11 INFO connection established\n2026-09-11 WARN slow query detected 2.4s\n2026-09-11 ERROR timeout on /api/users\n2026-09-11 INFO request completed\n2026-09-11 WARN memory usage at 87 percent\n"
      );
      fs.writeFile(HOME + "/lab06/archive/old.log", "2026-08-01 INFO archived entry\n2026-08-01 ERROR archived failure\n");
      fs.writeFile(HOME + "/lab06/src/main.js", 'function main() {\n  // TODO: handle empty input\n  console.log("running");\n}\n');
      fs.writeFile(HOME + "/lab06/src/utils/helpers.js", "export function slugify(s) {\n  // TODO: strip accents\n  return s.toLowerCase();\n}\n");
      fs.writeFile(HOME + "/lab06/src/style.css", "body { margin: 0; } /* TODO: add dark mode */\n");
    },
    hints: [
      "Redirection will not create a missing directory — <code>mkdir -p lab06/out</code> first.",
      "Task 3 has a dedicated grep flag. You do not need <code>wc</code>.",
      "Task 4 needs two grep flags at once, and a directory as the target.",
    ],
    solution: [
      "mkdir -p lab06/out",
      'find lab06 -type f -name "*.log" > lab06/out/logs.txt',
      "grep ERROR lab06/logs/app.log > lab06/out/errors.txt",
      "grep -c WARN lab06/logs/app.log > lab06/out/warn-count.txt",
      "grep -rn TODO lab06/src > lab06/out/todos.txt",
      "cat lab06/out/todos.txt",
    ],
  },
  {
    id: 7,
    title: "Permissions",
    sub: "chmod · modes · executables",
    intro: "Every file carries nine permission bits: read, write and execute, for owner, group and everyone else. Read them off the left-hand column of <code>ls -l</code>.",
    body: [
      {
        h: "Reading the column",
        p: "<code>-rwxr-xr--</code> breaks into four pieces: type, then owner <code>rwx</code>, group <code>r-x</code>, others <code>r--</code>. A <code>d</code> in front means directory, <code>l</code> means symlink.",
        cmds: [c("ls -l /etc/passwd", ""), c("ls -l /etc/shadow", "note the tighter mode"), c("ls -ld /etc", "a directory's own mode")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Numeric modes",
        p: "r=4, w=2, x=1, summed per class. Four combinations cover almost everything you will do.",
        table: [
          ["644", "owner read/write, everyone reads", "ordinary file"],
          ["755", "owner everything, others read and run", "scripts, directories"],
          ["600", "owner only", "keys, secrets, .env"],
          ["700", "owner only, fully", "private directories"],
        ],
        refs: [{ label: "chmod(1) — man7.org: numeric modes", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Changing them",
        p: "Numeric sets all nine bits at once. Symbolic adjusts what is already there.",
        cmds: [
          c("touch demo.sh", ""),
          c("chmod 755 demo.sh", ""),
          c("ls -l demo.sh", ""),
          c("chmod 600 demo.sh", "tighten"),
          c("chmod u+x demo.sh", "symbolic: add execute for the owner"),
          c("ls -l demo.sh", ""),
        ],
        refs: [{ label: "GNU Coreutils: File Permissions", url: "https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html" }],
      },
      {
        h: "Making a script run",
        p: "A script needs two things: a shebang line naming its interpreter, and the execute bit. Then you run it by path.",
        aside:
          "On a directory, <code>x</code> does not mean execute — it means you may enter and traverse it. A directory with <code>r</code> but no <code>x</code> lets you list the names inside and read nothing.",
      },
    ],
    tasks: [
      {
        text: "Create the directory <code>lab07</code>, and in it <code>backup.sh</code> starting with <code>#!/bin/bash</code> and containing an <code>echo</code>",
        check: (ctx) => match(ctx, "lab07/backup.sh", /^#!\/bin\/bash/) && match(ctx, "lab07/backup.sh", /echo/),
      },
      { text: "Give it mode <code>755</code>", check: (ctx) => mode(ctx, "lab07/backup.sh") === "755" },
      { text: "Run it — <code>./lab07/backup.sh</code> should print your message", check: (ctx) => ranScript(ctx, "lab07/backup.sh") },
      { text: "Create <code>lab07/secrets.env</code> with mode <code>600</code>", check: (ctx) => has(ctx, "lab07/secrets.env") && mode(ctx, "lab07/secrets.env") === "600" },
      { text: "Create the directory <code>lab07/private</code> with mode <code>700</code>", check: (ctx) => dir(ctx, "lab07/private") && mode(ctx, "lab07/private") === "700" },
      { text: "Save a long listing of <code>lab07</code> to <code>lab07/perms.txt</code>", check: (ctx) => match(ctx, "lab07/perms.txt", /backup\.sh/) && match(ctx, "lab07/perms.txt", /^-rwx/m) },
    ],
    hints: [
      "Make the directory first — <code>mkdir -p lab07/private</code> covers both it and task 5. Redirection never creates a missing directory. Then the tidiest way to write a two-line script is a heredoc: <code>cat &gt; lab07/backup.sh &lt;&lt;'EOF'</code>, the two lines, then <code>EOF</code> on its own.",
      "600 is 4+2 for the owner and nothing for anyone else.",
      "<code>chmod</code> treats directories exactly like files — <code>chmod 700 lab07/private</code>.",
    ],
    solution: [
      "mkdir -p lab07/private",
      "cat > lab07/backup.sh <<'EOF'",
      "#!/bin/bash",
      'echo "Backing up project files..."',
      "EOF",
      "chmod 755 lab07/backup.sh",
      "./lab07/backup.sh",
      "touch lab07/secrets.env",
      "chmod 600 lab07/secrets.env",
      "chmod 700 lab07/private",
      "ls -l lab07 > lab07/perms.txt",
      "cat lab07/perms.txt",
    ],
  },
  {
    id: 8,
    title: "Links, sizes, archives",
    sub: "ln -s · du · tar",
    intro: "Three unrelated tools that turn up together constantly: pointing at a file from somewhere else, finding out what is eating your disk, and bundling a directory for transport.",
    body: [
      {
        h: "Symlinks",
        p: "A symlink is a small file holding a path. It breaks if the target moves, which is a feature — you can see that it broke.",
        cmds: [c("ln -s /etc/passwd users-link", "create"), c("ls -l users-link", "the arrow shows the target"), c("cat users-link", "reads through to the target"), c("readlink -f users-link", "resolve it")],
        refs: [{ label: "ln(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/ln.1.html" }],
      },
      {
        h: "Disk usage",
        p: "<code>du</code> measures directories; <code>df</code> measures whole filesystems. <code>du -sh</code> on each subdirectory is the standard opening move when a disk fills up.",
        cmds: [c("du -sh webapp", "one total, human readable"), c("du -h webapp", "every directory inside"), c("df -h", "free space per filesystem")],
        refs: [
          { label: "du(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/du.1.html" },
          { label: "df(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/df.1.html" },
        ],
      },
      {
        h: "Archives",
        p: "<code>tar</code> bundles many files into one; <code>-z</code> runs the result through gzip. The three modes you need are create, list and extract.",
        cmds: [
          c("tar -czf webapp.tar.gz webapp", "c = create, z = gzip, f = file"),
          c("file webapp.tar.gz", "confirm what it is"),
          c("tar -tzf webapp.tar.gz", "t = tell me, without extracting"),
          c("mkdir -p unpacked", ""),
          c("tar -xzf webapp.tar.gz -C unpacked", "x = extract, -C = into this directory"),
          c("tree unpacked", ""),
        ],
        aside:
          "Mnemonic for the three modes: <strong>c</strong>reate, <strong>t</strong>ell me, e<strong>x</strong>tract. The <code>f</code> always comes last because the filename follows it.",
        refs: [
          { label: "tar(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tar.1.html" },
          { label: "GNU tar manual", url: "https://www.gnu.org/software/tar/manual/tar.html" },
        ],
      },
    ],
    tasks: [
      {
        text: "Create <code>lab08/webapp.tar.gz</code>, a gzip archive of your <code>webapp</code> directory",
        check: (ctx) => {
          const m = tarMembers(ctx, "lab08/webapp.tar.gz");
          return !!m && m.some((x) => /webapp/.test(x));
        },
      },
      {
        text: "Write the archive's contents listing to <code>lab08/contents.txt</code> without extracting it",
        check: (ctx) => match(ctx, "lab08/contents.txt", /webapp/) && nlines(ctx, "lab08/contents.txt") > 5,
      },
      { text: "Extract the archive into <code>lab08/restored/</code>", check: (ctx) => dir(ctx, "lab08/restored/webapp") && has(ctx, "lab08/restored/webapp/README.md") },
      {
        text: "Make <code>lab08/current</code> a symlink pointing at the restored <code>webapp</code>",
        check: (ctx) => link(ctx, "lab08/current") && !!ctx.fs.getNode(ctx.fs.resolve("lab08/current", HOME)),
      },
      { text: "Save the human-readable total size of <code>webapp</code> to <code>lab08/size.txt</code>", check: (ctx) => match(ctx, "lab08/size.txt", /^\s*\d+(\.\d)?[KM]?\s+\S*webapp/m) },
    ],
    hints: [
      "<code>mkdir -p lab08/restored</code> first — neither <code>tar</code> nor <code>&gt;</code> will create directories for you.",
      "Task 2 is <code>-tzf</code> redirected into the file.",
      "Task 4: the target is <code>restored/webapp</code>, and the link is easiest to create from inside <code>lab08</code>.",
      "Task 5 wants <code>-s</code> and <code>-h</code> on <code>du</code> together.",
    ],
    solution: [
      "mkdir -p lab08/restored",
      "tar -czf lab08/webapp.tar.gz webapp",
      "tar -tzf lab08/webapp.tar.gz > lab08/contents.txt",
      "tar -xzf lab08/webapp.tar.gz -C lab08/restored",
      "ln -s restored/webapp lab08/current",
      "du -sh webapp > lab08/size.txt",
      "ls -l lab08",
    ],
    setup: (fs) => {
      if (fs.exists(HOME + "/webapp")) return;
      fs.mkdirp(HOME + "/webapp/src/css");
      fs.mkdirp(HOME + "/webapp/src/js");
      fs.mkdirp(HOME + "/webapp/assets/images");
      fs.mkdirp(HOME + "/webapp/assets/fonts");
      fs.mkdirp(HOME + "/webapp/tests");
      fs.mkdirp(HOME + "/webapp/docs");
      fs.writeFile(HOME + "/webapp/src/index.html", "<!doctype html>\n<html></html>\n");
      fs.writeFile(HOME + "/webapp/src/css/style.css", "body { margin: 0; }\n");
      fs.writeFile(HOME + "/webapp/src/js/main.js", 'console.log("running");\n');
      fs.writeFile(HOME + "/webapp/README.md", "# WebApp\n");
      fs.writeFile(HOME + "/webapp/.gitignore", "node_modules/\n");
      fs.writeFile(HOME + "/webapp/docs/setup.md", "## Installation\n");
    },
  },
  {
    id: 9,
    title: "Pipes and redirection",
    sub: "| · 2>&1 · tee · sort | uniq -c",
    intro: "Every process gets three streams: input, output, and errors. Wiring them together is what turns a handful of small commands into something that would otherwise need a script.",
    body: [
      {
        h: "The three streams",
        p: "stdout is 1, stderr is 2. They are separate, which is why errors still appear on screen when you redirect output to a file.",
        cmds: [
          c("ls /etc nowhere", "one succeeds, one fails"),
          c("ls /etc nowhere > out.txt", "errors still reach the screen"),
          c("ls /etc nowhere > out.txt 2>&1", "send errors to the same place"),
          c("ls /etc nowhere 2>/dev/null", "discard the errors"),
        ],
        aside:
          "Order matters: <code>&gt; file 2&gt;&amp;1</code> works, <code>2&gt;&amp;1 &gt; file</code> does not. Read it as \"point stdout at the file, then point stderr wherever stdout is now pointing.\"",
        refs: [{ label: "Bash Reference Manual: Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" }],
      },
      {
        h: "Pipes",
        p: "A pipe connects one command's output to the next one's input. No temporary files, no cleanup.",
        cmds: [
          c("cat /etc/passwd | wc -l", ""),
          c("cut -d: -f1 /etc/passwd", "first colon-separated field"),
          c("cut -d: -f1 /etc/passwd | sort", "then sort it"),
          c("awk '{print $2}' lab06/logs/app.log", "second whitespace field"),
        ],
        refs: [
          { label: "Bash Reference Manual: Pipelines", url: "https://www.gnu.org/software/bash/manual/html_node/Pipelines.html" },
          { label: "cut(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cut.1.html" },
          { label: "sort(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/sort.1.html" },
          { label: "awk(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/awk.1p.html" },
        ],
      },
      {
        h: "Counting things",
        p: "<code>uniq</code> only collapses <em>adjacent</em> duplicates, so it is always preceded by <code>sort</code>. The three-command idiom below is worth memorising outright.",
        cmds: [c("cut -d: -f7 /etc/passwd | sort | uniq -c", "count each login shell"), c("cut -d: -f7 /etc/passwd | sort | uniq -c | sort -rn", "most frequent first")],
        refs: [{ label: "uniq(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/uniq.1.html" }],
      },
      {
        h: "tee",
        p: "<code>tee</code> writes the stream to a file and passes it along, so you can save an intermediate result without breaking the pipeline.",
        cmds: [c("grep ERROR lab06/logs/app.log | tee saved.txt | wc -l", "")],
        refs: [{ label: "tee(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tee.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Create <code>lab09</code>, and in <code>lab09/levels.txt</code> list each log level in <code>lab06/logs/app.log</code> with its count, most frequent first",
        check: (ctx) =>
          match(ctx, "lab09/levels.txt", /^\s*4 INFO/m) &&
          match(ctx, "lab09/levels.txt", /^\s*3 WARN/m) &&
          match(ctx, "lab09/levels.txt", /^\s*3 ERROR/m) &&
          /INFO/.test((read(ctx, "lab09/levels.txt") || "").split("\n")[0]),
      },
      {
        text: "Run <code>ls lab06 nowhere</code> and capture <em>both</em> its output and its error into <code>lab09/both.txt</code>",
        check: (ctx) => match(ctx, "lab09/both.txt", /logs/) && match(ctx, "lab09/both.txt", /No such file/),
      },
      {
        text: "In one pipeline with <code>tee</code>: <code>ERROR</code> lines into <code>lab09/errors.txt</code>, their count into <code>lab09/error-count.txt</code>",
        check: (ctx) => nlines(ctx, "lab09/errors.txt") === 3 && match(ctx, "lab09/error-count.txt", /^\s*3\s*$/),
      },
      {
        text: "Put the usernames from <code>/etc/passwd</code>, sorted alphabetically, into <code>lab09/usernames.txt</code>",
        check: (ctx) => {
          const t = read(ctx, "lab09/usernames.txt");
          if (t === null) return false;
          const L2 = lines(t);
          return L2.length === lines(PASSWD).length && L2.includes("root") && L2.join() === L2.slice().sort().join();
        },
      },
    ],
    hints: [
      "Task 1 is the four-stage idiom from the walkthrough: <code>awk</code> the second field, <code>sort</code>, <code>uniq -c</code>, then <code>sort -rn</code>.",
      "Task 2: <code>&gt; lab09/both.txt 2&gt;&amp;1</code>, in that order.",
      "Task 3: <code>grep ERROR ... | tee lab09/errors.txt | wc -l &gt; lab09/error-count.txt</code>.",
      "Task 4: <code>cut -d: -f1</code> pulls the username, then <code>sort</code>.",
    ],
    solution: [
      "mkdir -p lab09",
      "awk '{print $2}' lab06/logs/app.log | sort | uniq -c | sort -rn > lab09/levels.txt",
      "ls lab06 nowhere > lab09/both.txt 2>&1",
      "grep ERROR lab06/logs/app.log | tee lab09/errors.txt | wc -l > lab09/error-count.txt",
      "cut -d: -f1 /etc/passwd | sort > lab09/usernames.txt",
      "cat lab09/levels.txt",
    ],
  },
  {
    id: 10,
    title: "Final challenge",
    sub: "everything, no walkthrough",
    intro: "No new commands and no worked examples this time. Read the brief, work out the commands, watch the checklist. If you stall, the hints nudge without answering.",
    body: [
      { h: "The brief", p: "You are setting up a small deployment tool called <code>shipit</code>. Build it in your home directory so that every requirement below holds." },
      {
        h: "Structure",
        p: "",
        tree: "shipit/\n├── README.md\n├── .gitignore\n├── summary.txt\n├── latest -> release/shipit-v1.tar.gz\n├── bin/shipit.sh\n├── config/\n│   ├── production.env\n│   └── staging.env\n├── lib/\n│   ├── deploy.sh\n│   └── rollback.sh\n├── logs/deploy.log\n└── release/shipit-v1.tar.gz",
      },
      {
        h: "Requirements",
        p: "<strong>1.</strong> <code>README.md</code> begins <code># shipit</code>. &nbsp;<strong>2.</strong> <code>.gitignore</code> has lines <code>logs/</code> and <code>*.env</code>. &nbsp;<strong>3.</strong> <code>bin/shipit.sh</code> has a bash shebang, mode 755, and runs. &nbsp;<strong>4.</strong> Both <code>lib/*.sh</code> are 755. &nbsp;<strong>5.</strong> Both <code>config/*.env</code> are 600. &nbsp;<strong>6.</strong> <code>logs/deploy.log</code> has at least three lines, each carrying <code>INFO</code>, <code>WARN</code> or <code>ERROR</code>. &nbsp;<strong>7.</strong> The archive holds <code>bin</code>, <code>lib</code> and <code>config</code> but <em>not</em> <code>logs</code>. &nbsp;<strong>8.</strong> <code>latest</code> is a working symlink to the archive. &nbsp;<strong>9.</strong> <code>summary.txt</code> holds the count of ERROR lines in the log.",
      },
    ],
    tasks: [
      { text: "Directory tree complete: <code>bin</code>, <code>config</code>, <code>lib</code>, <code>logs</code>, <code>release</code>", check: (ctx) => ["shipit", "shipit/bin", "shipit/config", "shipit/lib", "shipit/logs", "shipit/release"].every((p) => dir(ctx, p)) },
      {
        text: "<code>README.md</code> and <code>.gitignore</code> as specified",
        check: (ctx) => match(ctx, "shipit/README.md", /^# shipit/) && match(ctx, "shipit/.gitignore", /^logs\/$/m) && match(ctx, "shipit/.gitignore", /^\*\.env$/m),
      },
      {
        text: "<code>bin/shipit.sh</code> has a shebang, is mode 755, and has been run",
        check: (ctx) => match(ctx, "shipit/bin/shipit.sh", /^#!\/bin\/bash/) && mode(ctx, "shipit/bin/shipit.sh") === "755" && ranScript(ctx, "shipit/bin/shipit.sh"),
      },
      { text: "<code>lib/deploy.sh</code> and <code>lib/rollback.sh</code> are both 755", check: (ctx) => mode(ctx, "shipit/lib/deploy.sh") === "755" && mode(ctx, "shipit/lib/rollback.sh") === "755" },
      { text: "<code>config/production.env</code> and <code>config/staging.env</code> are both 600", check: (ctx) => mode(ctx, "shipit/config/production.env") === "600" && mode(ctx, "shipit/config/staging.env") === "600" },
      {
        text: "<code>logs/deploy.log</code> has 3+ levelled lines",
        check: (ctx) => {
          const t = read(ctx, "shipit/logs/deploy.log");
          return t !== null && lines(t).filter((l) => /INFO|WARN|ERROR/.test(l)).length >= 3;
        },
      },
      {
        text: "Archive contains bin, lib and config — and not logs",
        check: (ctx) => {
          const m = tarMembers(ctx, "shipit/release/shipit-v1.tar.gz");
          return !!m && m.some((x) => /bin/.test(x)) && m.some((x) => /lib/.test(x)) && m.some((x) => /config/.test(x)) && !m.some((x) => /logs/.test(x));
        },
      },
      { text: "<code>latest</code> is a symlink that resolves to the archive", check: (ctx) => link(ctx, "shipit/latest") && !!ctx.fs.getNode(ctx.fs.resolve("shipit/latest", HOME)) },
      {
        text: "<code>summary.txt</code> holds the ERROR count",
        check: (ctx) => {
          const t = read(ctx, "shipit/summary.txt");
          if (t === null) return false;
          const log = read(ctx, "shipit/logs/deploy.log") || "";
          const n = lines(log).filter((l) => /ERROR/.test(l)).length;
          return new RegExp("^\\s*" + n + "\\s*$").test(t.trim()) && n > 0;
        },
      },
    ],
    hints: [
      "The whole tree is one <code>mkdir -p shipit/{bin,config,lib,logs,release}</code>.",
      "Requirement 7: <code>tar</code> takes several sources at once — name <code>bin</code>, <code>lib</code> and <code>config</code> explicitly rather than archiving all of <code>shipit</code>. Check with <code>-tzf</code>.",
      "Do the <code>chmod</code>s after creating the files; writing a file gives it a fresh default mode.",
      "Requirement 9: <code>grep -c ERROR</code> prints just the number.",
    ],
    solution: [
      "mkdir -p shipit/{bin,config,lib,logs,release}",
      'echo "# shipit" > shipit/README.md',
      "printf 'logs/\\n*.env\\n' > shipit/.gitignore",
      "cat > shipit/bin/shipit.sh <<'EOF'",
      "#!/bin/bash",
      'echo "shipit: starting deployment"',
      "EOF",
      "printf '#!/bin/bash\\necho deploying\\n' > shipit/lib/deploy.sh",
      "printf '#!/bin/bash\\necho rolling back\\n' > shipit/lib/rollback.sh",
      'echo "APP_ENV=production" > shipit/config/production.env',
      'echo "APP_ENV=staging" > shipit/config/staging.env',
      "cat > shipit/logs/deploy.log <<'EOF'",
      "2026-09-14 INFO deployment started",
      "2026-09-14 WARN disk usage above 80 percent",
      "2026-09-14 ERROR failed to reach node-3",
      "2026-09-14 INFO deployment finished",
      "EOF",
      "cd shipit",
      "tar -czf release/shipit-v1.tar.gz bin lib config",
      "ln -s release/shipit-v1.tar.gz latest",
      "chmod 755 bin/shipit.sh lib/deploy.sh lib/rollback.sh",
      "chmod 600 config/production.env config/staging.env",
      "./bin/shipit.sh",
      "grep -c ERROR logs/deploy.log > summary.txt",
      "cd ~",
      "tree -a shipit",
    ],
  },
  {
    id: 11,
    title: "The Manuscript Mystery",
    sub: "diff · cmp · chown · sudo — a detective story",
    intro:
      "A novelist vanished the week her final manuscript was due. Two versions of the last chapter turned up, an evidence folder is locked against you, and a case log is full of noise. Before you can chase any of that, you need three tools you haven't used yet: comparing two files, taking ownership of one, and running a single command as root.",
    body: [
      {
        h: "Read-only, even for you",
        p: "Every file has an owner and a group, alongside its permission bits. <code>/etc/shadow</code> is real: mode 640, owned by <code>root</code>. You are <code>labex</code>, not in the file's group, so the <code>other</code> bits — all zero — are what apply to you.",
        cmds: [c("cat /etc/shadow", "denied — you are not root and not in its group"), c("sudo cat /etc/shadow", "sudo runs one command as root, then it's gone")],
        aside: "sudo does not log you in as root. It elevates exactly the single command that follows it, nothing more.",
        refs: [{ label: "sudo(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/sudo.8.html" }],
      },
      {
        h: "Taking ownership",
        p: "<code>chown</code> reassigns who owns a file. Only root may do it — reassigning ownership is exactly the kind of thing an unprivileged user cannot be trusted with.",
        cmds: [
          c("touch demo.txt", ""),
          c("chown root demo.txt", "refused — you are not root"),
          c("sudo chown root demo.txt", "succeeds"),
          c("ls -l demo.txt", "the owner column now reads root"),
          c("sudo chown labex:labex demo.txt", "user:group in one go, handing it back"),
        ],
        refs: [{ label: "chown(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chown.1.html" }],
      },
      {
        h: "Comparing two files",
        p: "<code>diff</code> shows which lines changed, in the classic <code>NcM</code> / <code>&lt;</code> / <code>&gt;</code> form. <code>cmp</code> is blunter: the first byte where two files stop matching, or nothing at all if they're identical.",
        cmds: [
          c("printf 'one\\ntwo\\nthree\\n' > d1.txt", ""),
          c("printf 'one\\ntwo\\nTHREE\\n' > d2.txt", ""),
          c("diff d1.txt d2.txt", "3c3, then the old line and the new one"),
          c("cmp d1.txt d2.txt", "byte 9, line 3"),
        ],
        refs: [
          { label: "diff(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/diff.1.html" },
          { label: "cmp(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cmp.1.html" },
        ],
      },
    ],
    tree:
      "lab11/\n├── case.log\n├── draft-final.txt\n├── published-final.txt\n└── vault/\n    └── confession.txt   (owned by root, mode 600)",
    tasks: [
      {
        text: "Search <code>lab11/case.log</code> for the line mentioning the suspect (case-insensitive), saving just that line to <code>lab11/suspect.txt</code>",
        check: (ctx) => nlines(ctx, "lab11/suspect.txt") === 1 && match(ctx, "lab11/suspect.txt", /E\.V\./),
      },
      {
        text: "Diff <code>lab11/draft-final.txt</code> against <code>lab11/published-final.txt</code>, saving the result to <code>lab11/changes.txt</code>",
        check: (ctx) => match(ctx, "lab11/changes.txt", /^4c4$/m) && match(ctx, "lab11/changes.txt", /Ainsley/) && match(ctx, "lab11/changes.txt", /gardener/),
      },
      {
        text: "<code>cat</code> the locked <code>lab11/vault/confession.txt</code> — you'll be refused. Read it with <code>sudo</code> instead and save what it says to <code>lab11/confession.txt</code>",
        check: (ctx) => match(ctx, "lab11/confession.txt", /gardener/),
      },
      {
        text: "Take real ownership of <code>lab11/vault/confession.txt</code> — <code>labex:labex</code> — using <code>sudo chown</code>",
        check: (ctx) => owner(ctx, "lab11/vault/confession.txt") === "labex" && group(ctx, "lab11/vault/confession.txt") === "labex",
      },
      {
        text: "Name the culprit — who really altered the record — in <code>lab11/solution.txt</code>",
        check: (ctx) => match(ctx, "lab11/solution.txt", /Ainsley/i),
      },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab11/vault");
      fs.writeFile(
        HOME + "/lab11/case.log",
        "09:02 library opens for the reading\n09:14 Inspector Hale arrives\n09:30 the manuscript is confirmed missing\n09:41 witnesses are gathered\n09:55 ALERT: suspect spotted near the library, initials: E.V.\n10:10 the study is searched\n10:22 no forced entry is found\n10:40 statements are taken\n"
      );
      fs.writeFile(
        HOME + "/lab11/draft-final.txt",
        "Chapter 12: The Reveal\nInspector Hale gathered them all in the library.\nThe letter opener was missing since noon.\nOnly Mrs. Ainsley had a key to the study.\nShe confessed everything at half past nine.\n"
      );
      fs.writeFile(
        HOME + "/lab11/published-final.txt",
        "Chapter 12: The Reveal\nInspector Hale gathered them all in the library.\nThe letter opener was missing since noon.\nOnly the gardener had a key to the study.\nShe confessed everything at half past nine.\n"
      );
      fs.writeFile(HOME + "/lab11/vault/confession.txt", "I, Mrs. Ainsley, confess: I altered the record to protect the gardener, who is my son.\n");
      const v = fs.getNode(HOME + "/lab11/vault/confession.txt", false);
      if (v) {
        v.owner = "root";
        v.group = "root";
        v.mode = "600";
      }
    },
    hints: [
      "Task 1: <code>grep -i suspect lab11/case.log &gt; lab11/suspect.txt</code>.",
      "Task 3: <code>cat lab11/vault/confession.txt</code> first, to see the refusal, then <code>sudo cat ... &gt; lab11/confession.txt</code>. Redirection still works — it's the read that sudo unlocks.",
      "Task 4: <code>sudo chown labex:labex lab11/vault/confession.txt</code>.",
    ],
    solution: [
      "mkdir -p lab11",
      "grep -i suspect lab11/case.log > lab11/suspect.txt",
      "diff lab11/draft-final.txt lab11/published-final.txt > lab11/changes.txt",
      "sudo cat lab11/vault/confession.txt > lab11/confession.txt",
      "sudo chown labex:labex lab11/vault/confession.txt",
      "echo 'Mrs. Ainsley' > lab11/solution.txt",
    ],
  },
  {
    id: 12,
    title: "Display user and group information",
    sub: "id · groups · /etc/passwd · /etc/group",
    intro:
      "Linux has always been multi-user under the hood, even on a laptop with one person at the keyboard. Every process runs as somebody, every file is owned by somebody, and three commands answer the identity question directly.",
    body: [
      {
        h: "Who you are",
        p: "<code>id</code> prints your numeric and named identity: your own uid and gid, and the gid of every group you belong to. Point it at another username to look them up instead of yourself.",
        cmds: [c("id", ""), c("id root", ""), c("whoami", "just the username")],
        refs: [{ label: "id(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/id.1.html" }],
      },
      {
        h: "Which groups",
        p: "<code>groups</code> is the short form — just the group names, primary group first.",
        cmds: [c("groups", ""), c("groups www-data", "")],
        refs: [{ label: "groups(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/groups.1.html" }],
      },
      {
        h: "The records behind it",
        p: "<code>id</code> and <code>groups</code> are really just readers over two plain text files. <code>/etc/passwd</code> is one line per user: name, a placeholder password field, uid, gid, description, home, shell. <code>/etc/group</code> is one line per group: name, placeholder, gid, member list.",
        cmds: [c("head -n 3 /etc/passwd", ""), c("head -n 3 /etc/group", "")],
        refs: [
          { label: "passwd(5) — man7.org", url: "https://man7.org/linux/man-pages/man5/passwd.5.html" },
          { label: "group(5) — man7.org", url: "https://man7.org/linux/man-pages/man5/group.5.html" },
        ],
        table: [
          ["name", "x", "uid/gid", "description", "home", "shell"],
          ["labex", "x", "1000", "LabEx User", "/home/labex", "/bin/bash"],
        ],
      },
    ],
    tasks: [
      {
        text: "Save the output of <code>id</code> for yourself into <code>lab12/me.txt</code>",
        check: (ctx) => match(ctx, "lab12/me.txt", /uid=1000\(labex\)/) && match(ctx, "lab12/me.txt", /gid=1000\(labex\)/),
      },
      {
        text: "Save the groups the <code>www-data</code> user belongs to into <code>lab12/www-groups.txt</code>",
        check: (ctx) => match(ctx, "lab12/www-groups.txt", /www-data/),
      },
      {
        text: "Save <code>daemon</code>'s exact <code>/etc/passwd</code> line, and no other, to <code>lab12/daemon.txt</code>",
        check: (ctx) => nlines(ctx, "lab12/daemon.txt") === 1 && match(ctx, "lab12/daemon.txt", /^daemon:x:1:1:/),
      },
      {
        text: "Save every <code>/etc/group</code> line whose name contains <code>sys</code> to <code>lab12/sys-groups.txt</code>",
        check: (ctx) => match(ctx, "lab12/sys-groups.txt", /^sys:/m) && match(ctx, "lab12/sys-groups.txt", /systemd-network/),
      },
    ],
    hints: [
      "Task 1 is just <code>id &gt; lab12/me.txt</code>.",
      "Task 3: anchor the match so only <code>daemon</code>'s own line comes back — <code>grep '^daemon:' /etc/passwd</code>.",
      "Task 4: <code>grep sys /etc/group</code> — no anchor needed, both <code>sys</code> and <code>systemd-network</code> contain it.",
    ],
    solution: [
      "mkdir -p lab12",
      "id > lab12/me.txt",
      "groups www-data > lab12/www-groups.txt",
      "grep '^daemon:' /etc/passwd > lab12/daemon.txt",
      "grep sys /etc/group > lab12/sys-groups.txt",
    ],
  },
  {
    id: 13,
    title: "Compare file contents",
    sub: "diff · cmp",
    intro:
      "Two config files, two backups, two drafts — the question is always the same: are these the same, and if not, where do they differ? <code>diff</code> and <code>cmp</code> answer it two different ways.",
    body: [
      {
        h: "diff — what changed",
        p: "Output reads as a set of instructions to turn the first file into the second: a line range, a letter (<code>a</code>dd, <code>d</code>elete, <code>c</code>hange), another line range. <code>&lt;</code> is the old side, <code>&gt;</code> is the new side.",
        cmds: [c("diff lab13/config-a.txt lab13/config-b.txt", "")],
        refs: [
          { label: "diff(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/diff.1.html" },
          { label: "GNU diffutils: An Overview of diff", url: "https://www.gnu.org/software/diffutils/manual/html_node/Overview.html" },
        ],
      },
      {
        h: "cmp — where it first breaks",
        p: "No output and exit code 0 means identical. Otherwise, the byte and line number of the very first mismatch — useful when you only care <em>whether</em> they match, not the full list of changes.",
        cmds: [c("cmp lab13/identical-a.txt lab13/identical-b.txt", "silence: they match"), c("cmp lab13/report-v1.txt lab13/report-v2.txt", "the first difference, precisely")],
        refs: [{ label: "cmp(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cmp.1.html" }],
      },
    ],
    tree: "lab13/\n├── config-a.txt\n├── config-b.txt\n├── identical-a.txt\n├── identical-b.txt\n├── report-v1.txt\n└── report-v2.txt",
    tasks: [
      {
        text: "Diff <code>config-a.txt</code> against <code>config-b.txt</code>, saving the result to <code>lab13/config-diff.txt</code>",
        check: (ctx) => match(ctx, "lab13/config-diff.txt", /^2c2$/m) && match(ctx, "lab13/config-diff.txt", /^4c4$/m),
      },
      {
        text: "Confirm <code>identical-a.txt</code> and <code>identical-b.txt</code> match with <code>cmp</code>, then record it: write <code>IDENTICAL</code> into <code>lab13/identical-result.txt</code>",
        check: (ctx) => match(ctx, "lab13/identical-result.txt", /^IDENTICAL$/m),
      },
      {
        text: "Use <code>cmp</code> to find exactly where <code>report-v1.txt</code> and <code>report-v2.txt</code> first differ, saving its message to <code>lab13/report-cmp.txt</code>",
        check: (ctx) => match(ctx, "lab13/report-cmp.txt", /differ: byte \d+, line 1/),
      },
      {
        text: "Diff the two reports as well, saving that to <code>lab13/report-diff.txt</code>",
        check: (ctx) => match(ctx, "lab13/report-diff.txt", /^1c1$/m) && match(ctx, "lab13/report-diff.txt", /steady/) && match(ctx, "lab13/report-diff.txt", /strong/),
      },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab13");
      fs.writeFile(HOME + "/lab13/config-a.txt", "host=localhost\nport=8080\ndebug=false\ntimeout=30\n");
      fs.writeFile(HOME + "/lab13/config-b.txt", "host=localhost\nport=9090\ndebug=false\ntimeout=45\n");
      fs.writeFile(HOME + "/lab13/identical-a.txt", "checksum: 8f14e45\nstatus: ok\n");
      fs.writeFile(HOME + "/lab13/identical-b.txt", "checksum: 8f14e45\nstatus: ok\n");
      fs.writeFile(HOME + "/lab13/report-v1.txt", "Q3 revenue was steady across all regions.\n");
      fs.writeFile(HOME + "/lab13/report-v2.txt", "Q3 revenue was strong across all regions.\n");
    },
    hints: [
      "Task 2: <code>cmp lab13/identical-a.txt lab13/identical-b.txt</code> prints nothing when files match — that silence <em>is</em> the confirmation.",
      "Task 3: <code>cmp lab13/report-v1.txt lab13/report-v2.txt &gt; lab13/report-cmp.txt</code>.",
      "Redirecting a command's output still works even when the command prints an error to stderr instead of stdout — check which stream <code>cmp</code>'s message actually goes to if task 3 comes back empty.",
    ],
    solution: [
      "mkdir -p lab13",
      "diff lab13/config-a.txt lab13/config-b.txt > lab13/config-diff.txt",
      "cmp lab13/identical-a.txt lab13/identical-b.txt",
      "echo IDENTICAL > lab13/identical-result.txt",
      "cmp lab13/report-v1.txt lab13/report-v2.txt > lab13/report-cmp.txt 2>&1",
      "diff lab13/report-v1.txt lab13/report-v2.txt > lab13/report-diff.txt",
    ],
  },
  {
    id: 14,
    title: "Change file ownership",
    sub: "chown · sudo",
    intro:
      "Permission bits (<code>chmod</code>) say what the owner, group and everyone else may do. Ownership itself — who the owner and group <em>are</em> — is a separate question, and only <code>chown</code>, run as root, can change it.",
    body: [
      {
        h: "Two different questions",
        p: "<code>chmod</code> changes what is allowed. <code>chown</code> changes who the rules apply to. A file can be wide open (<code>777</code>) and still belong to the wrong person.",
        cmds: [c("ls -l lab14/site", "owner and group columns, before anything changes")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Reassigning it",
        p: "<code>chown newowner file</code> changes the owner alone. <code>chown newowner:newgroup file</code> changes both in one call. Neither works unless you're root.",
        cmds: [c("chown labex lab14/site/index.html", "refused"), c("sudo chown labex lab14/site/index.html", "succeeds"), c("sudo chown labex:www-data lab14/site/index.html", "owner and group together")],
        refs: [{ label: "chown(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chown.1.html" }],
      },
    ],
    tree: "lab14/\n└── site/\n    ├── index.html   (owned by www-data:www-data)\n    └── counter.log  (owned by www-data:www-data)",
    tasks: [
      {
        text: "<code>lab14/site/index.html</code> was left owned by <code>www-data</code>. Hand both the owner and the group back to <code>labex</code>",
        check: (ctx) => owner(ctx, "lab14/site/index.html") === "labex" && group(ctx, "lab14/site/index.html") === "labex",
      },
      {
        text: "<code>lab14/site/counter.log</code> should become yours too, but leave its group as <code>www-data</code> — the web server still writes to it",
        check: (ctx) => owner(ctx, "lab14/site/counter.log") === "labex" && group(ctx, "lab14/site/counter.log") === "www-data",
      },
      {
        text: "Save a long listing of <code>lab14/site</code> confirming both changes to <code>lab14/ownership.txt</code>",
        check: (ctx) =>
          match(ctx, "lab14/ownership.txt", /index\.html/) &&
          match(ctx, "lab14/ownership.txt", /counter\.log/) &&
          match(ctx, "lab14/ownership.txt", /labex\s+www-data/),
      },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab14/site");
      fs.writeFile(HOME + "/lab14/site/index.html", "<html>hello</html>\n");
      fs.writeFile(HOME + "/lab14/site/counter.log", "hits: 482\n");
      for (const p of ["index.html", "counter.log"]) {
        const n = fs.getNode(HOME + "/lab14/site/" + p, false);
        if (n) {
          n.owner = "www-data";
          n.group = "www-data";
        }
      }
    },
    hints: [
      "Task 1: <code>sudo chown labex:labex lab14/site/index.html</code> — plain <code>chown</code> as <code>labex</code> is refused, this needs <code>sudo</code>.",
      "Task 2: give only the user, not the group — <code>sudo chown labex lab14/site/counter.log</code>.",
      "Task 3: <code>ls -l lab14/site &gt; lab14/ownership.txt</code>.",
    ],
    solution: [
      "sudo chown labex:labex lab14/site/index.html",
      "sudo chown labex lab14/site/counter.log",
      "ls -l lab14/site > lab14/ownership.txt",
    ],
  },
  {
    id: 15,
    title: "User account management",
    sub: "useradd · usermod · sudo · passwd",
    intro: "Creating an account, putting it in the right groups, and giving it a password — the three steps every new teammate needs, and every one of them requires root.",
    body: [
      {
        h: "Creating an account",
        p: "<code>useradd -m -s /bin/bash NAME</code> creates the passwd/group entries and, with <code>-m</code>, a home directory. Without root it refuses outright.",
        cmds: [c("useradd newhire", "refused"), c("sudo useradd -m -s /bin/bash newhire", "succeeds"), c("id newhire", "")],
        refs: [{ label: "useradd(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/useradd.8.html" }],
      },
      {
        h: "Adjusting an existing account",
        p: "<code>usermod -aG GROUP NAME</code> <strong>a</strong>ppends a supplementary group without disturbing the others — leaving off <code>-a</code> is a classic way to accidentally wipe someone's group list.",
        cmds: [c("sudo usermod -aG sudo newhire", ""), c("groups newhire", "")],
        refs: [{ label: "usermod(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/usermod.8.html" }],
      },
      {
        h: "Setting a password",
        p: "A freshly created account is locked — no password at all. <code>passwd NAME</code>, run as root, sets one.",
        cmds: [c("sudo passwd newhire", "")],
        refs: [{ label: "passwd(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/passwd.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Create a user <code>devops</code> with a home directory and the <code>bash</code> shell",
        check: (ctx) => !!passwdEntry(ctx, "devops") && dir(ctx, "/home/devops"),
      },
      { text: "Add <code>devops</code> to the <code>sudo</code> group without disturbing anything else", check: (ctx) => inGroup(ctx, "devops", "sudo") },
      {
        text: "Change <code>devops</code>'s shell to <code>/bin/sh</code>",
        check: (ctx) => {
          const e = passwdEntry(ctx, "devops");
          return !!e && e.shell === "/bin/sh";
        },
      },
      { text: "Set a password for <code>devops</code>", check: (ctx) => shadowUnlocked(ctx, "devops") },
      { text: "Save <code>devops</code>'s <code>/etc/passwd</code> line to <code>lab15/devops.txt</code>", check: (ctx) => match(ctx, "lab15/devops.txt", /^devops:/) },
    ],
    hints: [
      "Every account-management command in this lab needs <code>sudo</code> in front of it.",
      "Task 2: <code>sudo usermod -aG sudo devops</code> — the <code>a</code> in <code>-aG</code> is what keeps this additive.",
      "Task 3: <code>sudo usermod -s /bin/sh devops</code>.",
    ],
    solution: [
      "sudo useradd -m -s /bin/bash devops",
      "sudo usermod -aG sudo devops",
      "sudo usermod -s /bin/sh devops",
      "sudo passwd devops",
      "mkdir -p lab15",
      "grep '^devops:' /etc/passwd > lab15/devops.txt",
    ],
  },
  {
    id: 16,
    title: "The Joker's Trick",
    sub: "useradd · id · cmp · chmod · sudo — closing case",
    intro:
      "Someone calling themselves \"the Joker\" left a trail through the case files: a duplicated alibi meant to frame an innocent name, a note hidden in plain sight, and a final clue locked down to mode <code>000</code> — not even its owner can read it without fixing that first. Everything from the last five labs gets used here.",
    body: [
      {
        h: "Setting up as investigator",
        p: "Create your own account for the record before you touch the evidence.",
        cmds: [c("sudo useradd -m -s /bin/bash detective", ""), c("id detective", "")],
        refs: [{ label: "useradd(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/useradd.8.html" }],
      },
      {
        h: "Zero means zero",
        p: "Mode <code>000</code> grants nobody anything — not even root's usual free pass on ordinary permission bits, since <code>chmod</code> and <code>chown</code> are privileged operations in their own right, unaffected by a file's own mode. <code>sudo chmod</code> can still repair it; only reading the content is blocked by <code>000</code> itself, and even root respects that until the mode changes.",
        cmds: [c("sudo chmod 644 somefile", "root can always repair a mode, even 000")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
    ],
    tree:
      "lab16/\n├── .joker-note.txt   (hidden — ls -a)\n├── alibi-hale.txt\n├── alibi-quinn.txt\n├── alibi-reyes.txt\n└── vault/\n    └── final-clue.txt   (mode 000, owned by root)",
    tasks: [
      {
        text: "Create yourself an investigator account, <code>detective</code>, with a home directory",
        check: (ctx) => !!passwdEntry(ctx, "detective") && dir(ctx, "/home/detective"),
      },
      { text: "Confirm the new identity by saving <code>id detective</code>'s output to <code>lab16/detective-id.txt</code>", check: (ctx) => match(ctx, "lab16/detective-id.txt", /uid=\d+\(detective\)/) },
      {
        text: "There's a hidden note in <code>lab16/</code> that plain <code>ls</code> won't show. Copy its contents into <code>lab16/note.txt</code>",
        check: (ctx) => match(ctx, "lab16/note.txt", /gardener/),
      },
      {
        text: "Two of the three alibi letters in <code>lab16/</code> are byte-for-byte identical — a forged copy. Find that pair with <code>cmp</code> and name both files in <code>lab16/forged-pair.txt</code>",
        check: (ctx) => match(ctx, "lab16/forged-pair.txt", /alibi-hale\.txt/) && match(ctx, "lab16/forged-pair.txt", /alibi-reyes\.txt/),
      },
      {
        text: "<code>lab16/vault/final-clue.txt</code> has mode <code>000</code>. Open it up (mode <code>644</code>, as root) and save its contents to <code>lab16/solution.txt</code>",
        check: (ctx) => mode(ctx, "lab16/vault/final-clue.txt") === "644" && match(ctx, "lab16/solution.txt", /joker/i),
      },
    ],
    setup: (fs) => {
      fs.mkdirp(HOME + "/lab16/vault");
      fs.writeFile(HOME + "/lab16/.joker-note.txt", "Ask yourself who benefits from the gardener taking the blame.\n");
      fs.writeFile(HOME + "/lab16/alibi-hale.txt", "I was in the reading room from nine until half past, ask the clerk.\n");
      fs.writeFile(HOME + "/lab16/alibi-quinn.txt", "I never left the garden that whole morning, the roses needed tying.\n");
      fs.writeFile(HOME + "/lab16/alibi-reyes.txt", "I was in the reading room from nine until half past, ask the clerk.\n");
      fs.writeFile(HOME + "/lab16/vault/final-clue.txt", "The joker was never a suspect — the joker was the pen name on the manuscript itself.\n");
      const v = fs.getNode(HOME + "/lab16/vault/final-clue.txt", false);
      if (v) {
        v.owner = "root";
        v.group = "root";
        v.mode = "000";
      }
    },
    hints: [
      "Task 3: <code>ls -a lab16</code> reveals it — a leading dot only hides a file from plain <code>ls</code>, nothing more.",
      "Task 4: <code>cmp alibi-hale.txt alibi-quinn.txt</code>, then <code>cmp alibi-hale.txt alibi-reyes.txt</code> — silence marks the forged pair.",
      "Task 5: <code>sudo chmod 644 lab16/vault/final-clue.txt</code> before you can <code>cat</code> it at all.",
    ],
    solution: [
      "sudo useradd -m -s /bin/bash detective",
      "id detective > lab16/detective-id.txt",
      "cat lab16/.joker-note.txt > lab16/note.txt",
      "cmp lab16/alibi-hale.txt lab16/alibi-reyes.txt",
      "printf 'alibi-hale.txt\\nalibi-reyes.txt\\n' > lab16/forged-pair.txt",
      "sudo chmod 644 lab16/vault/final-clue.txt",
      "cat lab16/vault/final-clue.txt > lab16/solution.txt",
    ],
  },
];

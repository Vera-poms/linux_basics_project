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
      "Picture your computer as a big building. Rooms are <strong>directories</strong> (folders), and rooms can hold other rooms and <strong>files</strong>. The terminal is a text window where you tell the computer what to do by typing a <strong>command</strong> and pressing <strong>Enter</strong>. Before anything else you need to know two things: <strong>which room you are standing in</strong> and <strong>what is inside it</strong>. This lab teaches the three tiny commands that answer those questions. Tip: you can click any command in the lists below and it will type and run itself in the terminal on the right.",
    body: [
      {
        h: "Where am I?",
        p: "The terminal is always &quot;standing&quot; in one directory. That is called the <strong>current directory</strong> (or working directory). The command <code>pwd</code> stands for <em>print working directory</em>: it prints the full address of the room you are in.<br><br><strong>Word by word:</strong> <code>pwd</code> is the command. It needs nothing after it.<br><strong>What you will see:</strong> <code>/home/labex</code>. That address is a <strong>path</strong>. Read it left to right: begin at the very top of the building (<code>/</code>, called the <em>root</em>), go into <code>home</code>, then into <code>labex</code>. This place is your <strong>home directory</strong>, your own personal space, and it is where you start. In the prompt on the right, the symbol <code>~</code> is a shortcut that means &quot;my home directory&quot;.<br><strong>If it goes wrong:</strong> <code>pwd</code> cannot fail. If you see a different path, you have moved (that is fine, see &quot;Moving&quot; below).",
        cmds: [c("pwd", "print working directory")],
        refs: [{ label: "pwd(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/pwd.1.html" }],
      },
      {
        h: "What is here?",
        p: "<code>ls</code> (short for <em>list</em>) shows what is inside the current directory. You can change how it shows things by adding a <strong>flag</strong>: a dash followed by a letter, such as <code>-l</code>. A flag is like a setting on a machine. Try each command below and compare the outputs.<br><br><strong>Word by word:</strong><br><code>ls</code> — the command, on its own it prints just the names.<br><code>-l</code> — <em>long</em> format. One line per item showing permissions, owner, size and date. (You will learn what permissions are in Lab 7.)<br><code>-a</code> — <em>all</em>. Includes hidden items. Items whose name starts with a dot, like <code>.bashrc</code>, are hidden from a plain <code>ls</code>.<br><code>-h</code> — <em>human-readable</em>. It only makes a difference together with <code>-l</code>; it turns sizes like <code>4096</code> into <code>4.0K</code>.<br><code>-la</code> — two flags combined into one. Order does not matter.<br><code>/etc</code> — an <strong>argument</strong>: which directory to look at. Without one, <code>ls</code> looks at the current directory.<br><br><strong>If it goes wrong:</strong> &quot;No such file or directory&quot; means you mistyped the path. Check spelling and capital letters: Linux treats <code>Etc</code> and <code>etc</code> as different names.",
        cmds: [
          c("ls", "just the names"),
          c("ls -l", "long: permissions, owner, size, date"),
          c("ls -a", "include hidden entries (names starting with a dot)"),
          c("ls -la", "both together — you will type this one the most"),
          c("ls -lh", "sizes as 4.0K instead of 4096"),
          c("ls -l /etc", "look inside a different directory"),
        ],
        refs: [
          { label: "ls(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/ls.1.html" },
          { label: "GNU Coreutils: ls invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/ls-invocation.html" },
        ],
      },
      {
        h: "Moving",
        p: "<code>cd</code> stands for <em>change directory</em>: it walks you into another room. There are two ways to write where you want to go.<br><br><strong>Absolute path</strong> — a full address that starts with <code>/</code>. It works from anywhere, like giving a street address with the city included. Example: <code>cd /etc</code>.<br><strong>Relative path</strong> — directions starting from where you are now, like &quot;the second door on the left&quot;. Example: <code>cd webapp</code> only works if a <code>webapp</code> folder is right here.<br><br><strong>Shortcuts:</strong><br><code>..</code> means &quot;the directory above this one&quot;, so <code>cd ..</code> steps up one level.<br><code>~</code> means your home directory, and <code>cd</code> with nothing after it also takes you home.<br><br><strong>Tip:</strong> run <code>pwd</code> after every <code>cd</code> until you are comfortable. The terminal says nothing when <code>cd</code> works, which is normal.",
        cmds: [
          c("cd /etc", "go to /etc (absolute path)"),
          c("pwd", "confirm where you are"),
          c("cd ..", "up one level"),
          c("cd ~", "back home"),
          c("cd", "home as well, with no argument"),
        ],
        refs: [{ label: "cd — Bash Reference Manual: Bourne Shell Builtins", url: "https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html" }],
      },
      {
        h: "Sending output into a file",
        p: "Normally a command prints its result on the screen. The <strong>redirect</strong> symbol <code>&gt;</code> is like an arrow that says &quot;put the result <em>into this file</em> instead&quot;. If the file does not exist it is created.<br><br><strong>Word by word:</strong> in <code>ls /etc &gt; /tmp/demo.txt</code>, <code>ls /etc</code> is the command, <code>&gt;</code> is the arrow, and <code>/tmp/demo.txt</code> is the file that receives the result. Nothing appears on screen, which means it worked.<br><code>cat</code> (short for <em>concatenate</em>, but you can just think &quot;show&quot;) prints a file so you can read it back.<br><br><strong>Warning:</strong> if the file already exists, <code>&gt;</code> replaces everything in it. You will learn the safer alternative in Lab 2.",
        cmds: [c("ls /etc > /tmp/demo.txt", "save the list into a file"), c("cat /tmp/demo.txt", "read the file back")],
        refs: [{ label: "bash(1) — Debian manpages: REDIRECTION", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#REDIRECTION" }],
      },
    ],
    tasks: [
      { text: "Make a new folder called <code>lab01</code>. Type <code>mkdir lab01</code> and press Enter.", hint: "<strong>What this does:</strong> <code>mkdir</code> means <em>make directory</em>, and <code>lab01</code> is the name you choose. <strong>You succeed when:</strong> the terminal prints nothing and this box ticks. Check with <code>ls</code>: you should see <code>lab01</code> in the list. <strong>Common mistake:</strong> a space or capital letter (<code>Lab01</code>, <code>lab 01</code>). Names are case sensitive, and a space makes Linux think you gave two names.", check: (ctx) => dir(ctx, "lab01") },
      {
        text: "Save the location of your home folder into a file. Type <code>pwd &gt; lab01/where.txt</code> (if you are not sure you are in your home folder, type <code>cd ~</code> first).", hint: "<strong>What this does:</strong> <code>pwd</code> prints your location, and <code>&gt;</code> sends that text into the file <code>lab01/where.txt</code> (the <code>/</code> means &quot;inside the folder lab01&quot;). <strong>You succeed when:</strong> <code>cat lab01/where.txt</code> shows <code>/home/labex</code>. <strong>Common mistake:</strong> running it from the wrong place. Type <code>cd ~</code> first to be safe, and make sure Task 1 is done, because <code>&gt;</code> cannot create a missing folder.",
        check: (ctx) => match(ctx, "lab01/where.txt", /\/home\/labex/),
      },
      {
        text: "Save a detailed list of everything in the <code>/etc</code> folder into a file. Type <code>ls -lh /etc &gt; lab01/etc-listing.txt</code>", hint: "<strong>What this does:</strong> <code>ls -lh /etc</code> lists the <code>/etc</code> folder in long format (<code>-l</code>) with readable sizes (<code>-h</code>). The <code>&gt;</code> saves that list into your file instead of printing it. <strong>You succeed when:</strong> <code>cat lab01/etc-listing.txt</code> shows lines starting like <code>-rw-r--r--</code>. <strong>Common mistake:</strong> writing <code>-l -h</code> as separate pieces is fine too, but forgetting <code>/etc</code> lists your own folder instead.",
        check: (ctx) =>
          match(ctx, "lab01/etc-listing.txt", /^[-dl]rw[-x]/m) &&
          match(ctx, "lab01/etc-listing.txt", /passwd/) &&
          match(ctx, "lab01/etc-listing.txt", /\d+(\.\d)?K|\b\d{3,}\b/),
      },
      {
        text: "Count how many items are inside <code>/usr/bin</code> and save just the number. Type <code>ls /usr/bin | wc -l &gt; lab01/bin-count.txt</code>", hint: "<strong>What this does:</strong> <code>ls /usr/bin</code> prints one name per line when its output is going into a pipe. The pipe <code>|</code> (typed with Shift + the backslash key) hands that list to <code>wc -l</code> (<em>word count, lines</em>), which counts the lines. So the result is the number of items. The <code>&gt;</code> saves it. <strong>You succeed when:</strong> <code>cat lab01/bin-count.txt</code> shows just a number. <strong>Common mistake:</strong> typing a lowercase letter L versus the digit 1 in <code>-l</code>.",
        check: (ctx) => {
          const t = read(ctx, "lab01/bin-count.txt");
          return t !== null && new RegExp("^\\s*" + USR_BIN.length + "\\s*$").test(t.trim());
        },
      },
    ],
    solution: ["cd ~", "mkdir lab01", "pwd > lab01/where.txt", "ls -lh /etc > lab01/etc-listing.txt", "ls /usr/bin | wc -l > lab01/bin-count.txt"],
  },
  {
    id: 2,
    title: "Make and read files",
    sub: "touch · echo · cat · head · tail · wc",
    intro:
      "A <strong>file</strong> is a named container for text or data. Making files, adding lines to them, and reading parts of them back is most of what you will do in a terminal. In this lab you will create files two ways, learn the one difference between <code>&gt;</code> and <code>&gt;&gt;</code> that trips up nearly every beginner, and read files without opening an editor.",
    body: [
      {
        h: "Creating files",
        p: "<code>touch</code> creates an empty file (a blank sheet of paper). To create a file <em>with</em> text in it, use <code>echo</code>, which simply repeats what you give it, and point it at a file with an arrow.<br><br><strong>Word by word:</strong> in <code>echo &quot;hello&quot; &gt; greet.txt</code>: <code>echo</code> is the command; <code>&quot;hello&quot;</code> is the text (quotes keep it together as one piece); <code>&gt;</code> is the arrow; <code>greet.txt</code> is the file.<br>Adding a second arrow, <code>&gt;&gt;</code>, means &quot;add to the end&quot; instead of replacing.<br><strong>You will see:</strong> nothing on screen when the commands work. Use <code>cat greet.txt</code> to look inside.",
        cmds: [
          c("touch empty.txt", "make an empty file"),
          c('echo "hello" > greet.txt', "> writes, replacing everything"),
          c('echo "again" >> greet.txt', ">> adds one line at the end"),
          c("cat greet.txt", "show the file"),
        ],
        refs: [
          { label: "touch(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/touch.1.html" },
          { label: "bash(1) — Debian manpages: REDIRECTION", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#REDIRECTION" },
        ],
      },
      {
        h: "The difference that costs people data",
        p: "Imagine a notebook. <code>&gt;</code> is <strong>tearing out every page and starting a fresh one</strong> before writing. <code>&gt;&gt;</code> is <strong>writing on the next empty line</strong> and keeping what is already there.<br><br>Run <code>echo one &gt; a.txt</code> twice and the file holds one line. Run <code>echo one &gt;&gt; a.txt</code> twice and it holds two.",
        aside: "When you are not certain, use <code>&gt;&gt;</code>. An extra line is easy to fix. An overwritten file is gone for good.",
      },
      {
        h: "Reading files",
        p: "You can look at a file without opening it in an editor.<br><br><code>cat FILE</code> — prints the whole file.<br><code>cat -n FILE</code> — the same, with a line number at the start of every line.<br><code>head -n 3 FILE</code> — only the first 3 lines (<code>-n</code> means &quot;number of lines&quot;; you choose the number).<br><code>tail -n 2 FILE</code> — only the last 2 lines.<br><code>wc -l FILE</code> — <em>word count</em> with <code>-l</code> for lines: how many lines are in the file. It prints the number <em>and</em> the file name.<br><code>wc -l &lt; FILE</code> — the <code>&lt;</code> feeds the file in from the other side, so <code>wc</code> has no file name to print and shows only the number.<br><br><strong>Try it:</strong> click each command and compare the output with the note beside it.",
        cmds: [
          c("cat /etc/hosts", "whole file"),
          c("cat -n /etc/passwd", "with line numbers"),
          c("head -n 3 /etc/passwd", "first 3 lines"),
          c("tail -n 2 /etc/passwd", "last 2 lines"),
          c("wc -l /etc/passwd", "count lines, shows the name too"),
          c("wc -l < /etc/passwd", "same count, number only"),
        ],
        refs: [
          { label: "cat(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cat.1.html" },
          { label: "head(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/head.1.html" },
          { label: "tail(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tail.1.html" },
          { label: "wc(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/wc.1.html" },
        ],
      },
      {
        h: "Several lines at once (optional)",
        p: "A <strong>heredoc</strong> lets you type many lines in one go. You type the command, press Enter, and the prompt changes to <code>&gt;</code> while the terminal collects lines. It stops when you type the marker word (<code>EOF</code>) alone on a line. You can finish every task in this lab with plain <code>echo</code> commands, so skip this if it feels confusing.",
        cmds: [c("cat > demo.txt <<'EOF'", "then type lines, then EOF on its own line")],
        refs: [{ label: "bash(1) — Debian manpages: REDIRECTION (Here Documents)", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#REDIRECTION" }],
      },
    ],
    tasks: [
      {
        text: "Make a folder called <code>lab02</code> and a file <code>notes.txt</code> inside it with the three lines from &quot;The brief&quot; below. Type these one at a time, pressing Enter after each:<br>1. <code>mkdir lab02</code><br>2. <code>echo \"Linux is a kernel\" &gt; lab02/notes.txt</code><br>3. <code>echo \"Bash is a shell\" &gt;&gt; lab02/notes.txt</code><br>4. <code>echo \"Everything is a file\" &gt;&gt; lab02/notes.txt</code>", hint: "<strong>What this does:</strong> the first <code>echo</code> uses one arrow to create the file with line 1. The next two use <code>&gt;&gt;</code> to add lines 2 and 3. <strong>You succeed when:</strong> <code>cat lab02/notes.txt</code> prints exactly three lines. <strong>Common mistake:</strong> using one arrow for all three, which leaves only the last line. If that happens just start again from the first command.",
        check: (ctx) =>
          dir(ctx, "lab02") &&
          match(ctx, "lab02/notes.txt", /^Linux is a kernel$/m) &&
          match(ctx, "lab02/notes.txt", /^Bash is a shell$/m) &&
          match(ctx, "lab02/notes.txt", /^Everything is a file$/m),
      },
      {
        text: "Add a 4th line to the same file. Type <code>echo \"Paths are case sensitive\" &gt;&gt; lab02/notes.txt</code> — use two arrows <code>&gt;&gt;</code>. One arrow would erase the file.", hint: "<strong>What this does:</strong> <code>&gt;&gt;</code> adds a 4th line at the end. <strong>You succeed when:</strong> <code>cat lab02/notes.txt</code> shows four lines and Task 1 still ticks. <strong>Common mistake:</strong> using <code>&gt;</code>. That wipes the file and Task 1 turns unticked. Redo Task 1, then this one.",
        check: (ctx) => match(ctx, "lab02/notes.txt", /^Paths are case sensitive$/m) && nlines(ctx, "lab02/notes.txt") === 4,
      },
      {
        text: "Copy the first 10 lines of <code>/etc/passwd</code> into a new file. Type <code>head -n 10 /etc/passwd &gt; lab02/users-head.txt</code>", hint: "<strong>What this does:</strong> <code>head -n 10</code> prints the first 10 lines of <code>/etc/passwd</code> (the system's list of user accounts), and <code>&gt;</code> saves them. <strong>You succeed when:</strong> <code>wc -l lab02/users-head.txt</code> prints <code>10</code>. <strong>Common mistake:</strong> a typo in the path. It must be <code>/etc/passwd</code> with the leading slash.",
        check: (ctx) => nlines(ctx, "lab02/users-head.txt") === 10 && match(ctx, "lab02/users-head.txt", /^root:/m),
      },
      {
        text: "Count the lines in <code>/etc/passwd</code> and save only the number. Type <code>wc -l &lt; /etc/passwd &gt; lab02/users-count.txt</code>", hint: "<strong>What this does:</strong> <code>wc -l &lt; /etc/passwd</code> counts the lines and, because the file comes in through <code>&lt;</code>, prints only the number. The final <code>&gt;</code> saves it. <strong>You succeed when:</strong> <code>cat lab02/users-count.txt</code> shows just a number with no file name after it. <strong>Common mistake:</strong> using <code>wc -l /etc/passwd</code>, whose output includes the file name and fails the check.",
        check: (ctx) => {
          const t = read(ctx, "lab02/users-count.txt");
          return t !== null && new RegExp("^\\s*" + lines(PASSWD).length + "\\s*$").test(t.trim());
        },
      },
    ],
    brief: "Linux is a kernel\nBash is a shell\nEverything is a file",
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
    intro: "When you start a new project, the first job is creating its folders and starting files. Doing that one folder at a time is slow, so this lab teaches shortcuts that build a whole project layout with a few commands. Think of it as drawing the floor plan of a building in one go.",
    body: [
      {
        h: "Parents for free",
        p: "Normally <code>mkdir</code> creates one folder, and fails if the folder that should contain it does not exist yet. Adding the flag <code>-p</code> (think <em>parents</em>) tells it to build every missing folder along the way. It also stays quiet if the folder already exists, so it is safe to run again.<br><br><strong>Word by word:</strong> in <code>mkdir -p demo/src/components</code>, <code>demo/src/components</code> is a path with three levels: a folder <code>demo</code>, containing <code>src</code>, containing <code>components</code>. <code>-p</code> builds all three at once.<br><strong>You will see:</strong> no output. Run <code>tree demo</code> to draw a picture of the folders.<br><strong>If it fails:</strong> &quot;No such file or directory&quot; means you left out <code>-p</code>.",
        cmds: [
          c("mkdir -p demo/src/components", "three levels, one command"),
          c("mkdir -p demo/src/components", "run it twice — no error"),
          c("tree demo", "draw the folders"),
        ],
        refs: [
          { label: "mkdir(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/mkdir.1.html" },
        ],
      },
      {
        h: "Brace expansion — a typing shortcut",
        p: "Curly brackets with commas inside, like <code>{css,js,img}</code>, are a shortcut the shell expands <em>before</em> the command runs. It is like a copy machine: <code>site/{css,js,img}</code> becomes three separate paths, <code>site/css site/js site/img</code>. The command <code>mkdir -p site/{css,js,img}</code> therefore makes three folders inside <code>site</code>.<br><br>You can put brackets inside brackets: <code>app/{src/{lib,ui},tests}</code> makes <code>app/src/lib</code>, <code>app/src/ui</code> and <code>app/tests</code>.<br><strong>Careful:</strong> no spaces inside the brackets, and every <code>{</code> needs a matching <code>}</code>.",
        cmds: [
          c("mkdir -p site/{css,js,img}", "three folders at once"),
          c("tree site", "see them"),
          c("mkdir -p app/{src/{lib,ui},tests}", "brackets inside brackets"),
          c("tree app", "see them"),
        ],
        refs: [{ label: "bash(1) — Debian manpages: EXPANSION (Brace Expansion)", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#EXPANSION" }],
      },
      {
        h: "Seeing what you built",
        p: "<code>tree</code> draws your folders and files as an upside-down tree, with lines showing what is inside what. Add <code>-a</code> (<em>all</em>) to include hidden files that start with a dot, such as <code>.gitignore</code>. Without a tree tool you can use <code>ls -R</code>, where <code>-R</code> means <em>recursive</em>: list this folder and everything under it.",
        cmds: [c("tree -a site", "draw it, hidden files included"), c("ls -R site", "the same idea using ls")],
        refs: [{ label: "tree(1) — Debian manpages", url: "https://manpages.debian.org/bookworm/tree/tree.1.en.html" }],
      },
    ],
    tasks: [
      {
        text: "Create every folder of the <code>webapp</code> project with a single command. Type <code>mkdir -p webapp/{src/{css,js},assets/{images,fonts},tests,docs}</code> (copy it exactly, including the curly brackets).", hint: "<strong>What this does:</strong> one <code>mkdir -p</code> plus curly brackets builds nine folders. Brackets inside brackets mean &quot;inside <code>src</code> make <code>css</code> and <code>js</code>, inside <code>assets</code> make <code>images</code> and <code>fonts</code>&quot;. <strong>You succeed when:</strong> <code>tree webapp</code> shows the folder shape from &quot;Build this&quot;. <strong>Common mistake:</strong> adding a space after a comma, which splits the command in two. Copy it exactly.",
        check: (ctx) =>
          ["webapp", "webapp/src", "webapp/src/css", "webapp/src/js", "webapp/assets", "webapp/assets/images", "webapp/assets/fonts", "webapp/tests", "webapp/docs"].every((p) => dir(ctx, p)),
      },
      {
        text: "Create three empty files. Type <code>touch webapp/src/index.html webapp/src/css/style.css webapp/src/js/main.js</code>", hint: "<strong>What this does:</strong> <code>touch</code> makes empty files, and it accepts several names at once. <strong>You succeed when:</strong> <code>ls webapp/src</code> shows <code>index.html</code>, <code>css</code>, <code>js</code>. <strong>Common mistake:</strong> the folders must exist first, so finish Task 1.",
        check: (ctx) => ["webapp/src/index.html", "webapp/src/css/style.css", "webapp/src/js/main.js"].every((p) => isFile(ctx, p)),
      },
      { text: "Make a README file whose first line is <code># WebApp</code>. Type <code>echo \"# WebApp\" &gt; webapp/README.md</code>", hint: "<strong>What this does:</strong> <code>echo &quot;# WebApp&quot;</code> repeats the text, and <code>&gt;</code> saves it into <code>README.md</code>. The quotes matter here, since without them the <code>#</code> starts a comment and the text is lost. <strong>You succeed when:</strong> <code>cat webapp/README.md</code> prints <code># WebApp</code>.", check: (ctx) => match(ctx, "webapp/README.md", /^# WebApp/) },
      { text: "Make a <code>.gitignore</code> file containing <code>node_modules/</code>. Type <code>echo \"node_modules/\" &gt; webapp/.gitignore</code>", hint: "<strong>What this does:</strong> creates a hidden file (its name starts with a dot). <code>.gitignore</code> is a file that Git projects use to list what not to track. <strong>You succeed when:</strong> <code>ls -a webapp</code> shows <code>.gitignore</code> (a plain <code>ls</code> will not). <strong>Common mistake:</strong> leaving off the slash in <code>node_modules/</code>. The check wants it.", check: (ctx) => match(ctx, "webapp/.gitignore", /^node_modules\/$/m) },
      { text: "Make a setup file that mentions Installation. Type <code>echo \"Installation\" &gt; webapp/docs/setup.md</code>", hint: "<strong>What this does:</strong> puts the word Installation into <code>docs/setup.md</code>. <strong>You succeed when:</strong> <code>cat webapp/docs/setup.md</code> shows it. Any text containing the word Installation is accepted.", check: (ctx) => match(ctx, "webapp/docs/setup.md", /Installation/) },
    ],
    tree: "webapp/\n├── .gitignore\n├── README.md\n├── src/\n│   ├── index.html\n│   ├── css/style.css\n│   └── js/main.js\n├── assets/\n│   ├── images/\n│   └── fonts/\n├── tests/\n└── docs/setup.md",
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
    intro: "You copy a file when you want two of it, move a file when you want it somewhere else, and rename it when you only want a new name. Surprisingly, Linux uses one command, <code>mv</code>, for moving and renaming, because renaming is just moving to a new name. Warning: <code>cp</code> and <code>mv</code> silently replace a file that is already there, with no &quot;are you sure?&quot;.",
    body: [
      {
        h: "Copying",
        p: "<code>cp SOURCE DESTINATION</code> makes a duplicate. The original stays where it was.<br><br><code>cp /etc/hosts hosts.bak</code> — copies one file to a new name in your current directory.<br><code>cp -r webapp demo-copy</code> — <code>-r</code> means <em>recursive</em>: copy a folder <em>and everything inside it</em>. Without <code>-r</code>, <code>cp</code> refuses to copy a folder and says so.<br><strong>You will see:</strong> nothing when it works. Check with <code>ls</code>.<br><strong>Needs Lab 3:</strong> the <code>webapp</code> folder comes from the previous lab.",
        cmds: [c("cp /etc/hosts hosts.bak", "copy a file"), c("cp -r webapp demo-copy", "copy a whole folder"), c("ls demo-copy", "look inside the copy")],
        refs: [{ label: "cp(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cp.1.html" }],
      },
      {
        h: "Moving and renaming",
        p: "<code>mv SOURCE DESTINATION</code> follows one rule: if <em>DESTINATION is a folder that already exists</em>, the file goes <em>into</em> it. Otherwise the file gets the <em>new name</em>.<br><br><code>mv hosts.bak hosts.old</code> — no folder called <code>hosts.old</code> exists, so this renames.<br><code>mkdir -p attic</code> — make a folder.<br><code>mv hosts.old attic/</code> — <code>attic</code> exists, so the file moves into it. The trailing slash makes the intent obvious.",
        cmds: [c("mv hosts.bak hosts.old", "rename"), c("mkdir -p attic", "make a folder"), c("mv hosts.old attic/", "move into it"), c("ls attic", "check")],
        refs: [{ label: "mv(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/mv.1.html" }],
      },
      {
        h: "Where it bites",
        p: "<code>cp -r webapp copy1</code> behaves differently depending on whether <code>copy1</code> already exists. If it does <em>not</em> exist, <code>copy1</code> becomes the copy. If it <em>does</em> exist, the copy lands <em>inside</em> it as <code>copy1/webapp</code>. Same command, two results, so always look afterwards.",
        aside: "Run <code>ls</code> right after every <code>cp -r</code> and <code>mv</code> until checking becomes automatic. It takes one second.",
      },
    ],
    tasks: [
      {
        text: "Make a full copy of the <code>webapp</code> folder called <code>webapp-backup</code>. Type <code>cp -r webapp webapp-backup</code> (<code>-r</code> means &quot;copy everything inside too&quot;).", hint: "<strong>What this does:</strong> <code>cp -r</code> copies a folder with all its contents. <code>webapp</code> is the source and <code>webapp-backup</code> is the new name. <strong>You succeed when:</strong> <code>ls webapp-backup</code> shows the same things as <code>ls webapp</code>. <strong>Common mistake:</strong> forgetting <code>-r</code>, which gives an error, or running it before Lab 3 built <code>webapp</code>.",
        check: (ctx) => dir(ctx, "webapp-backup") && has(ctx, "webapp-backup/README.md") && dir(ctx, "webapp-backup/src/css"),
      },
      {
        text: "Rename <code>main.js</code> to <code>app.js</code>. Type <code>mv webapp/src/js/main.js webapp/src/js/app.js</code>", hint: "<strong>What this does:</strong> <code>mv</code> with a new name in the same folder is a rename. <strong>You succeed when:</strong> <code>ls webapp/src/js</code> shows <code>app.js</code> and no <code>main.js</code>.",
        check: (ctx) => !has(ctx, "webapp/src/js/main.js") && (has(ctx, "webapp/src/js/app.js") || has(ctx, "webapp/src/scripts/app.js")),
      },
      {
        text: "Create two more files, make a new folder called <code>scripts</code>, then move all three files into it. Type these one at a time:<br>1. <code>touch webapp/src/js/utils.js webapp/src/js/api.js</code><br>2. <code>mkdir webapp/src/scripts</code><br>3. <code>mv webapp/src/js/*.js webapp/src/scripts/</code>", hint: "<strong>What this does:</strong> step 1 creates two files, step 2 makes the <code>scripts</code> folder, step 3 moves every <code>.js</code> file (the <code>*</code> means &quot;anything&quot;) into it. <strong>You succeed when:</strong> <code>ls webapp/src/scripts</code> shows <code>api.js app.js utils.js</code>. <strong>Common mistake:</strong> running step 3 before step 2. The folder must exist first or <code>mv</code> fails with an error.",
        check: (ctx) => ["app.js", "utils.js", "api.js"].every((f2) => has(ctx, "webapp/src/scripts/" + f2)),
      },
      {
        text: "The old <code>js</code> folder must still exist but be empty. Nothing new to type: if you did step 3 it is already empty. Check with <code>ls webapp/src/js</code> (it should print nothing). Do not delete the folder.", hint: "<strong>What this checks:</strong> the <code>js</code> folder must still exist and be empty. If step 3 of the previous task worked, it already is. <strong>You succeed when:</strong> <code>ls webapp/src/js</code> prints nothing at all and no error. <strong>Common mistake:</strong> deleting the folder. If you did, recreate it with <code>mkdir webapp/src/js</code>.",
        check: (ctx) => {
          const n = ctx.fs.getNode(ctx.fs.resolve("webapp/src/js", HOME));
          return !!n && n.t === "d" && Object.keys(n.children).length === 0;
        },
      },
      {
        text: "Copy the README into the <code>docs</code> folder and keep the original too. Type <code>cp webapp/README.md webapp/docs/</code>", hint: "<strong>What this does:</strong> <code>cp</code> (no <code>-r</code> needed for a single file) puts a copy of README.md into <code>docs</code>. The trailing slash says &quot;this is a folder&quot;. <strong>You succeed when:</strong> <code>ls webapp webapp/docs</code> shows README.md in both places. <strong>Common mistake:</strong> using <code>mv</code>, which removes the original.",
        check: (ctx) => has(ctx, "webapp/docs/README.md") && has(ctx, "webapp/README.md"),
      },
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
    intro: "<strong>There is no recycle bin.</strong> When <code>rm</code> deletes a file it is gone, and the terminal will not warn you. That sounds scary, but three small habits make deleting safe: look before you delete, use the gentlest command that works, and never let a stray space into a command. This lab has some junk files set up for you to practise on.",
    body: [
      {
        h: "The three commands",
        p: "<code>rm FILE</code> — <em>remove</em> a file.<br><code>rmdir FOLDER</code> — remove a folder, but <em>only if it is empty</em>. If it is not, <code>rmdir</code> refuses, which protects you.<br><code>rm -r FOLDER</code> — <code>-r</code> means <em>recursive</em>: delete the folder <em>and everything inside</em>. Powerful, so use it deliberately.<br><br><strong>You will see:</strong> nothing when a delete succeeds. Use <code>ls</code> to confirm.<br><strong>Try it:</strong> the first command shows what is in <code>lab05</code>, and the others practise on throwaway files.",
        cmds: [
          c("ls lab05", "see the junk that was set up"),
          c("rm lab05/junk.txt", "delete one file"),
          c("rmdir lab05/scratch-empty", "works only on an empty folder"),
          c("rm -r lab05/scratch", "folder plus everything inside"),
        ],
        refs: [
          { label: "rm(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/rm.1.html" },
          { label: "rmdir(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/rmdir.1.html" },
        ],
      },
      {
        h: "Look before you delete",
        p: "A <strong>glob</strong> is a pattern with a wildcard. <code>*</code> means &quot;any characters&quot;, so <code>*.tmp</code> means &quot;any name that ends in .tmp&quot;. The shell replaces the pattern with the matching names <em>before</em> the command runs.<br><br><strong>The safe habit:</strong> run <code>ls</code> with exactly the same pattern first. Whatever <code>ls</code> prints is exactly what <code>rm</code> would delete.<br>Note that <code>keep.tmp.txt</code> is <em>not</em> matched by <code>*.tmp</code>, because its name ends in <code>.txt</code>.",
        cmds: [c("ls lab05/*.tmp", "rehearse the pattern"), c("ls lab05/*.txt", "see which names match this one")],
        refs: [{ label: "bash(1) — Debian manpages: EXPANSION (Pathname Expansion)", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#EXPANSION" }],
        aside:
          "Habit two: never let a space slip into <code>rm -rf /path/to/dir</code>. A space would make <code>rm</code> treat <code>/path</code> as a separate target. Habit three: use <code>rmdir</code> whenever you believe a folder is empty. If it refuses, you were wrong and it just saved you.",
      },
    ],
    tasks: [
      { text: "Delete the three files whose names end in <code>.tmp</code>. First look at what will be deleted: <code>ls lab05/*.tmp</code>. If you see <code>a.tmp b.tmp c.tmp</code>, delete them with <code>rm lab05/*.tmp</code>", hint: "<strong>What this does:</strong> <code>ls lab05/*.tmp</code> only <em>shows</em> the matching files (a rehearsal). <code>rm lab05/*.tmp</code> deletes those same files. <strong>You succeed when:</strong> <code>ls lab05</code> no longer lists <code>a.tmp</code>, <code>b.tmp</code>, <code>c.tmp</code>. <strong>Common mistake:</strong> skipping the rehearsal. Always run <code>ls</code> first.", check: (ctx) => ["a.tmp", "b.tmp", "c.tmp"].every((f2) => !has(ctx, "lab05/" + f2)) },
      { text: "Do not delete <code>keep.tmp.txt</code>. Nothing to type: the command above does not touch it because its name does not end in <code>.tmp</code>.", hint: "<strong>What this checks:</strong> that you did not over-delete. The pattern <code>*.tmp</code> ends in exactly <code>.tmp</code>, so <code>keep.tmp.txt</code> is untouched. <strong>You succeed when:</strong> <code>ls lab05</code> still lists <code>keep.tmp.txt</code>. If it is gone, click <strong>Reset lab</strong> and start again.", check: (ctx) => has(ctx, "lab05/keep.tmp.txt") },
      { text: "Delete the <code>cache</code> folder and everything inside it. Type <code>rm -r lab05/cache</code>", hint: "<strong>What this does:</strong> <code>-r</code> deletes the folder and everything inside it, including sub-folders. <strong>You succeed when:</strong> <code>ls lab05</code> does not list <code>cache</code>. <strong>Common mistake:</strong> using <code>rmdir</code>. It refuses because the folder is not empty (that is <code>rmdir</code> protecting you).", check: (ctx) => !has(ctx, "lab05/cache") },
      { text: "Delete the empty folder called <code>empty</code>. Type <code>rmdir lab05/empty</code> (it only works on empty folders, which makes it safe).", hint: "<strong>What this does:</strong> <code>rmdir</code> deletes only empty folders, which is why it is the safest choice here. <strong>You succeed when:</strong> <code>empty</code> is gone from <code>ls lab05</code>. If you get &quot;Directory not empty&quot;, then something is inside, so run <code>ls lab05/empty</code> to look.", check: (ctx) => !has(ctx, "lab05/empty") },
      { text: "Do not delete <code>important.txt</code> or the <code>logs</code> folder. Nothing to type — just leave them alone.", hint: "<strong>What this checks:</strong> that you left these alone. Nothing to type. <strong>You succeed when:</strong> <code>ls lab05</code> still shows <code>important.txt</code> and <code>logs</code>. If they are gone, click <strong>Reset lab</strong>.", check: (ctx) => has(ctx, "lab05/important.txt") && has(ctx, "lab05/logs/old.log") },
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
    solution: ["ls lab05/*.tmp", "rm lab05/*.tmp", "rm -r lab05/cache", "rmdir lab05/empty", "ls -a lab05"],
  },
  {
    id: 6,
    title: "Find files, search text",
    sub: "find · grep",
    intro: "These two commands are constantly mixed up, so remember this: <strong>find looks at file <em>names</em>. grep looks at the <em>text inside</em> files.</strong> Use <code>find</code> when you ask &quot;where is the file called something?&quot;. Use <code>grep</code> when you ask &quot;which lines mention a word?&quot;. Some sample files were prepared for you in <code>lab06</code>.",
    body: [
      {
        h: "find — search by name",
        p: "<code>find WHERE -name PATTERN</code> walks through a folder and everything under it, printing every path whose name matches.<br><br><strong>Word by word</strong> in <code>find lab06 -name &quot;*.log&quot;</code>:<br><code>find</code> — the command.<br><code>lab06</code> — where to start looking.<br><code>-name</code> — &quot;match on the file name&quot;.<br><code>&quot;*.log&quot;</code> — the pattern. <code>*</code> means anything, so this is &quot;names ending in .log&quot;. <strong>Keep the quotes</strong>, otherwise the shell tries to expand the <code>*</code> itself first.<br><br>Other useful pieces: <code>-type d</code> (only directories), <code>-type f</code> (only regular files), <code>-maxdepth 1</code> (do not go deeper than one level).<br><strong>You will see:</strong> one path per line, such as <code>lab06/logs/app.log</code>. No output means nothing matched.",
        cmds: [
          c('find lab06 -name "*.log"', "by name"),
          c("find lab06 -type d", "directories only"),
          c('find lab06 -type f -name "*.js"', "files ending in .js"),
          c("find /etc -maxdepth 1 -type f", "do not go deeper than one level"),
        ],
        refs: [{ label: "find(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/find.1.html" }],
      },
      {
        h: "grep — search inside files",
        p: "<code>grep WORD FILE</code> prints every line of the file that contains the word. Think of pressing Ctrl+F in a document, but the results are the whole matching lines.<br><br><strong>Flags used below:</strong><br><code>-i</code> — ignore upper and lower case.<br><code>-c</code> — do not print the lines, print <em>how many</em> matched.<br><code>-v</code> — invert: print the lines that do <em>not</em> match.<br><code>-n</code> — put the line number in front of each match.<br><code>-r</code> — <em>recursive</em>: search every file inside a folder.<br><br>If the same line appears twice in the file, <code>grep</code> shows it twice. That is not a bug, it is reporting what is there.",
        cmds: [
          c("grep ERROR lab06/logs/app.log", "lines containing ERROR"),
          c("grep -i error lab06/logs/app.log", "ignore case"),
          c("grep -c INFO lab06/logs/app.log", "count instead of print"),
          c("grep -v INFO lab06/logs/app.log", "everything except INFO lines"),
          c("grep -n TODO lab06/src/main.js", "with line numbers"),
          c("grep -rn TODO lab06/src/utils", "search a whole folder"),
        ],
        refs: [{ label: "grep(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/grep.1.html" }],
      },
      {
        h: "Reading grep output",
        p: "When <code>grep</code> searches several files (with <code>-r</code>) it puts the file name and a colon in front of each line: <code>path:text</code>. Add <code>-n</code> and it becomes <code>path:line-number:text</code>. Code editors understand this exact format and can jump straight to that line.",
      },
    ],
    tasks: [
      {
        text: "Make a folder called <code>out</code>, then save the paths of all <code>.log</code> files into a file. Type these one at a time:<br>1. <code>mkdir -p lab06/out</code><br>2. <code>find lab06 -name \"*.log\" &gt; lab06/out/logs.txt</code>", hint: "<strong>What this does:</strong> step 1 makes the <code>out</code> folder (the <code>&gt;</code> arrow cannot create folders). Step 2 lists every path ending in <code>.log</code> under <code>lab06</code> and saves the list. <strong>You succeed when:</strong> <code>cat lab06/out/logs.txt</code> shows <code>lab06/logs/app.log</code> and <code>lab06/archive/old.log</code>. <strong>Common mistake:</strong> leaving out the quotes around <code>*.log</code>.",
        check: (ctx) => match(ctx, "lab06/out/logs.txt", /app\.log/) && match(ctx, "lab06/out/logs.txt", /old\.log/),
      },
      {
        text: "Save only the lines containing the word <code>ERROR</code> into a file. Type <code>grep ERROR lab06/logs/app.log &gt; lab06/out/errors.txt</code>", hint: "<strong>What this does:</strong> <code>grep ERROR</code> keeps only the lines that contain the word ERROR. Case matters: it will not match <code>error</code>. <strong>You succeed when:</strong> <code>cat lab06/out/errors.txt</code> shows 3 lines, all with ERROR. <strong>Common mistake:</strong> forgetting the <code>out</code> folder from Task 1.",
        check: (ctx) => nlines(ctx, "lab06/out/errors.txt") === 3 && !match(ctx, "lab06/out/errors.txt", /INFO|WARN/),
      },
      { text: "Count the lines containing <code>WARN</code> and save just the number. Type <code>grep -c WARN lab06/logs/app.log &gt; lab06/out/warn-count.txt</code>", hint: "<strong>What this does:</strong> <code>-c</code> makes <code>grep</code> print a count of matching lines instead of the lines themselves. <strong>You succeed when:</strong> <code>cat lab06/out/warn-count.txt</code> shows <code>3</code>. You do not need <code>wc</code> for this.", check: (ctx) => match(ctx, "lab06/out/warn-count.txt", /^\s*3\s*$/) },
      {
        text: "Search every file inside <code>src</code> for the word <code>TODO</code>, showing file name and line number. Type <code>grep -rn TODO lab06/src &gt; lab06/out/todos.txt</code>", hint: "<strong>What this does:</strong> <code>-r</code> searches every file under <code>lab06/src</code>, and <code>-n</code> adds line numbers. Each result looks like <code>lab06/src/main.js:2:  // TODO: ...</code>. <strong>You succeed when:</strong> <code>cat lab06/out/todos.txt</code> shows 3 lines. <strong>Common mistake:</strong> pointing at a single file instead of the <code>lab06/src</code> folder, which leaves the file names out of the results.",
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
    intro: "Every file has a set of permissions that decide who is allowed to <strong>read</strong> it, <strong>write</strong> (change) it, and <strong>execute</strong> (run) it. Think of a house: some rooms are open to everyone, some only to family, some only to you. There are three groups of people: the <strong>owner</strong> (whoever the file belongs to), the <strong>group</strong> (a named team of users), and <strong>others</strong> (everybody else). You can see permissions in the first column of <code>ls -l</code>.",
    body: [
      {
        h: "Reading the permission column",
        p: "Take <code>-rwxr-xr--</code>. It has ten characters, split into four pieces:<br><strong>1st character:</strong> the type. <code>-</code> = ordinary file, <code>d</code> = directory, <code>l</code> = symbolic link.<br><strong>Next three (<code>rwx</code>):</strong> what the <em>owner</em> may do.<br><strong>Next three (<code>r-x</code>):</strong> what the <em>group</em> may do.<br><strong>Last three (<code>r--</code>):</strong> what <em>others</em> may do.<br>Within each three: <code>r</code> = read, <code>w</code> = write, <code>x</code> = execute, and a dash <code>-</code> means &quot;not allowed&quot;.<br><br>Look at real examples: <code>/etc/passwd</code> is readable by everyone, while <code>/etc/shadow</code> (which stores password data) is locked down tight. <code>ls -ld /etc</code> shows the permissions of the folder itself, using <code>-d</code>.",
        cmds: [c("ls -l /etc/passwd", "everyone can read it"), c("ls -l /etc/shadow", "note how much tighter this one is"), c("ls -ld /etc", "a directory's own permissions")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Numeric modes",
        p: "Instead of letters you can write permissions as three digits, one per group (owner, group, others). Each digit is a sum: <strong>read = 4, write = 2, execute = 1</strong>. So read+write = 4+2 = <strong>6</strong>; read+write+execute = 4+2+1 = <strong>7</strong>; read+execute = 4+1 = <strong>5</strong>; nothing = <strong>0</strong>.<br><br>Example: <code>644</code> means owner 6 (read+write), group 4 (read), others 4 (read). Four combinations cover almost everything:",
        table: [
          ["644", "owner reads and writes, everyone else only reads", "ordinary files"],
          ["755", "owner does everything, others read and run", "scripts, directories"],
          ["600", "owner reads and writes, nobody else can do anything", "keys, passwords, .env files"],
          ["700", "owner does everything, nobody else can do anything", "private directories"],
        ],
        refs: [{ label: "chmod(1) — man7.org (numeric modes)", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Changing permissions",
        p: "<code>chmod</code> means <em>change mode</em>. The syntax is <code>chmod MODE FILE</code>.<br><br><code>chmod 755 demo.sh</code> — sets all nine permissions at once using the number.<br><code>chmod u+x demo.sh</code> — letters version: <code>u</code> = the owner (&quot;user&quot;), <code>+</code> = add, <code>x</code> = execute. Other letters: <code>g</code> group, <code>o</code> others, <code>a</code> all, and <code>-</code> removes.<br><strong>Try it:</strong> run these in order and look at <code>ls -l demo.sh</code> after each change to watch the permission column move.",
        cmds: [
          c("touch demo.sh", "make a file to practise on"),
          c("chmod 755 demo.sh", "set all nine bits"),
          c("ls -l demo.sh", "look at the result"),
          c("chmod 600 demo.sh", "tighten it"),
          c("chmod u+x demo.sh", "add execute for the owner only"),
          c("ls -l demo.sh", "look again"),
        ],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Making a script run",
        p: "A <strong>script</strong> is a text file of commands. To run it you need two things. First, a first line called a <strong>shebang</strong>, <code>#!/bin/bash</code>, which tells Linux which program should read the file. Second, the <strong>execute</strong> permission (for example mode 755). You then run it by path, such as <code>./lab07/backup.sh</code>. The <code>./</code> means &quot;the one in the current folder&quot;.",
        aside:
          "On a <strong>directory</strong>, <code>x</code> does not mean &quot;run&quot;. It means &quot;you may step inside&quot;. A directory with <code>r</code> but no <code>x</code> lets you list the names in it but not use anything in it.",
      },
    ],
    tasks: [
      {
        text: "Make a folder called <code>lab07</code> and a small script file inside it. Type these one at a time:<br>1. <code>mkdir -p lab07/private</code><br>2. <code>echo '#!/bin/bash' &gt; lab07/backup.sh</code><br>3. <code>echo \"echo Backing up files\" &gt;&gt; lab07/backup.sh</code>", hint: "<strong>What this does:</strong> step 1 makes the folders (<code>-p</code> also makes <code>private</code>, needed in Task 5). Step 2 writes the shebang line into a new file. Single quotes are used because in a real terminal, <code>!</code> inside double quotes can cause an &quot;event not found&quot; error. Step 3 adds a second line with <code>&gt;&gt;</code> that prints a message when run. <strong>You succeed when:</strong> <code>cat lab07/backup.sh</code> shows two lines, the first being <code>#!/bin/bash</code>. <strong>Common mistake:</strong> using one arrow for step 3, which erases the shebang.",
        check: (ctx) => match(ctx, "lab07/backup.sh", /^#!\/bin\/bash/) && match(ctx, "lab07/backup.sh", /echo/),
      },
      { text: "Allow the script to run by giving it mode 755. Type <code>chmod 755 lab07/backup.sh</code>", hint: "<strong>What this does:</strong> mode 755 = owner 7 (read, write, run), group 5 (read, run), others 5 (read, run). This grants the <em>execute</em> permission the script needs. <strong>You succeed when:</strong> <code>ls -l lab07/backup.sh</code> starts with <code>-rwxr-xr-x</code>. <strong>Common mistake:</strong> running <code>chmod</code> before the file exists.", check: (ctx) => mode(ctx, "lab07/backup.sh") === "755" },
      { text: "Run the script. Type <code>./lab07/backup.sh</code> — you should see <code>Backing up files</code> on screen.", hint: "<strong>What this does:</strong> <code>./lab07/backup.sh</code> runs the script; <code>./</code> means &quot;start from where I am&quot;. <strong>You succeed when:</strong> the message you wrote appears on screen. If you see &quot;Permission denied&quot;, do the previous task's <code>chmod 755</code> first. If you see &quot;command not found&quot;, you left off <code>./</code>.", check: (ctx) => ranScript(ctx, "lab07/backup.sh") },
      { text: "Make a secret file that only you can read and write. Type these one at a time:<br>1. <code>touch lab07/secrets.env</code><br>2. <code>chmod 600 lab07/secrets.env</code>", hint: "<strong>What this does:</strong> <code>touch</code> creates the file, and mode 600 = owner 6 (read, write), group 0, others 0, so only you can use it. This is how you protect passwords and keys. <strong>You succeed when:</strong> <code>ls -l lab07/secrets.env</code> starts with <code>-rw-------</code>.", check: (ctx) => has(ctx, "lab07/secrets.env") && mode(ctx, "lab07/secrets.env") === "600" },
      { text: "Make the folder <code>private</code> (created in step 1) accessible only to you. Type <code>chmod 700 lab07/private</code>", hint: "<strong>What this does:</strong> mode 700 = owner 7 (full access), group and others 0. On a folder, that means only you can even step inside. <strong>You succeed when:</strong> <code>ls -ld lab07/private</code> starts with <code>drwx------</code>. The <code>-d</code> makes <code>ls</code> show the folder itself instead of its contents.", check: (ctx) => dir(ctx, "lab07/private") && mode(ctx, "lab07/private") === "700" },
      { text: "Save a detailed list of the folder. Type <code>ls -l lab07 &gt; lab07/perms.txt</code>", hint: "<strong>What this does:</strong> <code>ls -l lab07</code> lists the folder in long format (showing permissions), and <code>&gt;</code> saves it. <strong>You succeed when:</strong> <code>cat lab07/perms.txt</code> shows a line for <code>backup.sh</code> starting with <code>-rwx</code>.", check: (ctx) => match(ctx, "lab07/perms.txt", /backup\.sh/) && match(ctx, "lab07/perms.txt", /^-rwx/m) },
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
    intro: "Three separate tools that often turn up together. A <strong>symbolic link</strong> is a shortcut that points to another file. <code>du</code> tells you how much disk space things use. <code>tar</code> packs many files into one bundle, like putting them all in a single box for easy sending. This lab reuses the <code>webapp</code> folder you built earlier (it is created for you if missing).",
    body: [
      {
        h: "Symbolic links (shortcuts)",
        p: "A <strong>symlink</strong> is a tiny file that just stores the path of another file. Opening the symlink shows the real file's content, like a shortcut on your desktop.<br><br><strong>Word by word</strong> in <code>ln -s /etc/passwd users-link</code>: <code>ln</code> = make a link; <code>-s</code> = a <em>symbolic</em> one; <code>/etc/passwd</code> = the <em>target</em> it points to; <code>users-link</code> = the name of the new shortcut.<br>In <code>ls -l</code> the shortcut is shown with an arrow: <code>users-link -&gt; /etc/passwd</code>. If the target is later moved or deleted, the shortcut &quot;breaks&quot;, and you can see it.<br><code>readlink -f</code> prints the final real path the link leads to.",
        cmds: [c("ln -s /etc/passwd users-link", "create the shortcut"), c("ls -l users-link", "the arrow shows the target"), c("cat users-link", "reads through to the real file"), c("readlink -f users-link", "resolve the full path")],
        refs: [{ label: "ln(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/ln.1.html" }],
      },
      {
        h: "How much space?",
        p: "<code>du</code> means <em>disk usage</em>. On its own it prints sizes in awkward units, so the two useful flags are <code>-h</code> (<em>human-readable</em>: 4.0K, 2M) and <code>-s</code> (<em>summary</em>: one total instead of a line for every folder). <code>df -h</code> shows how full each whole disk is, rather than one folder.",
        cmds: [c("du -sh webapp", "one total, human readable"), c("du -h webapp", "every folder inside, human readable"), c("df -h", "free space on each disk")],
        refs: [
          { label: "du(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/du.1.html" },
          { label: "df(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/df.1.html" },
        ],
      },
      {
        h: "Archives with tar",
        p: "<code>tar</code> bundles files and folders into one file (often called a <em>tarball</em>). Adding <code>z</code> also compresses it with gzip to make it smaller; the file ends in <code>.tar.gz</code>. The letters after the dash are flags:<br><code>c</code> — <strong>c</strong>reate an archive.<br><code>t</code> — <strong>t</strong>ell me what is inside (list), without unpacking.<br><code>x</code> — e<strong>x</strong>tract (unpack).<br><code>z</code> — use gzip compression.<br><code>f</code> — the next word is the archive's file name. Put <code>f</code> last so the name follows it.<br><code>-C FOLDER</code> — extract <em>into</em> this folder.<br><br>Example: <code>tar -czf webapp.tar.gz webapp</code> reads as: create, gzip, into the file <code>webapp.tar.gz</code>, from the folder <code>webapp</code>.",
        cmds: [
          c("tar -czf webapp.tar.gz webapp", "create a compressed archive"),
          c("file webapp.tar.gz", "confirm what kind of file it is"),
          c("tar -tzf webapp.tar.gz", "list its contents without unpacking"),
          c("mkdir -p unpacked", "a folder to unpack into"),
          c("tar -xzf webapp.tar.gz -C unpacked", "extract into it"),
          c("tree unpacked", "look at the result"),
        ],
        aside:
          "Memory trick for the three modes: <strong>c</strong>reate, <strong>t</strong>ell me, e<strong>x</strong>tract.",
        refs: [{ label: "tar(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tar.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Pack the <code>webapp</code> folder into one compressed file. Type these one at a time:<br>1. <code>mkdir -p lab08/restored</code><br>2. <code>tar -czf lab08/webapp.tar.gz webapp</code>", hint: "<strong>What this does:</strong> step 1 makes the folders (neither <code>tar</code> nor <code>&gt;</code> can create a missing folder). Step 2 packs and compresses <code>webapp</code> into <code>lab08/webapp.tar.gz</code>. <strong>You succeed when:</strong> <code>ls lab08</code> shows <code>webapp.tar.gz</code>. <strong>Common mistake:</strong> writing the letters in a different order. <code>f</code> must be last, right before the file name.",
        check: (ctx) => {
          const m = tarMembers(ctx, "lab08/webapp.tar.gz");
          return !!m && m.some((x) => /webapp/.test(x));
        },
      },
      {
        text: "List what is inside the archive without unpacking it. Type <code>tar -tzf lab08/webapp.tar.gz &gt; lab08/contents.txt</code>", hint: "<strong>What this does:</strong> <code>t</code> lists what is inside the archive without unpacking, and <code>&gt;</code> saves the list. <strong>You succeed when:</strong> <code>cat lab08/contents.txt</code> shows many lines starting with <code>webapp/</code>.",
        check: (ctx) => match(ctx, "lab08/contents.txt", /webapp/) && nlines(ctx, "lab08/contents.txt") > 5,
      },
      { text: "Unpack the archive into the <code>restored</code> folder. Type <code>tar -xzf lab08/webapp.tar.gz -C lab08/restored</code>", hint: "<strong>What this does:</strong> <code>x</code> unpacks, and <code>-C lab08/restored</code> says &quot;put the files in this folder&quot;. <strong>You succeed when:</strong> <code>ls lab08/restored</code> shows <code>webapp</code>. <strong>Common mistake:</strong> no <code>restored</code> folder yet (Task 1, step 1).", check: (ctx) => dir(ctx, "lab08/restored/webapp") && has(ctx, "lab08/restored/webapp/README.md") },
      {
        text: "Make a shortcut (a &quot;symlink&quot;) called <code>current</code> that points to the unpacked <code>webapp</code>. Type <code>ln -s restored/webapp lab08/current</code>", hint: "<strong>What this does:</strong> creates a shortcut named <code>lab08/current</code> that points to <code>restored/webapp</code>. The target is written relative to the folder the link lives in, which is <code>lab08</code>. <strong>You succeed when:</strong> <code>ls -l lab08</code> shows <code>current -&gt; restored/webapp</code>, and <code>ls lab08/current</code> lists the webapp contents. <strong>Common mistake:</strong> writing the target as <code>lab08/restored/webapp</code>, which makes a broken link.",
        check: (ctx) => link(ctx, "lab08/current") && !!ctx.fs.getNode(ctx.fs.resolve("lab08/current", HOME)),
      },
      { text: "Save the total size of <code>webapp</code> in a readable form. Type <code>du -sh webapp &gt; lab08/size.txt</code>", hint: "<strong>What this does:</strong> <code>-s</code> gives one total, <code>-h</code> makes it readable, and <code>&gt;</code> saves the line. <strong>You succeed when:</strong> <code>cat lab08/size.txt</code> shows something like <code>4.0K</code> followed by <code>webapp</code>.", check: (ctx) => match(ctx, "lab08/size.txt", /^\s*\d+(\.\d)?[KM]?\s+\S*webapp/m) },
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
    intro: "Every command has three &quot;pipes&quot; connected to it, like plumbing: something coming <strong>in</strong>, something going <strong>out</strong>, and a separate channel for <strong>error messages</strong>. Once you can connect these pipes, you can chain small commands together into powerful ones, without writing any program.",
    body: [
      {
        h: "The three streams",
        p: "<strong>stdin</strong> (standard input) is where a command reads from. <strong>stdout</strong> (standard output, number <strong>1</strong>) is where normal results go. <strong>stderr</strong> (standard error, number <strong>2</strong>) is where error messages go. Both stdout and stderr normally show up on your screen, but they are separate channels.<br><br>Try <code>ls /etc nowhere</code>. <code>/etc</code> works (normal output) and <code>nowhere</code> does not exist (an error).<br><code>&gt; out.txt</code> only redirects stdout, so the error still appears on screen.<br><code>&gt; out.txt 2&gt;&amp;1</code> reads as: stdout to the file, then send channel 2 to wherever channel 1 goes. Now both land in the file.<br><code>2&gt;/dev/null</code> throws errors away. <code>/dev/null</code> is a bin that swallows everything.",
        cmds: [
          c("ls /etc nowhere", "one part works, one fails"),
          c("ls /etc nowhere > out.txt", "the error still reaches the screen"),
          c("ls /etc nowhere > out.txt 2>&1", "send errors to the same file"),
          c("ls /etc nowhere 2>/dev/null", "discard the errors"),
        ],
        aside:
          "Order matters: <code>&gt; file 2&gt;&amp;1</code> works, but <code>2&gt;&amp;1 &gt; file</code> does not. Read it left to right: first point stdout at the file, then point stderr to wherever stdout now goes.",
        refs: [{ label: "bash(1) — Debian manpages: REDIRECTION", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#REDIRECTION" }],
      },
      {
        h: "Pipes",
        p: "A <strong>pipe</strong>, written <code>|</code>, connects the output of one command directly to the input of the next, like a conveyor belt between two workers. No temporary files needed. (Type <code>|</code> with Shift and the backslash key.)<br><br><code>cat /etc/passwd | wc -l</code> — <code>cat</code> prints the file, the pipe hands that text to <code>wc -l</code>, which counts the lines.<br><code>cut -d: -f1 /etc/passwd</code> — <code>cut</code> slices each line. <code>-d:</code> says &quot;the separator is a colon&quot;, <code>-f1</code> says &quot;keep field number 1&quot;.<br><code>sort</code> — puts lines in alphabetical order.<br><code>awk '{print $2}'</code> — prints the 2nd word (whitespace-separated field) of each line.",
        cmds: [
          c("cat /etc/passwd | wc -l", "count the lines"),
          c("cut -d: -f1 /etc/passwd", "first colon-separated field"),
          c("cut -d: -f1 /etc/passwd | sort", "then sort it"),
          c("awk '{print $2}' lab06/logs/app.log", "second word of every line"),
        ],
        refs: [
          { label: "bash(1) — Debian manpages: Pipelines", url: "https://manpages.debian.org/bookworm/bash/bash.1.en.html#Pipelines" },
          { label: "cut(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cut.1.html" },
          { label: "sort(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/sort.1.html" },
          { label: "awk(1p) — POSIX man page", url: "https://man7.org/linux/man-pages/man1/awk.1p.html" },
        ],
      },
      {
        h: "Counting things",
        p: "<code>uniq</code> collapses repeated lines, but only when the repeats are <em>next to each other</em>. So it is almost always used after <code>sort</code>. With <code>-c</code> it also puts a count in front of each line. Add a final <code>sort -rn</code> (<code>-n</code> = compare as numbers, <code>-r</code> = reverse) to put the biggest count first.",
        cmds: [c("cut -d: -f7 /etc/passwd | sort | uniq -c", "how many users use each login shell"), c("cut -d: -f7 /etc/passwd | sort | uniq -c | sort -rn", "biggest count first")],
        refs: [{ label: "uniq(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/uniq.1.html" }],
      },
      {
        h: "tee",
        p: "<code>tee</code> is named after a T-shaped pipe fitting. It passes the text along to the next command <em>and</em> saves a copy to a file, so you can keep an intermediate result without breaking the chain.",
        cmds: [c("grep ERROR lab06/logs/app.log | tee saved.txt | wc -l", "save the lines and count them")],
        refs: [{ label: "tee(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/tee.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Count how many times each level (INFO, WARN, ERROR) appears in the log, biggest count first. Type these one at a time:<br>1. <code>mkdir -p lab09</code><br>2. <code>awk '{print $2}' lab06/logs/app.log | sort | uniq -c | sort -rn &gt; lab09/levels.txt</code>", hint: "<strong>What this does:</strong> <code>awk '{print $2}'</code> keeps the level word, <code>sort</code> groups equal words together, <code>uniq -c</code> counts each group, and <code>sort -rn</code> puts the biggest count first. Each <code>|</code> hands the result to the next step. <strong>You succeed when:</strong> <code>cat lab09/levels.txt</code> shows <code>4 INFO</code> first, then <code>3 WARN</code> and <code>3 ERROR</code>. <strong>Needs Lab 6</strong> (that is where <code>app.log</code> comes from).",
        check: (ctx) =>
          match(ctx, "lab09/levels.txt", /^\s*4 INFO/m) &&
          match(ctx, "lab09/levels.txt", /^\s*3 WARN/m) &&
          match(ctx, "lab09/levels.txt", /^\s*3 ERROR/m) &&
          /INFO/.test((read(ctx, "lab09/levels.txt") || "").split("\n")[0]),
      },
      {
        text: "Run a command that shows both a result and an error, and save both into one file. Type <code>ls lab06 nowhere &gt; lab09/both.txt 2&gt;&amp;1</code>", hint: "<strong>What this does:</strong> <code>&gt; lab09/both.txt</code> sends normal output to the file and <code>2&gt;&amp;1</code> sends the error message to the same place. <strong>You succeed when:</strong> <code>cat lab09/both.txt</code> shows the folder listing and a &quot;No such file or directory&quot; line. <strong>Common mistake:</strong> writing <code>2&gt;&amp;1</code> before the <code>&gt;</code>.",
        check: (ctx) => match(ctx, "lab09/both.txt", /logs/) && match(ctx, "lab09/both.txt", /No such file/),
      },
      {
        text: "Save the <code>ERROR</code> lines to a file and, in the same command, save how many there are. Type <code>grep ERROR lab06/logs/app.log | tee lab09/errors.txt | wc -l &gt; lab09/error-count.txt</code>", hint: "<strong>What this does:</strong> <code>grep</code> finds the ERROR lines, <code>tee lab09/errors.txt</code> saves them to a file and passes them on, and <code>wc -l</code> counts them, with <code>&gt;</code> saving the count. <strong>You succeed when:</strong> <code>errors.txt</code> has 3 lines and <code>error-count.txt</code> holds <code>3</code>.",
        check: (ctx) => nlines(ctx, "lab09/errors.txt") === 3 && match(ctx, "lab09/error-count.txt", /^\s*3\s*$/),
      },
      {
        text: "Save all the user names from <code>/etc/passwd</code> in alphabetical order. Type <code>cut -d: -f1 /etc/passwd | sort &gt; lab09/usernames.txt</code>", hint: "<strong>What this does:</strong> <code>cut -d: -f1</code> keeps only the first field of each line (the user name, since fields are separated by colons), and <code>sort</code> puts them in alphabetical order. <strong>You succeed when:</strong> <code>cat lab09/usernames.txt</code> lists names such as <code>root</code>, one per line, in order.",
        check: (ctx) => {
          const t = read(ctx, "lab09/usernames.txt");
          if (t === null) return false;
          const L2 = lines(t);
          return L2.length === lines(PASSWD).length && L2.includes("root") && L2.join() === L2.slice().sort().join();
        },
      },
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
    intro: "This is the final challenge. There are no new commands and no worked examples: you build a small deployment tool called <code>shipit</code> using everything from the earlier labs. It is the same kind of work you would do on a real project. Each task below already tells you the exact commands to type, so you can follow them one at a time. Take your time, and use the <strong>hint</strong> link beside each task if you get stuck.",
    body: [
      { h: "The brief", p: "You are setting up a small deployment tool called <code>shipit</code> in your home directory. When you finish, every requirement below must be true. The checklist under the lesson ticks each one off automatically." },
      {
        h: "Structure",
        p: "This is the final shape of the project. Lines with <code>-&gt;</code> are symbolic links (shortcuts), as in Lab 8.",
        tree: "shipit/\n├── README.md\n├── .gitignore\n├── summary.txt\n├── latest -> release/shipit-v1.tar.gz\n├── bin/shipit.sh\n├── config/\n│   ├── production.env\n│   └── staging.env\n├── lib/\n│   ├── deploy.sh\n│   └── rollback.sh\n├── logs/deploy.log\n└── release/shipit-v1.tar.gz",
      },
      {
        h: "Requirements",
        p: "<strong>1.</strong> <code>README.md</code> begins with <code># shipit</code>.<br><strong>2.</strong> <code>.gitignore</code> has the lines <code>logs/</code> and <code>*.env</code>.<br><strong>3.</strong> <code>bin/shipit.sh</code> starts with the bash shebang, has mode 755, and has been run.<br><strong>4.</strong> Both <code>lib/*.sh</code> files have mode 755.<br><strong>5.</strong> Both <code>config/*.env</code> files have mode 600.<br><strong>6.</strong> <code>logs/deploy.log</code> has at least three lines, each containing INFO, WARN or ERROR.<br><strong>7.</strong> The archive contains <code>bin</code>, <code>lib</code> and <code>config</code>, but <em>not</em> <code>logs</code>.<br><strong>8.</strong> <code>latest</code> is a working symlink to the archive.<br><strong>9.</strong> <code>summary.txt</code> holds the number of ERROR lines in the log.",
      },
    ],
    tasks: [
      { text: "Create all the folders. Type <code>mkdir -p shipit/{bin,config,lib,logs,release}</code>", hint: "<strong>What this does:</strong> <code>-p</code> plus the curly brackets makes <code>shipit</code> and its five sub-folders in one command. <strong>You succeed when:</strong> <code>ls shipit</code> lists <code>bin config lib logs release</code>. <strong>Common mistake:</strong> putting a space after a comma inside the brackets.", check: (ctx) => ["shipit", "shipit/bin", "shipit/config", "shipit/lib", "shipit/logs", "shipit/release"].every((p) => dir(ctx, p)) },
      {
        text: "Create <code>README.md</code> and <code>.gitignore</code>. Type these one at a time:<br>1. <code>echo \"# shipit\" &gt; shipit/README.md</code><br>2. <code>echo \"logs/\" &gt; shipit/.gitignore</code><br>3. <code>echo \"*.env\" &gt;&gt; shipit/.gitignore</code>", hint: "<strong>What this does:</strong> creates a README with a title, then a <code>.gitignore</code> with two lines. The first uses <code>&gt;</code> (create), the second uses <code>&gt;&gt;</code> (add). <strong>You succeed when:</strong> <code>cat shipit/.gitignore</code> shows two lines. <strong>Common mistake:</strong> using <code>&gt;</code> on both lines, so only the last one survives.",
        check: (ctx) => match(ctx, "shipit/README.md", /^# shipit/) && match(ctx, "shipit/.gitignore", /^logs\/$/m) && match(ctx, "shipit/.gitignore", /^\*\.env$/m),
      },
      {
        text: "Create the main script, make it runnable, and run it. Type these one at a time:<br>1. <code>echo '#!/bin/bash' &gt; shipit/bin/shipit.sh</code><br>2. <code>echo \"echo Hello from shipit\" &gt;&gt; shipit/bin/shipit.sh</code><br>3. <code>chmod 755 shipit/bin/shipit.sh</code><br>4. <code>./shipit/bin/shipit.sh</code>", hint: "<strong>What this does:</strong> lines 1-2 write a two-line script, <code>chmod 755</code> lets it run, and <code>./shipit/bin/shipit.sh</code> runs it. <strong>You succeed when:</strong> <code>Hello from shipit</code> appears on screen. <strong>Common mistake:</strong> running it before <code>chmod</code> (&quot;Permission denied&quot;).",
        check: (ctx) => match(ctx, "shipit/bin/shipit.sh", /^#!\/bin\/bash/) && mode(ctx, "shipit/bin/shipit.sh") === "755" && ranScript(ctx, "shipit/bin/shipit.sh"),
      },
      { text: "Create the two library scripts and make them mode 755. Type these one at a time:<br>1. <code>touch shipit/lib/deploy.sh shipit/lib/rollback.sh</code><br>2. <code>chmod 755 shipit/lib/deploy.sh shipit/lib/rollback.sh</code>", hint: "<strong>What this does:</strong> <code>touch</code> creates two empty script files and <code>chmod 755</code> sets both at once. <strong>You succeed when:</strong> <code>ls -l shipit/lib</code> shows <code>-rwxr-xr-x</code> on both. Set modes <em>after</em> creating the files.", check: (ctx) => mode(ctx, "shipit/lib/deploy.sh") === "755" && mode(ctx, "shipit/lib/rollback.sh") === "755" },
      { text: "Create the two config files and make them mode 600. Type these one at a time:<br>1. <code>touch shipit/config/production.env shipit/config/staging.env</code><br>2. <code>chmod 600 shipit/config/production.env shipit/config/staging.env</code>", hint: "<strong>What this does:</strong> creates two empty config files and locks both to owner-only read/write (600). <strong>You succeed when:</strong> <code>ls -l shipit/config</code> shows <code>-rw-------</code> on both.", check: (ctx) => mode(ctx, "shipit/config/production.env") === "600" && mode(ctx, "shipit/config/staging.env") === "600" },
      {
        text: "Create a log with three lines. Type these one at a time:<br>1. <code>echo \"INFO deployment started\" &gt; shipit/logs/deploy.log</code><br>2. <code>echo \"WARN disk is almost full\" &gt;&gt; shipit/logs/deploy.log</code><br>3. <code>echo \"ERROR could not reach server\" &gt;&gt; shipit/logs/deploy.log</code>", hint: "<strong>What this does:</strong> writes three log lines, each containing one of the words INFO, WARN, ERROR. The first line uses <code>&gt;</code> and the next two use <code>&gt;&gt;</code>. <strong>You succeed when:</strong> <code>cat shipit/logs/deploy.log</code> shows three lines.",
        check: (ctx) => {
          const t = read(ctx, "shipit/logs/deploy.log");
          return t !== null && lines(t).filter((l) => /INFO|WARN|ERROR/.test(l)).length >= 3;
        },
      },
      {
        text: "Pack <code>bin</code>, <code>lib</code> and <code>config</code> (not <code>logs</code>) into an archive. Type these one at a time:<br>1. <code>cd shipit</code><br>2. <code>tar -czf release/shipit-v1.tar.gz bin lib config</code>", hint: "<strong>What this does:</strong> <code>cd shipit</code> moves you into the project, then <code>tar -czf release/shipit-v1.tar.gz bin lib config</code> packs only those three folders (not <code>logs</code>). <strong>You succeed when:</strong> <code>tar -tzf release/shipit-v1.tar.gz</code> lists bin, lib and config entries and nothing from logs.",
        check: (ctx) => {
          const m = tarMembers(ctx, "shipit/release/shipit-v1.tar.gz");
          return !!m && m.some((x) => /bin/.test(x)) && m.some((x) => /lib/.test(x)) && m.some((x) => /config/.test(x)) && !m.some((x) => /logs/.test(x));
        },
      },
      { text: "You are still inside <code>shipit</code>. Make a shortcut called <code>latest</code> pointing to the archive. Type <code>ln -s release/shipit-v1.tar.gz latest</code>", hint: "<strong>What this does:</strong> makes a shortcut named <code>latest</code> pointing at the archive. Because you are inside <code>shipit</code>, the path is short. <strong>You succeed when:</strong> <code>ls -l</code> shows <code>latest -&gt; release/shipit-v1.tar.gz</code>. <strong>Common mistake:</strong> running it from the wrong folder. Check with <code>pwd</code> (it should end in <code>shipit</code>).", check: (ctx) => link(ctx, "shipit/latest") && !!ctx.fs.getNode(ctx.fs.resolve("shipit/latest", HOME)) },
      {
        text: "Save the number of ERROR lines into <code>summary.txt</code>, then go back home. Type these one at a time:<br>1. <code>grep -c ERROR logs/deploy.log &gt; summary.txt</code><br>2. <code>cd ~</code>", hint: "<strong>What this does:</strong> <code>grep -c ERROR logs/deploy.log</code> counts the ERROR lines and <code>&gt;</code> saves just that number into <code>summary.txt</code>. <code>cd ~</code> takes you home again. <strong>You succeed when:</strong> <code>cat shipit/summary.txt</code> shows <code>1</code> (with the log lines above).",
        check: (ctx) => {
          const t = read(ctx, "shipit/summary.txt");
          if (t === null) return false;
          const log = read(ctx, "shipit/logs/deploy.log") || "";
          const n = lines(log).filter((l) => /ERROR/.test(l)).length;
          return new RegExp("^\\s*" + n + "\\s*$").test(t.trim()) && n > 0;
        },
      },
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
      "A novelist has vanished the week her final manuscript was due. Two versions of her last chapter turned up, an evidence folder is locked, and the case log is full of noise. To solve the case you need three new tools: <code>diff</code> to compare two files, <code>chown</code> to change who owns a file, and <code>sudo</code> to run one command with administrator powers. Work through the tasks in order and the story reveals itself.",
    body: [
      {
        h: "Administrator powers with sudo",
        p: "Every file has an <strong>owner</strong> and a <strong>group</strong>, as well as permissions (Lab 7). The file <code>/etc/shadow</code> stores password data, so it belongs to <code>root</code> (the all-powerful administrator account) and ordinary users cannot read it. You are the user <code>labex</code>, so trying to read it fails with &quot;Permission denied&quot;.<br><br><code>sudo</code> means &quot;do this <em>one</em> command as the administrator&quot;. Put it in front of a command: <code>sudo cat /etc/shadow</code>. It does not log you in as root and it only covers that single command.<br><strong>Try it:</strong> run both commands below and compare.",
        cmds: [c("cat /etc/shadow", "refused: you are not the owner and not in the group"), c("sudo cat /etc/shadow", "works: this one command runs as administrator")],
        aside: "<code>sudo</code> is powerful, so only use it when a task really needs it. Nothing tells you when you make a mistake as an administrator.",
        refs: [{ label: "sudo(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/sudo.8.html" }],
      },
      {
        h: "Changing the owner with chown",
        p: "<code>chown</code> means <em>change owner</em>. The syntax is <code>chown OWNER FILE</code>, or <code>chown OWNER:GROUP FILE</code> to change both at once (the colon separates the two). Only an administrator may do it, so you need <code>sudo</code>.<br><br>Try the commands in order. The second is refused, the third succeeds, and <code>ls -l</code> shows the new owner in the third column. The last command hands the file back to you.",
        cmds: [
          c("touch demo.txt", "make a file to practise on"),
          c("chown root demo.txt", "refused: you are not the administrator"),
          c("sudo chown root demo.txt", "works"),
          c("ls -l demo.txt", "the owner column now says root"),
          c("sudo chown labex:labex demo.txt", "owner and group back to you"),
        ],
        refs: [{ label: "chown(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chown.1.html" }],
      },
      {
        h: "Comparing two files",
        p: "<code>diff FILE1 FILE2</code> lists the differences between two files. Lines starting with <code>&lt;</code> come from the first file; lines starting with <code>&gt;</code> come from the second. A line such as <code>3c3</code> means &quot;line 3 in the first file was <strong>c</strong>hanged to line 3 in the second&quot; (the other codes are <code>a</code> for added and <code>d</code> for deleted). <code>cmp</code> is simpler: it prints only the first place two files differ, or nothing at all if they are identical.<br><br><code>printf</code> is like <code>echo</code> but understands <code>\\n</code> as a new line, so the first two commands create two small three-line files that differ on the last line.",
        cmds: [
          c("printf 'one\\ntwo\\nthree\\n' > d1.txt", "create a file"),
          c("printf 'one\\ntwo\\nTHREE\\n' > d2.txt", "create a slightly different file"),
          c("diff d1.txt d2.txt", "3c3, then the old and new line"),
          c("cmp d1.txt d2.txt", "the first place they differ"),
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
        text: "Find the line about the suspect in the case log and save just that line. Type <code>grep -i suspect lab11/case.log &gt; lab11/suspect.txt</code>", hint: "<strong>What this does:</strong> <code>grep -i suspect</code> prints lines containing the word suspect in any letter case, and <code>&gt;</code> saves them. <strong>You succeed when:</strong> <code>cat lab11/suspect.txt</code> shows one line ending in the initials <code>E.V.</code>.",
        check: (ctx) => nlines(ctx, "lab11/suspect.txt") === 1 && match(ctx, "lab11/suspect.txt", /E\.V\./),
      },
      {
        text: "Compare the two versions of the chapter and save the differences. Type <code>diff lab11/draft-final.txt lab11/published-final.txt &gt; lab11/changes.txt</code>", hint: "<strong>What this does:</strong> <code>diff</code> compares the two versions of the chapter and the <code>&gt;</code> saves the report. <strong>You succeed when:</strong> <code>cat lab11/changes.txt</code> shows <code>4c4</code> and two lines: one mentioning Ainsley (<code>&lt;</code>) and one mentioning the gardener (<code>&gt;</code>). Someone changed line 4.",
        check: (ctx) => match(ctx, "lab11/changes.txt", /^4c4$/m) && match(ctx, "lab11/changes.txt", /Ainsley/) && match(ctx, "lab11/changes.txt", /gardener/),
      },
      {
        text: "The vault file is locked. Try to read it, see the refusal, then read it as administrator with <code>sudo</code> and save it. Type these one at a time:<br>1. <code>cat lab11/vault/confession.txt</code><br>2. <code>sudo cat lab11/vault/confession.txt &gt; lab11/confession.txt</code><br>(The first command failing with &quot;Permission denied&quot; is expected.)", hint: "<strong>What this does:</strong> the first command is meant to fail with &quot;Permission denied&quot;, because the file belongs to root with mode 600. <code>sudo cat</code> reads it as administrator, and the <code>&gt;</code> saves the text into your own folder. <strong>You succeed when:</strong> <code>cat lab11/confession.txt</code> shows the confession. <strong>Common mistake:</strong> forgetting <code>sudo</code> on the second command.",
        check: (ctx) => match(ctx, "lab11/confession.txt", /gardener/),
      },
      {
        text: "Make yourself the owner of the vault file. Type <code>sudo chown labex:labex lab11/vault/confession.txt</code>", hint: "<strong>What this does:</strong> <code>sudo chown labex:labex</code> makes you both the owner and the group owner of the vault file. <strong>You succeed when:</strong> <code>ls -l lab11/vault</code> shows <code>labex labex</code> in the owner and group columns. Without <code>sudo</code>, <code>chown</code> is refused.",
        check: (ctx) => owner(ctx, "lab11/vault/confession.txt") === "labex" && group(ctx, "lab11/vault/confession.txt") === "labex",
      },
      {
        text: "Read the confession, find out who wrote it, and write that name into the solution file. Type these one at a time:<br>1. <code>cat lab11/confession.txt</code><br>2. <code>echo \"Mrs. Ainsley\" &gt; lab11/solution.txt</code>", hint: "<strong>What this does:</strong> read the confession you saved. The person who signs it (&quot;I, ... confess&quot;) is the one who altered the record. The <code>echo</code> writes that name into <code>solution.txt</code>. <strong>You succeed when:</strong> <code>cat lab11/solution.txt</code> shows the name from the confession. The check looks for the word Ainsley.",
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
      "Linux was built for many people to share one computer, and it still works that way today even on a laptop with a single user. Every running program belongs to some user and every file has an owner, so the system needs to know <em>who is who</em>. Each user has a name and a number called a <strong>uid</strong> (user id). Users can also belong to <strong>groups</strong>, which are named teams that share access. This lab shows how to look up those facts.",
    body: [
      {
        h: "Who you are",
        p: "<code>id</code> prints your identity. Example output: <code>uid=1000(labex) gid=1000(labex) groups=1000(labex)</code>.<br><strong>Read it:</strong> <code>uid=1000(labex)</code> — your user number is 1000 and your name is labex. <code>gid=1000(labex)</code> — your <em>primary</em> group number and name. <code>groups=…</code> — every group you belong to.<br>Give <code>id</code> a user name (<code>id root</code>) to look up somebody else. <code>whoami</code> prints only your user name.",
        cmds: [c("id", "who am I, numerically"), c("id root", "look up another user"), c("whoami", "just the name")],
        refs: [{ label: "id(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/id.1.html" }],
      },
      {
        h: "Which groups",
        p: "<code>groups</code> is the short version of the last part of <code>id</code>: it prints only the group <em>names</em>. Follow it with a user name to see someone else's groups. Users such as <code>www-data</code> are accounts created for services (here, a web server) rather than for people.",
        cmds: [c("groups", "my groups"), c("groups www-data", "the groups of another user")],
        refs: [{ label: "groups(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/groups.1.html" }],
      },
      {
        h: "The files behind it",
        p: "These commands just read two plain text files, and you can read them too.<br><code>/etc/passwd</code> has one line per user, with fields separated by colons: <code>name : x : uid : gid : description : home directory : shell</code>. The <code>x</code> is a placeholder (passwords are stored elsewhere) and the <em>shell</em> is the program that runs when that user opens a terminal.<br><code>/etc/group</code> has one line per group: <code>name : x : gid : members</code>.<br>The table shows the passwd line for <code>labex</code>, split into fields.",
        cmds: [c("head -n 3 /etc/passwd", "first three users"), c("head -n 3 /etc/group", "first three groups")],
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
        text: "Save information about yourself into a file. Type these one at a time:<br>1. <code>mkdir -p lab12</code><br>2. <code>id &gt; lab12/me.txt</code>", hint: "<strong>What this does:</strong> step 1 makes the <code>lab12</code> folder. Step 2 saves the output of <code>id</code> into a file. <strong>You succeed when:</strong> <code>cat lab12/me.txt</code> shows <code>uid=1000(labex) gid=1000(labex) ...</code>. <strong>Common mistake:</strong> skipping <code>mkdir</code>, because <code>&gt;</code> cannot create the folder.",
        check: (ctx) => match(ctx, "lab12/me.txt", /uid=1000\(labex\)/) && match(ctx, "lab12/me.txt", /gid=1000\(labex\)/),
      },
      {
        text: "Save the groups that the user <code>www-data</code> belongs to. Type <code>groups www-data &gt; lab12/www-groups.txt</code>", hint: "<strong>What this does:</strong> <code>groups www-data</code> lists the groups that account belongs to, and <code>&gt;</code> saves them. <strong>You succeed when:</strong> <code>cat lab12/www-groups.txt</code> shows a line that starts with <code>www-data</code>.",
        check: (ctx) => match(ctx, "lab12/www-groups.txt", /www-data/),
      },
      {
        text: "Save the single line about the user <code>daemon</code> from the user list. Type <code>grep '^daemon:' /etc/passwd &gt; lab12/daemon.txt</code>", hint: "<strong>What this does:</strong> <code>grep '^daemon:' /etc/passwd</code> prints lines <em>starting with</em> <code>daemon:</code> (the <code>^</code> means &quot;at the start of the line&quot;). This keeps out other lines that merely mention daemon somewhere. <strong>You succeed when:</strong> <code>cat lab12/daemon.txt</code> is one line starting <code>daemon:x:1:1:</code>.",
        check: (ctx) => nlines(ctx, "lab12/daemon.txt") === 1 && match(ctx, "lab12/daemon.txt", /^daemon:x:1:1:/),
      },
      {
        text: "Save every group whose name contains <code>sys</code>. Type <code>grep sys /etc/group &gt; lab12/sys-groups.txt</code>", hint: "<strong>What this does:</strong> <code>grep sys /etc/group</code> prints every line containing the letters sys anywhere, so it catches both <code>sys</code> and <code>systemd-network</code>. <strong>You succeed when:</strong> <code>cat lab12/sys-groups.txt</code> shows both lines.",
        check: (ctx) => match(ctx, "lab12/sys-groups.txt", /^sys:/m) && match(ctx, "lab12/sys-groups.txt", /systemd-network/),
      },
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
      "You will often have two versions of a file and want to know: are they the same, and if not, what changed? Examples: two config files, a backup and the live copy, two drafts of a report. <code>diff</code> and <code>cmp</code> both answer that question, in different ways. The sample files are in <code>lab13</code>.",
    body: [
      {
        h: "diff — what changed",
        p: "<code>diff FILE1 FILE2</code> prints instructions for turning the first file into the second. Each change starts with a code: <strong>line-number, letter, line-number</strong>. The letter is <code>a</code> (added), <code>d</code> (deleted) or <code>c</code> (changed). <code>2c2</code> means &quot;line 2 of the first file was changed into line 2 of the second&quot;. Below it, lines starting with <code>&lt;</code> are the old version and lines starting with <code>&gt;</code> are the new version. If the files are identical, <code>diff</code> prints nothing.",
        cmds: [c("diff lab13/config-a.txt lab13/config-b.txt", "show what changed between two configs")],
        refs: [{ label: "diff(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/diff.1.html" }],
      },
      {
        h: "cmp — where do they first differ",
        p: "<code>cmp FILE1 FILE2</code> is a bit-by-bit comparison. If the files are identical it says <strong>nothing</strong> — silence means &quot;the same&quot;. If they differ it prints one line, such as <code>differ: byte 17, line 1</code>, naming the very first spot that does not match. Use it when you only care <em>whether</em> two files match.",
        cmds: [c("cmp lab13/identical-a.txt lab13/identical-b.txt", "no output: they match"), c("cmp lab13/report-v1.txt lab13/report-v2.txt", "shows the first difference")],
        refs: [{ label: "cmp(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/cmp.1.html" }],
      },
    ],
    tree: "lab13/\n├── config-a.txt\n├── config-b.txt\n├── identical-a.txt\n├── identical-b.txt\n├── report-v1.txt\n└── report-v2.txt",
    tasks: [
      {
        text: "Compare <code>config-a.txt</code> and <code>config-b.txt</code> and save what differs. Type <code>diff lab13/config-a.txt lab13/config-b.txt &gt; lab13/config-diff.txt</code>", hint: "<strong>What this does:</strong> <code>diff</code> compares the two config files and <code>&gt;</code> saves the report. <strong>You succeed when:</strong> <code>cat lab13/config-diff.txt</code> shows two changes, <code>2c2</code> (the port) and <code>4c4</code> (the timeout).",
        check: (ctx) => match(ctx, "lab13/config-diff.txt", /^2c2$/m) && match(ctx, "lab13/config-diff.txt", /^4c4$/m),
      },
      {
        text: "Check that the two <code>identical</code> files match, then record it. Type these one at a time:<br>1. <code>cmp lab13/identical-a.txt lab13/identical-b.txt</code><br>2. <code>echo IDENTICAL &gt; lab13/identical-result.txt</code><br>(The first command prints nothing when the files match. Silence means they are the same.)", hint: "<strong>What this does:</strong> <code>cmp</code> prints nothing when files are identical, so a blank result is your confirmation. Then <code>echo</code> records the word IDENTICAL. <strong>You succeed when:</strong> <code>cat lab13/identical-result.txt</code> shows <code>IDENTICAL</code>.",
        check: (ctx) => match(ctx, "lab13/identical-result.txt", /^IDENTICAL$/m),
      },
      {
        text: "Find the exact spot where the two reports first differ and save the message. Type <code>cmp lab13/report-v1.txt lab13/report-v2.txt &gt; lab13/report-cmp.txt 2&gt;&amp;1</code>", hint: "<strong>What this does:</strong> <code>cmp</code> reports the first difference. A plain <code>&gt;</code> only saves the normal output channel, so <code>2&gt;&amp;1</code> (see Lab 9) makes sure the message is saved whichever channel it comes out on. <strong>You succeed when:</strong> <code>cat lab13/report-cmp.txt</code> shows a line containing <code>differ: byte</code>. If the file is empty, you left off <code>2&gt;&amp;1</code>.",
        check: (ctx) => match(ctx, "lab13/report-cmp.txt", /differ: byte \d+, line 1/),
      },
      {
        text: "Compare the two reports line by line and save the result. Type <code>diff lab13/report-v1.txt lab13/report-v2.txt &gt; lab13/report-diff.txt</code>", hint: "<strong>What this does:</strong> <code>diff</code> shows the changed line: <code>1c1</code>, then the old sentence (<code>&lt;</code>) and the new one (<code>&gt;</code>). <strong>You succeed when:</strong> <code>cat lab13/report-diff.txt</code> mentions both <em>steady</em> and <em>strong</em>.",
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
      "In Lab 7 you learned <code>chmod</code>, which decides <em>what</em> the owner, the group and everyone else are allowed to do. This lab is about the other half: <em>who</em> the owner and the group actually are. Only the administrator can change that, using <code>chown</code>. Here some files were left belonging to the web-server account <code>www-data</code>, and you will hand them back.",
    body: [
      {
        h: "Two different questions",
        p: "<code>chmod</code> answers &quot;what is allowed?&quot;. <code>chown</code> answers &quot;who does the rule apply to?&quot;. A file can be open to everyone (mode 777) and still belong to the wrong person.<br><br>Run the command below and read the two name columns. In <code>ls -l</code> output, the <strong>third</strong> column is the owner and the <strong>fourth</strong> is the group. Right now both say <code>www-data</code>.",
        cmds: [c("ls -l lab14/site", "owner and group before anything changes")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
      {
        h: "Reassigning ownership",
        p: "<code>chown NEWOWNER FILE</code> changes only the owner. <code>chown NEWOWNER:NEWGROUP FILE</code> changes both, with a colon between them. Both require administrator rights, so they need <code>sudo</code>. The first command below fails (you are not the administrator), the second works, and the third changes owner and group together.",
        cmds: [c("chown labex lab14/site/index.html", "refused"), c("sudo chown labex lab14/site/index.html", "works"), c("sudo chown labex:www-data lab14/site/index.html", "owner and group together")],
        refs: [{ label: "chown(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chown.1.html" }],
      },
    ],
    tree: "lab14/\n└── site/\n    ├── index.html   (owned by www-data:www-data)\n    └── counter.log  (owned by www-data:www-data)",
    tasks: [
      {
        text: "The file <code>index.html</code> belongs to <code>www-data</code>. Make yourself (<code>labex</code>) the owner and the group. Type <code>sudo chown labex:labex lab14/site/index.html</code>", hint: "<strong>What this does:</strong> <code>labex:labex</code> means &quot;owner labex, group labex&quot;. <code>sudo</code> is required. <strong>You succeed when:</strong> <code>ls -l lab14/site</code> shows <code>labex labex</code> for <code>index.html</code>. <strong>Common mistake:</strong> leaving out <code>sudo</code>, because <code>chown</code> is refused for ordinary users.",
        check: (ctx) => owner(ctx, "lab14/site/index.html") === "labex" && group(ctx, "lab14/site/index.html") === "labex",
      },
      {
        text: "Make yourself the owner of <code>counter.log</code>, but leave its group alone. Type <code>sudo chown labex lab14/site/counter.log</code>", hint: "<strong>What this does:</strong> giving only a name (no colon) changes just the owner and leaves the group alone. <strong>You succeed when:</strong> <code>ls -l lab14/site</code> shows <code>labex www-data</code> for <code>counter.log</code>. <strong>Common mistake:</strong> using <code>labex:labex</code>, which changes the group too, and the web server needs that group.",
        check: (ctx) => owner(ctx, "lab14/site/counter.log") === "labex" && group(ctx, "lab14/site/counter.log") === "www-data",
      },
      {
        text: "Save a detailed list of the folder to prove it worked. Type <code>ls -l lab14/site &gt; lab14/ownership.txt</code>", hint: "<strong>What this does:</strong> saves the long listing as proof that both changes happened. <strong>You succeed when:</strong> <code>cat lab14/ownership.txt</code> shows a line for <code>index.html</code> and one for <code>counter.log</code>, and the second one shows <code>labex www-data</code>.",
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
    intro: "Adding a new teammate to a Linux system takes three steps: create their <strong>account</strong>, put them in the right <strong>groups</strong> (which control what they can access), and give them a <strong>password</strong>. Because these actions change the whole system, every one of them needs administrator rights, so each command starts with <code>sudo</code>.",
    body: [
      {
        h: "Creating an account",
        p: "<code>useradd -m -s /bin/bash NAME</code> creates a user.<br><code>-m</code> — <em>make</em> a home directory for the user (<code>/home/NAME</code>).<br><code>-s /bin/bash</code> — the <em>shell</em> the user gets when they log in. The shell is the program that reads their commands.<br><code>NAME</code> — the new user's login name.<br>Without <code>sudo</code> it says &quot;Permission denied&quot;. Then <code>id newhire</code> shows the new account's numbers.",
        cmds: [c("useradd newhire", "refused: not administrator"), c("sudo useradd -m -s /bin/bash newhire", "works"), c("id newhire", "look at the new account")],
        refs: [{ label: "useradd(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/useradd.8.html" }],
      },
      {
        h: "Changing an existing account",
        p: "<code>usermod</code> means <em>modify user</em>. <code>sudo usermod -aG sudo newhire</code> adds <code>newhire</code> to the group named <code>sudo</code>, which allows them to use <code>sudo</code> themselves.<br><code>-G</code> — the next word is a group list.<br><code>-a</code> — <em>append</em>: add this group without removing the others. <strong>Never leave off <code>-a</code></strong>, or the user is removed from all their other groups.<br>Check with <code>groups newhire</code>.",
        cmds: [c("sudo usermod -aG sudo newhire", "add to a group"), c("groups newhire", "confirm")],
        refs: [{ label: "usermod(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/usermod.8.html" }],
      },
      {
        h: "Setting a password",
        p: "A brand-new account has no usable password, so nobody can log in as it. <code>sudo passwd NAME</code> sets one. On a real Linux machine it asks you to type the new password twice and hides the letters as you type. In this practice sandbox it simply confirms that the password was updated.",
        cmds: [c("sudo passwd newhire", "set a password")],
        refs: [{ label: "passwd(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/passwd.1.html" }],
      },
    ],
    tasks: [
      {
        text: "Create a new user called <code>devops</code>. Type <code>sudo useradd -m -s /bin/bash devops</code>", hint: "<strong>What this does:</strong> <code>-m</code> creates the home folder <code>/home/devops</code> and <code>-s /bin/bash</code> gives the user the bash shell. <strong>You succeed when:</strong> <code>id devops</code> prints the account details. <strong>Common mistake:</strong> leaving off <code>sudo</code> (&quot;Permission denied&quot;).",
        check: (ctx) => !!passwdEntry(ctx, "devops") && dir(ctx, "/home/devops"),
      },
      { text: "Add <code>devops</code> to the <code>sudo</code> group. Type <code>sudo usermod -aG sudo devops</code> (keep the <code>-a</code>, it stops existing groups being removed).", hint: "<strong>What this does:</strong> <code>-aG sudo</code> means &quot;append the group <code>sudo</code>&quot;. <strong>You succeed when:</strong> <code>groups devops</code> lists <code>sudo</code>. <strong>Common mistake:</strong> writing <code>-G</code> without <code>-a</code>, which would replace the user's groups instead of adding one.", check: (ctx) => inGroup(ctx, "devops", "sudo") },
      {
        text: "Change <code>devops</code>'s shell to <code>/bin/sh</code>. Type <code>sudo usermod -s /bin/sh devops</code>", hint: "<strong>What this does:</strong> <code>-s</code> sets the login shell. <code>/bin/sh</code> is a simpler shell than bash. <strong>You succeed when:</strong> <code>grep '^devops:' /etc/passwd</code> ends with <code>/bin/sh</code>.",
        check: (ctx) => {
          const e = passwdEntry(ctx, "devops");
          return !!e && e.shell === "/bin/sh";
        },
      },
      { text: "Set a password for <code>devops</code>. Type <code>sudo passwd devops</code>. In this sandbox it just prints a confirmation. On a real machine it would ask for the password twice, with the letters hidden.", hint: "<strong>What this does:</strong> sets a password for <code>devops</code>. <strong>You succeed when:</strong> the sandbox prints <code>password updated successfully</code>. On a real machine you would be asked to type the password twice, and the letters stay invisible as you type.", check: (ctx) => shadowUnlocked(ctx, "devops") },
      { text: "Save the user's line from the user list. Type these one at a time:<br>1. <code>mkdir -p lab15</code><br>2. <code>grep '^devops:' /etc/passwd &gt; lab15/devops.txt</code>", hint: "<strong>What this does:</strong> step 1 makes the <code>lab15</code> folder. Step 2 uses <code>grep '^devops:'</code> to pick the one line starting with <code>devops:</code> from the user list, and saves it. <strong>You succeed when:</strong> <code>cat lab15/devops.txt</code> shows one line beginning <code>devops:</code> and ending in <code>/bin/sh</code>.", check: (ctx) => match(ctx, "lab15/devops.txt", /^devops:/) },
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
      "The closing case. Someone calling themselves &quot;the Joker&quot; left a trail through the files: a forged alibi meant to frame an innocent person, a note hidden in plain sight, and a final clue locked so tightly that ordinary users cannot read it. You will use nearly everything from the last few labs: creating a user, comparing files, permissions and <code>sudo</code>. Do the tasks in order, and read each task's hint if something confuses you.",
    body: [
      {
        h: "Setting up as investigator",
        p: "Every investigator needs an account for the record. Creating one uses <code>useradd</code> from Lab 15, and <code>id</code> from Lab 12 shows that it exists. <code>-m</code> gives the account a home folder and <code>-s /bin/bash</code> gives it the bash shell.",
        cmds: [c("sudo useradd -m -s /bin/bash detective", "create the account"), c("id detective", "check it exists")],
        refs: [{ label: "useradd(8) — man7.org", url: "https://man7.org/linux/man-pages/man8/useradd.8.html" }],
      },
      {
        h: "When a file is locked completely",
        p: "Mode <code>000</code> means nobody at all — owner, group or others — has read, write or execute permission. Ordinary users cannot even read such a file. The administrator (root) is not bound by these permission bits, so <code>sudo</code> can still read or change it. The clean way to fix a locked file is to change its mode with <code>sudo chmod</code>, so that you do not need <code>sudo</code> every time you open it.<br><br><code>sudo chmod 644 somefile</code> sets mode 644: owner can read and write, everyone else can read.",
        cmds: [c("sudo chmod 644 somefile", "give a locked file readable permissions")],
        refs: [{ label: "chmod(1) — man7.org", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" }],
      },
    ],
    tree:
      "lab16/\n├── .joker-note.txt   (hidden — ls -a)\n├── alibi-hale.txt\n├── alibi-quinn.txt\n├── alibi-reyes.txt\n└── vault/\n    └── final-clue.txt   (mode 000, owned by root)",
    tasks: [
      {
        text: "Create an investigator account called <code>detective</code>. Type <code>sudo useradd -m -s /bin/bash detective</code>", hint: "<strong>What this does:</strong> creates the user <code>detective</code> with a home folder (<code>-m</code>) and the bash shell (<code>-s</code>). <strong>You succeed when:</strong> <code>id detective</code> prints <code>uid=...(detective)</code>. It needs <code>sudo</code>.",
        check: (ctx) => !!passwdEntry(ctx, "detective") && dir(ctx, "/home/detective"),
      },
      { text: "Save information about the new account. Type <code>id detective &gt; lab16/detective-id.txt</code>", hint: "<strong>What this does:</strong> <code>id detective</code> prints the new account's identity and <code>&gt;</code> saves it. <strong>You succeed when:</strong> <code>cat lab16/detective-id.txt</code> shows <code>uid=...(detective)</code>.", check: (ctx) => match(ctx, "lab16/detective-id.txt", /uid=\d+\(detective\)/) },
      {
        text: "Find and copy the hidden note. Type these one at a time:<br>1. <code>ls -a lab16</code><br>2. <code>cat lab16/.joker-note.txt &gt; lab16/note.txt</code><br>(<code>ls -a</code> shows hidden files, which start with a dot.)", hint: "<strong>What this does:</strong> <code>ls -a lab16</code> reveals hidden files (names starting with a dot). You will see <code>.joker-note.txt</code>. <code>cat</code> reads it and <code>&gt;</code> copies its text into a normal file. <strong>You succeed when:</strong> <code>cat lab16/note.txt</code> shows the note about the gardener. Remember to include the dot in the file name.",
        check: (ctx) => match(ctx, "lab16/note.txt", /gardener/),
      },
      {
        text: "Two alibi letters are exact copies. Compare them in pairs. A pair that prints nothing is identical. Type these one at a time:<br>1. <code>cmp lab16/alibi-hale.txt lab16/alibi-quinn.txt</code><br>2. <code>cmp lab16/alibi-hale.txt lab16/alibi-reyes.txt</code><br>3. <code>echo \"alibi-hale.txt\" &gt; lab16/forged-pair.txt</code><br>4. <code>echo \"alibi-reyes.txt\" &gt;&gt; lab16/forged-pair.txt</code><br>(Steps 3 and 4 save the two file names that matched. Write down the pair you found.)", hint: "<strong>What this does:</strong> <code>cmp</code> prints nothing when two files are identical, so the pair that gives no output is the forgery. Here the alibi files for <code>hale</code> and <code>reyes</code> match. The two <code>echo</code> commands save both names (first with <code>&gt;</code>, second with <code>&gt;&gt;</code>). <strong>You succeed when:</strong> <code>cat lab16/forged-pair.txt</code> lists both names.",
        check: (ctx) => match(ctx, "lab16/forged-pair.txt", /alibi-hale\.txt/) && match(ctx, "lab16/forged-pair.txt", /alibi-reyes\.txt/),
      },
      {
        text: "The clue file is locked. Unlock it as administrator, then read it and save it. Type these one at a time:<br>1. <code>sudo chmod 644 lab16/vault/final-clue.txt</code><br>2. <code>cat lab16/vault/final-clue.txt &gt; lab16/solution.txt</code>", hint: "<strong>What this does:</strong> <code>sudo chmod 644</code> unlocks the file so it can be read, then <code>cat</code> shows it and <code>&gt;</code> saves it. <strong>You succeed when:</strong> <code>ls -l lab16/vault</code> shows <code>-rw-r--r--</code> and <code>cat lab16/solution.txt</code> shows the final clue. <strong>Common mistake:</strong> leaving off <code>sudo</code> on <code>chmod</code>, because the file belongs to root.",
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

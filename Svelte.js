// School-safe Svelte component creation via CDN
const { onMount, createEventDispatcher } = svelte;

const app = new svelte.Component({
  target: document.getElementById('app'),
  data: {},
  template: `
    <div>
      <!-- Login -->
      {#if !booted}
        <div class="h-screen flex items-center justify-center bg-gradient-to-b from-emerald-700 to-emerald-900">
          <div class="bg-neutral-900 p-6 rounded text-center shadow-2xl">
            <div class="text-lg mb-4">Linux Mint 21 Cinnamon</div>
            <button class="bg-emerald-400 text-black px-4 py-2 rounded hover:bg-emerald-300"
                    on:click="boot()">
              Login
            </button>
          </div>
        </div>
      {:else}
        <!-- Desktop -->
        <div class="h-screen w-screen relative">
          <!-- Panel -->
          <div class="h-10 bg-neutral-800 flex items-center px-3 select-none">
            <div class="bg-emerald-400 text-black px-3 py-1 rounded cursor-pointer" on:click="toggleMenu()">
              Menu
            </div>
            <div class="ml-3 text-sm">mint@mint</div>
          </div>
          
          <!-- Menu -->
          {#if showMenu}
          <div class="absolute top-10 left-2 bg-neutral-900 rounded p-2 shadow-xl">
            <div class="px-3 py-1 cursor-pointer hover:bg-emerald-400 hover:text-black rounded"
                 on:click="newTerminal()">
              Terminal
            </div>
            <div class="px-3 py-1 cursor-pointer hover:bg-emerald-400 hover:text-black rounded"
                 on:click="openFiles()">
              Files
            </div>
          </div>
          {/if}

          <!-- Windows container -->
          <div id="windows"></div>
        </div>
      {/if}
    </div>
  `,
  methods: {
    boot() { this.set({ booted: true }); },
    toggleMenu() { this.set({ showMenu: !this.get('showMenu') }); },
    newTerminal() { createTerminalWindow(); },
    openFiles() { createFileWindow(); }
  },
  data: { booted: false, showMenu: false }
});

// ---------- Simulator Logic ----------
let cwd = "/home/mint";
let fs = {
  "/home/mint": {
    "Documents": { type: "dir" },
    "script.sh": { type: "file", perm: "-rwxr-xr-x", content: "echo Hello" }
  }
};
let zIndex = 10;

function createWindow(title, html, x=100, y=100) {
  const win = document.createElement("div");
  win.className = "window absolute bg-neutral-900 rounded w-[640px]";
  win.style.left = x + "px";
  win.style.top = y + "px";
  win.style.zIndex = ++zIndex;
  win.innerHTML = `
    <div class="titlebar bg-emerald-400 text-black px-2 py-1 cursor-move rounded-t">${title}</div>
    <div class="p-2 bg-black text-green-400 h-[300px] overflow-y-auto">${html}</div>
  `;
  document.getElementById("windows").appendChild(win);
  dragWindow(win);
  return win;
}

function dragWindow(win) {
  const bar = win.querySelector(".titlebar");
  bar.onmousedown = e => {
    const ox = e.clientX - win.offsetLeft;
    const oy = e.clientY - win.offsetTop;
    document.onmousemove = ev => {
      win.style.left = ev.clientX - ox + "px";
      win.style.top = ev.clientY - oy + "px";
    };
    document.onmouseup = () => document.onmousemove = null;
  };
}

function createTerminalWindow() {
  const win = createWindow("Terminal — mint@mint", `<div id="term">mint@mint:~$<br></div><input class="w-full bg-black text-green-400 outline-none mt-1" id="cmd">`, 60, 80);
  const term = win.querySelector("#term");
  const input = win.querySelector("#cmd");
  input.onkeydown = e => {
    if(e.key === "Enter") {
      const cmd = input.value.trim();
      term.innerHTML += `mint@mint:${cwd}$ ${cmd}<br>`;
      executeCommand(cmd, term);
      input.value = "";
      term.scrollTop = term.scrollHeight;
    }
  };
}

function createFileWindow() {
  createWindow("Files", `<div id="files"></div>`, 740, 80);
  refreshFiles();
}

function refreshFiles() {
  const f = document.getElementById("files");
  if (!f) return;
  f.innerHTML = `<b>${cwd}</b><br>`;
  for (let x in fs[cwd]) f.innerHTML += `📄 ${x}<br>`;
}

function executeCommand(cmd, term) {
  const args = cmd.split(" ");
  switch(args[0]) {
    case "ls":
      term.innerHTML += Object.keys(fs[cwd] || {}).join(" ") + "<br>";
      break;
    case "pwd":
      term.innerHTML += cwd + "<br>";
      break;
    case "whoami":
      term.innerHTML += "mint<br>";
      break;
    case "touch":
      fs[cwd][args[1]] = { type:"file", perm:"-rw-r--r--", content:"" };
      refreshFiles();
      break;
    case "rm":
      delete fs[cwd][args[1]];
      refreshFiles();
      break;
    case "chmod":
      if(fs[cwd][args[2]]) fs[cwd][args[2]].perm = "-rwxrwxrwx";
      break;
    case "sudo":
      term.innerHTML += "sudo: simulated privileges granted<br>";
      break;
    case "apt":
      term.innerHTML += "Reading package lists... Done (simulation)<br>";
      break;
    case "clear":
      term.innerHTML = "";
      break;
    default:
      term.innerHTML += "command not found<br>";
  }
}

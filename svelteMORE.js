const { onMount, createEventDispatcher } = svelte;

// ---------- APP STATE ----------
let windowsContainer;
let zIndex = 10;
let cwd = "/home/mint";
let fs = {
  "/home/mint": {
    "Documents": { type: "dir" },
    "script.sh": { type: "file", perm: "-rwxr-xr-x", content: "echo Hello" }
  }
};

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="loginScreen" class="h-screen flex items-center justify-center bg-gradient-to-b from-emerald-700 to-emerald-900">
      <div class="bg-neutral-900 p-6 rounded text-center shadow-2xl">
        <div class="text-lg mb-4">Linux Mint 21 Cinnamon</div>
        <button id="loginBtn" class="bg-emerald-400 text-black px-4 py-2 rounded hover:bg-emerald-300">Login</button>
      </div>
    </div>
    <div id="desktop" class="hidden h-screen w-screen relative">
      <div id="panel" class="flex items-center justify-between px-3 h-10 bg-neutral-800 select-none">
        <div id="menuBtn" class="bg-emerald-400 text-black px-3 py-1 rounded cursor-pointer">Menu</div>
        <div id="tray" class="flex items-center space-x-2 text-sm text-green-200">
          <span id="clock">12:00</span>
          <span>🔊</span>
          <span>📶</span>
        </div>
      </div>
      <div id="menu" class="hidden absolute top-10 left-2 bg-neutral-900 rounded p-2 shadow-xl">
        <div id="openTerm" class="px-3 py-1 cursor-pointer hover:bg-emerald-400 hover:text-black rounded">Terminal</div>
        <div id="openFiles" class="px-3 py-1 cursor-pointer hover:bg-emerald-400 hover:text-black rounded">Files</div>
      </div>
      <div id="windows"></div>
    </div>
  `;

  document.getElementById("loginBtn").onclick = boot;
  document.getElementById("menuBtn").onclick = toggleMenu;
  document.getElementById("openTerm").onclick = createTerminalWindow;
  document.getElementById("openFiles").onclick = createFileWindow;

  windowsContainer = document.getElementById("windows");
  updateClock();
});

// ---------- CLOCK ----------
function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;
  const now = new Date();
  clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  setTimeout(updateClock, 1000);
}

// ---------- LOGIN ----------
function boot() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("desktop").classList.remove("hidden");
}

// ---------- MENU ----------
function toggleMenu() {
  document.getElementById("menu").classList.toggle("hidden");
}

// ---------- WINDOW SYSTEM ----------
function createWindow(title, contentHTML, x=100, y=100) {
  const win = document.createElement("div");
  win.className = "window absolute bg-neutral-900 rounded w-[640px]";
  win.style.left = x + "px";
  win.style.top = y + "px";
  win.style.zIndex = ++zIndex;

  win.innerHTML = `
    <div class="titlebar bg-emerald-400 text-black px-2 py-1 flex justify-between items-center cursor-move">
      <span>${title}</span>
      <div class="flex space-x-1">
        <button onclick="minimizeWindow(this)">—</button>
        <button onclick="maximizeWindow(this)">⬜</button>
        <button onclick="closeWindow(this)">×</button>
      </div>
    </div>
    <div class="p-2 bg-black text-green-400 h-[300px] overflow-y-auto">${contentHTML}</div>
  `;

  windowsContainer.appendChild(win);
  dragWindow(win);
  return win;
}

// ---------- WINDOW BUTTONS ----------
function minimizeWindow(btn) {
  const win = btn.closest(".window");
  const content = win.querySelector("div:nth-child(2)");
  content.style.display = content.style.display === "none" ? "block" : "none";
}
function maximizeWindow(btn) {
  const win = btn.closest(".window");
  if (win.dataset.maximized === "true") {
    win.style.width = "640px";
    win.style.height = "auto";
    win.dataset.maximized = "false";
  } else {
    win.style.width = "100%";
    win.style.height = "calc(100% - 40px)";
    win.style.left = "0px";
    win.style.top = "40px";
    win.dataset.maximized = "true";
  }
}
function closeWindow(btn) {
  const win = btn.closest(".window");
  win.remove();
}

// ---------- DRAGGING ----------
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

// ---------- TERMINAL ----------
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

// ---------- FILE MANAGER ----------
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

// ---------- TERMINAL LOGIC ----------
function executeCommand(cmd, term) {
  const args = cmd.split(" ");
  switch(args[0]) {
    case "ls": term.innerHTML += Object.keys(fs[cwd]||{}).join(" ")+"<br>"; break;
    case "pwd": term.innerHTML += cwd+"<br>"; break;
    case "whoami": term.innerHTML += "mint<br>"; break;
    case "touch": fs[cwd][args[1]]={type:"file",perm:"-rw-r--r--",content:""}; refreshFiles(); break;
    case "rm": delete fs[cwd][args[1]]; refreshFiles(); break;
    case "chmod": if(fs[cwd][args[2]]) fs[cwd][args[2]].perm="-rwxrwxrwx"; break;
    case "sudo": term.innerHTML += "sudo: simulated privileges granted<br>"; break;
    case "apt": term.innerHTML += "Reading package lists... Done (simulation)<br>"; break;
    case "clear": term.innerHTML = ""; break;
    default: term.innerHTML += "command not found<br>";
  }
}

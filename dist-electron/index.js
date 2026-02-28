import { app as e, BrowserWindow as r } from "electron";
import o from "node:path";
import { fileURLToPath as a } from "node:url";
const i = o.dirname(a(import.meta.url)), n = () => {
  const t = new r({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: "NoteAI",
    webPreferences: {
      preload: o.join(i, "../preload/index.js"),
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !0
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    t.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  }
  t.loadFile(o.join(i, "../../dist/index.html"));
};
e.whenReady().then(() => {
  n(), e.on("activate", () => {
    r.getAllWindows().length === 0 && n();
  });
});
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});

export async function openBrowserImageDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    showOpenFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle[]>;
  };
  if (typeof w.showOpenFilePicker === "function") {
    try {
      const handles = await w.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "Image",
            accept: {
              "image/png": [".png"],
              "image/jpeg": [".jpg", ".jpeg"],
              "image/webp": [".webp"],
              "image/gif": [".gif"],
            },
          },
        ],
      });
      const handle = handles[0];
      if (!handle) return null;
      const file = await handle.getFile();
      return await new Promise<string | null>((resolve) => {
        const fr = new FileReader();
        fr.onload = () =>
          resolve(typeof fr.result === "string" ? fr.result : null);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
    let settled = false;
    const finish = (v: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      window.removeEventListener("focus", onWinFocus);
      resolve(v);
    };
    const onWinFocus = () => {
      setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0))
          finish(null);
      }, 320);
    };
    window.addEventListener("focus", onWinFocus);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      const fr = new FileReader();
      fr.onload = () =>
        finish(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => finish(null);
      fr.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}

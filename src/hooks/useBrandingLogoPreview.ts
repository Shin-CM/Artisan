import * as React from "react";
import * as api from "@/lib/api";

export function useBrandingLogoPreview(
  workspaceId: string | undefined,
  logoRelativePath: string,
): string | null {
  const [logoPreviewDataUrl, setLogoPreviewDataUrl] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (!workspaceId || !logoRelativePath.trim()) {
      setLogoPreviewDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const b64 = await api.readWorkspaceAssetBase64(
          workspaceId,
          logoRelativePath.trim(),
        );
        if (cancelled) return;
        setLogoPreviewDataUrl(b64);
      } catch {
        if (!cancelled) setLogoPreviewDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, logoRelativePath]);

  return logoPreviewDataUrl;
}

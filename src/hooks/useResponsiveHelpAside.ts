import * as React from "react";

export function useResponsiveHelpAside({
  desktopQuery = "(min-width: 1024px)",
}: {
  desktopQuery?: string;
} = {}) {
  const [isHelpOpen, setIsHelpOpen] = React.useState(true);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(desktopQuery);
    const sync = () => setIsHelpOpen(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, [desktopQuery]);

  return {
    isHelpOpen,
    setIsHelpOpen,
    toggleHelp: () => setIsHelpOpen((value) => !value),
  };
}

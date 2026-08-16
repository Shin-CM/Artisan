import { useWorkspace } from "@/context/WorkspaceContext";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { CalendarHolidaySourceSettings } from "@/pages/calendar/CalendarHolidaySourceSettings";
import {
  useCalendarPrefs,
} from "@/pages/calendar/calendarPrefs";
import { useCalendarHolidayLayer } from "@/pages/calendar/useCalendarHolidayLayer";

export function SettingsCalendarPage() {
  const { active } = useWorkspace();
  const [prefs, patchPrefs] = useCalendarPrefs();
  const cursorYear = new Date().getFullYear();
  const { busy: holidaySyncBusy, syncNow: syncHolidaysFromNetwork } =
    useCalendarHolidayLayer(prefs, cursorYear);

  if (!active) {
    return (
      <div className="text-sm text-[var(--color-muted-foreground)]">
        Aucun espace sélectionné.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <PageTitleWithInfo
        description="Fériés publics suisses et vacances scolaires au choix (Suisse par canton ou France zones A/B/C, OpenHolidays). Les options d’affichage et les restrictions sur la grille se configurent dans le panneau Paramètres du calendrier."
      >
        <h1 className="text-xl font-semibold">Calendrier</h1>
      </PageTitleWithInfo>
      <CalendarHolidaySourceSettings
        prefs={prefs}
        onPatch={patchPrefs}
        holidaySyncBusy={holidaySyncBusy}
        onHolidaySyncNow={() => void syncHolidaysFromNetwork(true)}
      />
    </div>
  );
}

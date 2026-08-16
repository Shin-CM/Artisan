import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FRENCH_SCHOOL_ZONE_OPTIONS,
  type CalendarPrefs,
  type FrenchSchoolZone,
  type SchoolVacationRegion,
  type SwissPublicHolidayScope,
} from "./calendarPrefs";
import {
  Section,
  Segmented,
  ToggleRow,
  SWISS_CANTON_CODES,
} from "./CalendarPrefsForm";

/**
 * Bloc « source » fériés / vacances (OpenHolidays) : portée API CH, vacances
 * scolaires CH ou FR, réseau, URL. Affichage et restrictions restent dans le
 * panneau calendrier.
 */
export function CalendarHolidaySourceSettings({
  prefs,
  onPatch,
  holidaySyncBusy,
  onHolidaySyncNow,
}: {
  prefs: CalendarPrefs;
  onPatch: (patch: Partial<CalendarPrefs>) => void;
  holidaySyncBusy: boolean;
  onHolidaySyncNow: () => void | Promise<void>;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-4 text-sm">
      <Section title="Fériés & vacances">
        <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          Fériés publics suisses (données locales + API) ; vacances scolaires au
          choix calendrier suisse (par canton) ou français (zones A/B/C, données
          réseau). Cache 24 h. Les interrupteurs d’affichage et les restrictions
          sur la grille se règlent depuis le calendrier (panneau Paramètres).
        </p>
        <div className="text-[11px] text-[var(--color-muted-foreground)]">
          Portée fériés publics (API)
        </div>
        <Segmented<SwissPublicHolidayScope>
          value={prefs.chPublicScope}
          options={[
            { value: "federal", label: "Fédéral" },
            { value: "canton", label: "Canton" },
          ]}
          onChange={(v) => {
            onPatch({
              chPublicScope: v,
              chPublicCanton:
                v === "canton" ? (prefs.chPublicCanton ?? "ZH") : prefs.chPublicCanton,
            });
          }}
        />
        {prefs.chPublicScope === "canton" ? (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              Canton (public)
            </span>
            <select
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
              value={prefs.chPublicCanton ?? "ZH"}
              onChange={(e) => onPatch({ chPublicCanton: e.target.value })}
            >
              {SWISS_CANTON_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="text-[11px] text-[var(--color-muted-foreground)]">
          Vacances scolaires affichées sur la grille
        </div>
        <Segmented<SchoolVacationRegion>
          value={prefs.schoolVacationRegion}
          options={[
            { value: "CH", label: "Suisse" },
            { value: "FR", label: "France" },
          ]}
          onChange={(v) => onPatch({ schoolVacationRegion: v })}
        />
        {prefs.schoolVacationRegion === "CH" ? (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              Canton (vacances scolaires)
            </span>
            <select
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
              value={prefs.chSchoolCanton.replace(/^CH-/, "")}
              onChange={(e) => onPatch({ chSchoolCanton: e.target.value })}
            >
              {SWISS_CANTON_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <Segmented<FrenchSchoolZone>
              value={prefs.frSchoolZone}
              options={FRENCH_SCHOOL_ZONE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={(v) => onPatch({ frSchoolZone: v })}
            />
            <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">
              Les vacances françaises ne sont pas embarquées dans l’app : activez
              la mise à jour réseau pour les charger (OpenHolidays).
            </p>
          </>
        )}
        <ToggleRow
          label="Mise à jour réseau (OpenHolidays)"
          checked={prefs.holidayFetchEnabled}
          onChange={(v) => onPatch({ holidayFetchEnabled: v })}
        />
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--color-muted-foreground)]">
            URL de base personnalisée (optionnel)
          </span>
          <Input
            placeholder="https://openholidaysapi.org"
            value={prefs.holidayCustomApiBaseUrl ?? ""}
            onChange={(e) =>
              onPatch({
                holidayCustomApiBaseUrl: e.target.value.trim()
                  ? e.target.value.trim()
                  : null,
              })
            }
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full max-w-sm"
          disabled={holidaySyncBusy}
          onClick={() => void onHolidaySyncNow()}
        >
          {holidaySyncBusy ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : null}
          Vérifier maintenant (forcer la synchro)
        </Button>
      </Section>
    </div>
  );
}

import { Fragment, useMemo, type ReactElement } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { Button } from "./Button";
import { chrome } from "./layout/chromeTheme";
import { SelectedCount } from "./SelectedCount";
import logoUrl from "../assets/fotonoza-logo.svg";
import { AppMode } from "../types/domain";
import { useImport } from "../hooks/useImport";
import { UndoIcon } from "./icons/UndoIcon";
import { RedoIcon } from "./icons/RedoIcon";
import { ExportIcon } from "./icons/ExportIcon";

const getModes = (locale: "en" | "pl") => ({
  view: {
    label: t(locale, (m) => m.mode.view),
  },
  edit: {
    label: t(locale, (m) => m.mode.edit),
  },
});

export function TopBar({
  onOpenExport,
}: {
  onOpenExport: () => void;
}): ReactElement {
  const { locale, mode } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const { pickImportFiles } = useImport();

  const modeEntries = useMemo(() => Object.entries(getModes(locale)), [locale]);

  return (
    <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-3 pl-1 pr-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <img
          src={logoUrl}
          alt={t(locale, (m) => m.appTitle)}
          className="h-8 w-8 shrink-0 select-none pl-1"
        />

        <div className="hidden shrink-0 items-center overflow-hidden rounded sm:flex">
          {modeEntries.map(([key, value], index) => (
            <Fragment key={key}>
              <Button
                variant="subtleText"
                size="xs"
                disabled={mode === key}
                onClick={() => actions.setMode(key as AppMode)}
              >
                <span className="uppercase tracking-wide text-nowrap">{value.label}</span>
              </Button>
              {index < modeEntries.length - 1 && (
                <span className="h-4 border-l border-neutral-600/70" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <SelectedCount />

      <div
        className={`flex flex-wrap items-center justify-end gap-2 text-sm ${chrome.mutedText}`}
      >
        <Button
          variant="subtle"
          size="md"
          iconOnly
          aria-label={t(locale, (m) => m.actions.undo)}
          title={t(locale, (m) => m.actions.undo)}
          onClick={actions.undo}
        >
          <UndoIcon />
        </Button>

        <Button
          variant="subtle"
          size="md"
          iconOnly
          aria-label={t(locale, (m) => m.actions.redo)}
          title={t(locale, (m) => m.actions.redo)}
          onClick={actions.redo}
        >
          <RedoIcon />
        </Button>

        <Button
          variant="outlined"
          size="md"
          aria-label={t(locale, (m) => m.actions.importFromDevice)}
          title={t(locale, (m) => m.actions.importFromDevice)}
          onClick={() => void pickImportFiles()}
        >
          Import
        </Button>

        <Button
          variant="outlined"
          size="md"
          iconOnly
          aria-label={t(locale, (m) => m.actions.export)}
          title={t(locale, (m) => m.actions.export)}
          onClick={onOpenExport}
        >
          <ExportIcon />
        </Button>
      </div>
    </div>
  );
}

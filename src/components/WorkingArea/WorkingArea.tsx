import type { ReactElement } from "react";
import { t } from "../../lib/i18n";
import { useAppStore } from "../../store/appStore";
import { chrome } from "../layout/chromeTheme";
import { GridColsProvider } from "./components/GridCols";
import { EditModeArea } from "./EditModeArea";
import type { EditModeModel } from "./hooks/useEditMode";
import { useViewGridLayout } from "./hooks/useViewGridLayout";
import { ViewModeArea } from "./ViewModeArea";

export function WorkingArea({ edit }: { edit: EditModeModel }): ReactElement {
  const { mode, locale } = useAppStore((s) => s.present);
  const viewGrid = useViewGridLayout();

  return (
    <GridColsProvider>
      {mode === "import" ? (
        <section className="grid flex-1 place-items-center">
          <div className={`text-center text-sm ${chrome.mutedText}`}>
            {t(locale, (m) => m.actions.importFromDevice)}
          </div>
        </section>
      ) : mode === "view" ? (
        <ViewModeArea {...viewGrid} />
      ) : (
        <EditModeArea {...edit} />
      )}
    </GridColsProvider>
  );
}

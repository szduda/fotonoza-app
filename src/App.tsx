import { useEffect, useState, type ReactElement } from "react"
import logoUrl from "@/assets/fotonoza-logo.svg"
import { AppLayout } from "./components/AppLayout"
import { Spinner } from "./components/generic/Spinner"
import { t } from "./lib/i18n"
import { useAppStore } from "./store/appStore"

const App = (): ReactElement => {
  const initialize = useAppStore((state) => state.actions.initialize)
  const isBooting = useAppStore((state) => state.isBooting)
  const locale = useAppStore((state) => state.present.locale)
  const [showOverlay, setShowOverlay] = useState(true)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (isBooting) {
      setShowOverlay(true)
      return
    }
    const hideTimer = window.setTimeout(() => {
      setShowOverlay(false)
    }, 1000)
    return () => window.clearTimeout(hideTimer)
  }, [isBooting])

  return (
    <>
      <AppLayout />
      {showOverlay && (
        <div
          className={`fixed inset-0 z-[100000] flex items-center justify-center bg-neutral-900 transition-opacity duration-1000 delay-300 ease-in ${
            isBooting ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <img
              src={logoUrl}
              alt={t(locale, (m) => m.appTitle)}
              className="h-[72px] w-[72px] select-none"
            />
            <h1 className="text-lg font-semibold tracking-wide text-neutral-200">
              {t(locale, (m) => m.appTitle)}
            </h1>
            <Spinner
              className="static flex h-8 w-8 items-center justify-center"
              sizeClassName="h-5 w-5"
            />
          </div>
        </div>
      )}
    </>
  )
}
export default App

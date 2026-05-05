import { useEffect, type ReactElement } from "react"
import { AppLayout } from "./components/AppLayout"
import { useAppStore } from "./store/appStore"

const App = (): ReactElement => {
  const initialize = useAppStore((state) => state.actions.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return <AppLayout />
}
export default App

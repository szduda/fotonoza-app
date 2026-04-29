import { useEffect } from "react";
import { AppLayout } from "./components/AppLayout";
import { useAppStore } from "./store/appStore";

export default function App(): JSX.Element {
  const initialize = useAppStore((state) => state.actions.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <AppLayout />;
}

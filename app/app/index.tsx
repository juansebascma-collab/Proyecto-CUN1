import { useRouter } from "expo-router";
import { AppShell } from "../src/components/AppShell";
import { ErrorState } from "../src/components/ErrorState";
import { LoadingState } from "../src/components/LoadingState";
import { DashboardScreen } from "../src/screens/DashboardScreen";
import { useHemoRedData } from "../src/hooks/useHemoRedData";
export default function Home() {
  const { loading, error, data } = useHemoRedData();
  const router = useRouter();
  return (
    <AppShell title="Resumen general">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <DashboardScreen data={data} navigate={(p) => router.push(p as any)} />
      )}
    </AppShell>
  );
}

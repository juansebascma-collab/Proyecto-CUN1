import { useRouter } from "expo-router";
import { AppShell } from "../src/components/AppShell";
import { ErrorState } from "../src/components/ErrorState";
import { LoadingState } from "../src/components/LoadingState";
import { DonorsScreen } from "../src/screens/DonorsScreen";
import { useHemoRedData } from "../src/hooks/useHemoRedData";
export default function Donors() {
  const { loading, error, data } = useHemoRedData();
  const router = useRouter();
  return (
    <AppShell title="Red de donantes">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <DonorsScreen
          donors={data.donors}
          navigate={(p) => router.push(p as any)}
        />
      )}
    </AppShell>
  );
}

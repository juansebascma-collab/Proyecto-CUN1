import { useRouter } from "expo-router";
import { AppShell } from "../../src/components/AppShell";
import { NewUnitScreen } from "../../src/screens/NewUnitScreen";
export default function NewUnit() {
  const router = useRouter();
  return (
    <AppShell title="Registrar unidad">
      <NewUnitScreen navigate={(p) => router.push(p as any)} />
    </AppShell>
  );
}

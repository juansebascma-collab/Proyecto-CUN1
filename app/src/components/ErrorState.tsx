import { Text, View } from "react-native";
export function ErrorState({ message }: { message: string }) {
  return (
    <View style={{ backgroundColor: "#FFF0F1", padding: 16, borderRadius: 10 }}>
      <Text style={{ color: "#C14E58" }}>{message}</Text>
    </View>
  );
}

import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
export default function OrderDetailScreen() { const { id } = useLocalSearchParams<{id:string}>(); return <View style={{flex:1,alignItems:"center",justifyContent:"center"}}><Text>Order #{id}</Text></View>; }

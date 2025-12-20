import { Text } from "react-native";



function RequiredLabel({ label }: { label: string }) {
  return (
    <Text className="text-caption text-text mb-1 font-bold">
      {label} <Text className="text-red-500">*</Text>
    </Text>
  )
}

export default RequiredLabel
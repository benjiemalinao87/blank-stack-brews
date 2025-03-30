import React from "react";
import { VStack, Button, Text } from "@chakra-ui/react";
interface SettingsProps {
  onBackgroundChange: (background: string) => void;
}
export function Settings({
  onBackgroundChange
}: SettingsProps) {
  const backgrounds = ["/images/calm-nature.jpg", "/images/mountain-lake.jpg", "/images/forest-path.jpg"];
  return <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Settings
      </Text>
      {backgrounds.map(bg => <Button key={bg} onClick={() => onBackgroundChange(bg)} variant="ghost" size="md">
          Change Background
        </Button>)}
    </VStack>;
}
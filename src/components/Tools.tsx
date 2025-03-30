import React from "react";
import { VStack, Text } from "@chakra-ui/react";
import StatusConfig from "./tools/StatusConfig";

export function Tools() {
  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Tools
      </Text>
      <StatusConfig />
    </VStack>
  );
}
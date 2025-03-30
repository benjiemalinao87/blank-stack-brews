import React from "react";
import { Box } from "@chakra-ui/react";
export const BackgroundManager: React.FC = () => {
  return <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={-1} />;
};
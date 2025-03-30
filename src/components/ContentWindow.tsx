import React from "react";
import { Box } from "@chakra-ui/react";
import { Rnd } from "react-rnd";
interface ContentWindowProps {
  children: React.ReactNode;
  onClose: () => void;
}
export function ContentWindow({
  children,
  onClose
}: ContentWindowProps) {
  return <Rnd default={{
    x: window.innerWidth / 2 - 250,
    y: window.innerHeight / 2 - 200,
    width: 500,
    height: 400
  }} minWidth={300} minHeight={200} bounds="window">
      <Box w="100%" h="100%" bg="rgba(255, 255, 255, 0.8)" backdropFilter="blur(10px)" borderRadius="xl" boxShadow="xl" p={4} position="relative">
        {children}
      </Box>
    </Rnd>;
}
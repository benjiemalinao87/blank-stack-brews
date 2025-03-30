
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';

const Index = () => {
  return (
    <Box as="main" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="container.md">
        <VStack spacing={6} textAlign="center">
          <Heading as="h1" size="2xl">Welcome to your React ES Module App</Heading>
          <Text fontSize="xl">A minimal React application using ES modules and Chakra UI</Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Index;

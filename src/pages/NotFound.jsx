
import React from 'react';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Box as="main" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="container.md">
        <VStack spacing={6} textAlign="center">
          <Heading as="h1" size="2xl">404</Heading>
          <Text fontSize="xl">Oops! Page not found</Text>
          <Button colorScheme="blue" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFound;

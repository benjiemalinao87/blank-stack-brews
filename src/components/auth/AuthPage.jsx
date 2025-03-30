import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (loading) return;

    if (user) {
      const from = location.state?.from?.pathname || '/';
      logger.info('User authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="md">
        <VStack
          spacing={8}
          bg={bgColor}
          p={8}
          borderRadius="lg"
          boxShadow="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <Heading size="lg">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Heading>

          {isLogin ? <LoginForm /> : <SignupForm />}

          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            color="blue.500"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default AuthPage;
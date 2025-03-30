import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmail } from '../../lib/supabaseUnified';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      logger.info('Attempting login for user:', email);
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        logger.error('Login failed:', error.message);
        toast({
          title: 'Login failed',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (data?.user) {
        logger.info('Login successful');
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
        });
        navigate('/');
      }
    } catch (error) {
      logger.error('Unexpected error during login:', error);
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <InputRightElement>
              <IconButton
                variant="ghost"
                icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          fontSize="md"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </VStack>
    </form>
  );
}; 
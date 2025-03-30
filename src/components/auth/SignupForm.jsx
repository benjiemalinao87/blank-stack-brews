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
import { signUpWithEmail } from '../../lib/supabaseUnified';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';

export const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        toast({
          title: 'Passwords do not match',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        toast({
          title: 'Password too short',
          description: 'Password must be at least 8 characters long',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      logger.info('Attempting signup for user:', email);
      const { data, error } = await signUpWithEmail(email, password);

      if (error) {
        logger.error('Signup failed:', error.message);
        toast({
          title: 'Signup failed',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (data?.user) {
        logger.info('Signup successful');
        toast({
          title: 'Signup successful',
          description: 'Please check your email for verification',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/');
      }
    } catch (error) {
      logger.error('Unexpected error during signup:', error);
      toast({
        title: 'Signup failed',
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

        <FormControl isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
            <InputRightElement>
              <IconButton
                variant="ghost"
                icon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
          Create Account
        </Button>
      </VStack>
    </form>
  );
}; 
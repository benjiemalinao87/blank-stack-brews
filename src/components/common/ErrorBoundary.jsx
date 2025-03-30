import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

/**
 * Error Boundary component to catch render errors in child components
 * Does NOT affect:
 * - Event handlers (onClick, etc.)
 * - Async code (setTimeout, promises, etc.)
 * - Server side rendering
 * - Errors thrown in the error boundary itself
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to service or console
    console.error('Error caught by boundary:', {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <Box 
          p={4} 
          borderRadius="md" 
          bg="red.50" 
          border="1px solid" 
          borderColor="red.200"
        >
          <Text color="red.600" mb={2} fontWeight="medium">
            {this.props.errorMessage || 'Something went wrong'}
          </Text>
          <Button 
            size="sm" 
            colorScheme="red" 
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

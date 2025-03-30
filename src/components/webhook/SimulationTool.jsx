import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Textarea,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

const SimulationTool = ({ webhook, mappings = {} }) => {
  const [samplePayload, setSamplePayload] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  // Move all useColorModeValue hooks to the top level
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const tableBgColor = useColorModeValue('gray.50', 'gray.700');
  const contentBgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    generateSamplePayload();
  }, [mappings]);

  const generateSamplePayload = () => {
    const payload = {};
    
    Object.entries(mappings).forEach(([contactField, jsonPath]) => {
      const path = jsonPath.replace('$.', '').split('.');
      let current = payload;
      
      path.forEach((key, index) => {
        if (index === path.length - 1) {
          current[key] = `sample_${contactField}`;
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      });
    });

    setSamplePayload(JSON.stringify(payload, null, 2));
  };

  const validatePayload = (payload) => {
    try {
      const parsedPayload = JSON.parse(payload);
      
      const results = Object.entries(mappings).map(([contactField, jsonPath]) => {
        const path = jsonPath.replace('$.', '').split('.');
        let value = parsedPayload;
        
        for (const key of path) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = undefined;
            break;
          }
        }

        return {
          contactField,
          jsonPath,
          value: value !== undefined ? String(value) : undefined,
          isValid: value !== undefined
        };
      });

      return results;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const handleTest = async () => {
    try {
      setIsLoading(true);
      const results = validatePayload(samplePayload);
      
      const missingRequired = results.filter(
        result => !result.isValid && 
        ['user_ns', 'crm_contact_id'].includes(result.contactField)
      );

      if (missingRequired.length > 0) {
        throw new Error(`Missing required fields: ${missingRequired.map(r => r.contactField).join(', ')}`);
      }

      setTestResults(results);
      toast({
        title: 'Test successful',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      setTestResults(null);
      toast({
        title: 'Test failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="medium" mb={6}>
        Test Your Webhook
      </Text>

      <VStack spacing={6} align="stretch">
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          <Box p={4} bg={bgColor}>
            <Text fontSize="sm" fontWeight="medium" mb={3}>
              Sample Payload
            </Text>
            <Textarea
              value={samplePayload}
              onChange={(e) => setSamplePayload(e.target.value)}
              placeholder="Enter your test JSON payload here"
              size="md"
              height="200px"
              fontFamily="mono"
              bg={contentBgColor}
              borderRadius="md"
              mb={4}
            />
            <Button
              colorScheme="blue"
              size="md"
              isLoading={isLoading}
              onClick={handleTest}
              disabled={!samplePayload}
              width="full"
              height="40px"
            >
              Test Payload
            </Button>
          </Box>
        </Box>

        {testResults && (
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
            <Box p={4} bg={bgColor}>
              <Text fontSize="sm" fontWeight="medium" mb={3}>
                Test Results
              </Text>
              <Box bg={contentBgColor} borderRadius="md" overflow="hidden">
                <Table variant="simple" size="sm">
                  <Thead bg={tableBgColor}>
                    <Tr>
                      <Th>Field</Th>
                      <Th>Value</Th>
                      <Th width="100px">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {testResults.map((result, index) => (
                      <Tr key={index}>
                        <Td>
                          <Text fontSize="sm">{result.contactField}</Text>
                          <Text fontSize="xs" color="gray.500" fontFamily="mono">
                            {result.jsonPath}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontFamily="mono">
                            {result.value || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={result.isValid ? 'green' : 'red'}
                            variant="subtle"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {result.isValid ? 'Valid' : 'Missing'}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SimulationTool;

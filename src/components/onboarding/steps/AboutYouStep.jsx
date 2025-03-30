import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Text,
  Heading,
  Checkbox,
  Link,
  InputGroup,
  InputLeftAddon,
  FormErrorMessage,
  Box,
  Container,
  useColorModeValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Briefcase, Phone } from 'lucide-react';
import { isValidPhone as validatePhoneNumber } from '../../../utils/phoneUtils';

const AboutYouStep = ({ initialData, onComplete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: initialData.full_name || user?.user_metadata?.full_name || '',
    job_title: initialData.job_title || '',
    crm_experience: initialData.crm_experience || '',
    phone_number: initialData.phone_number || '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedUpdates, setAcceptedUpdates] = useState(false);
  const [errors, setErrors] = useState({});

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = 'purple.500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }

    const phoneNumber = formData.phone_number.replace(/\s+/g, '');
    if (!phoneNumber) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phone_number = 'Please enter a valid Australian phone number';
    }

    if (!formData.job_title) {
      newErrors.job_title = 'Job title is required';
    }

    if (!formData.crm_experience) {
      newErrors.crm_experience = 'Please select your CRM experience';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms to continue';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const finalPhoneNumber = formattedPhone.startsWith('+61') ? formattedPhone : `+61${formattedPhone}`;

    try {
      await onComplete({
        ...formData,
        phone_number: finalPhoneNumber,
        accepted_terms: acceptedTerms,
        terms_accepted_at: acceptedTerms ? new Date().toISOString() : null,
        accepted_updates: acceptedUpdates,
        updates_accepted_at: acceptedUpdates ? new Date().toISOString() : null
      });
    } catch (error) {
      setErrors({
        submit: 'Failed to save your information. Please try again.'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.sm">
        <Box
          bg={cardBgColor}
          boxShadow="sm"
          borderRadius="lg"
          p={8}
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={6}>
              <Heading as="h1" size="xl" color={textColor} mb={3}>
                About you
              </Heading>
              <Text color={mutedTextColor}>
                You're signing up as {user?.email}
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl isInvalid={errors.full_name}>
                  <FormLabel color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={User} />
                      <Text>Full Name</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    bg={cardBgColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: 'outline' }}
                  />
                  <FormErrorMessage>{errors.full_name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.job_title}>
                  <FormLabel color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={Briefcase} />
                      <Text>Job Title</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="Select job title"
                    bg={cardBgColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: 'outline' }}
                  >
                    <option value="founder">Founder/CEO</option>
                    <option value="sales">Sales Representative</option>
                    <option value="marketing">Marketing Manager</option>
                    <option value="customer_success">Customer Success</option>
                    <option value="product">Product Manager</option>
                    <option value="other">Other</option>
                  </Select>
                  <FormErrorMessage>{errors.job_title}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.crm_experience}>
                  <FormLabel color={textColor}>CRM Experience</FormLabel>
                  <Select
                    name="crm_experience"
                    value={formData.crm_experience}
                    onChange={handleChange}
                    placeholder="Select experience"
                    bg={cardBgColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: 'outline' }}
                  >
                    <option value="never">Never used one</option>
                    <option value="basic">Basic experience</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert user</option>
                  </Select>
                  <FormErrorMessage>{errors.crm_experience}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.phone_number}>
                  <FormLabel color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={Phone} />
                      <Text>Phone Number</Text>
                    </HStack>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon children="+61" bg={bgColor} />
                    <Input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="412345678"
                      bg={cardBgColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: 'outline' }}
                    />
                  </InputGroup>
                  <Text fontSize="sm" color={mutedTextColor} mt={1}>
                    Enter your mobile number (e.g., 412345678 or 0412345678)
                  </Text>
                  <FormErrorMessage>{errors.phone_number}</FormErrorMessage>
                </FormControl>

                <VStack spacing={3} align="stretch">
                  <FormControl isInvalid={errors.terms}>
                    <Checkbox
                      isChecked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      colorScheme="purple"
                    >
                      <Text fontSize="sm" color={textColor}>
                        I accept the{' '}
                        <Link href="#" color={accentColor} isExternal>
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="#" color={accentColor} isExternal>
                          Privacy Notice
                        </Link>
                      </Text>
                    </Checkbox>
                    <FormErrorMessage>{errors.terms}</FormErrorMessage>
                  </FormControl>

                  <Checkbox
                    isChecked={acceptedUpdates}
                    onChange={(e) => setAcceptedUpdates(e.target.checked)}
                    colorScheme="purple"
                  >
                    <Text fontSize="sm" color={textColor}>
                      Get helpful tips, product updates and exclusive offers via email
                    </Text>
                  </Checkbox>
                </VStack>

                {errors.submit && (
                  <Text color="red.500" fontSize="sm">
                    {errors.submit}
                  </Text>
                )}

                <Button
                  type="submit"
                  colorScheme="purple"
                  size="lg"
                  w="100%"
                  mt={4}
                  isDisabled={!acceptedTerms}
                >
                  Next
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutYouStep;

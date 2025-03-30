import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Button,
  Flex,
  IconButton,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Center,
  Text,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import ContactDetailView from '../board/components/ContactDetailView';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import useContactV2Store from '../../services/contactV2State';

const ContactDetailPage = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [contactExists, setContactExists] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const { loadContacts } = useContactV2Store();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  // Check if contact exists and belongs to current workspace
  useEffect(() => {
    const checkContact = async () => {
      if (!contactId || !currentWorkspace?.id) {
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id')
          .eq('id', contactId)
          .eq('workspace_id', currentWorkspace.id)
          .single();

        if (error || !data) {
          console.error('Contact not found or not accessible:', error);
          setContactExists(false);
        } else {
          setContactExists(true);
        }
      } catch (error) {
        console.error('Error checking contact:', error);
        setContactExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkContact();
  }, [contactId, currentWorkspace?.id]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Link copied to clipboard",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast({
          title: "Failed to copy link",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      });
  };

  const handleContactUpdated = () => {
    // Refresh contacts list in the background
    loadContacts(null, 50, 'contacts');
  };

  const handleContactDeleted = () => {
    // Navigate back to contacts list after deletion
    navigate('/');
    // Refresh contacts list
    loadContacts(null, 50, 'contacts');
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg={bgColor}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (!contactExists) {
    return (
      <Box bg={bgColor} minH="100vh" p={5}>
        <Container maxW="container.xl">
          <Flex direction="column" align="center" justify="center" minH="80vh">
            <Heading mb={4}>Contact Not Found</Heading>
            <Text mb={6}>The contact you're looking for doesn't exist or you don't have access to it.</Text>
            <Button colorScheme="blue" onClick={handleGoBack}>
              Go Back to Contacts
            </Button>
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" p={5}>
      <Container maxW="container.xl">
        <Flex mb={4} align="center" justify="space-between">
          <Flex align="center">
            <IconButton
              icon={<ArrowLeft size={20} />}
              aria-label="Go back"
              variant="ghost"
              mr={2}
              onClick={handleGoBack}
            />
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={handleGoBack}>Contacts</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>Contact Details</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Flex>
          
          <Tooltip label={isCopied ? "Copied!" : "Copy link to clipboard"}>
            <Button
              leftIcon={isCopied ? <Check size={16} /> : <Copy size={16} />}
              size="sm"
              colorScheme={isCopied ? "green" : "gray"}
              variant="outline"
              onClick={handleCopyLink}
            >
              {isCopied ? "Copied!" : "Copy Link"}
            </Button>
          </Tooltip>
        </Flex>
        
        <Box bg={cardBgColor} borderRadius="md" boxShadow="sm" overflow="hidden">
          <ContactDetailView
            contactId={contactId}
            onClose={handleGoBack}
            onContactUpdated={handleContactUpdated}
            onContactDeleted={handleContactDeleted}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default ContactDetailPage; 
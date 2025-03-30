import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  IconButton,
  Select,
  Divider,
  useColorModeValue,
  FormHelperText,
} from '@chakra-ui/react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase.js';
import timezones from '../../utils/timezones.js';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [workspace, setWorkspace] = useState({
    id: '',
    name: '',
    role: '',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const inputBgColor = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const helperTextColor = useColorModeValue('gray.500', 'gray.500');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles_with_workspace')
        .select('*')
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      // Handle case where no data or multiple rows are returned
      if (!profileData || profileData.length === 0) {
        console.log('No profile data found, creating default profile');
        // Set default profile values
        setProfile({
          full_name: '',
          email: user.email,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        
        setWorkspace({
          id: '',
          name: '',
          role: '',
        });
        return;
      }
      
      // Use the first workspace if multiple are returned
      const firstProfile = profileData[0];

      setProfile({
        full_name: firstProfile.full_name || '',
        email: user.email,
        timezone: firstProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      setWorkspace({
        id: firstProfile.workspace_id || '',
        name: firstProfile.workspace_name || '',
        role: firstProfile.workspace_role || '',
      });

    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error loading profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First update workspace if name has changed
      if (workspace.name && workspace.id) {
        const { error: workspaceError } = await supabase
          .from('workspaces')
          .update({ name: workspace.name })
          .eq('id', workspace.id);

        if (workspaceError) {
          toast({
            title: 'Error updating workspace',
            description: workspaceError.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      // Then update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          timezone: profile.timezone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        toast({
          title: 'Error updating profile',
          description: profileError.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsEditing(false);
      await loadProfile(); // Reload the profile to get latest data
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving changes',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={4}>
      <Box position="relative" mb={6}>
        <IconButton
          icon={<ArrowLeft size={18} />}
          variant="ghost"
          position="absolute"
          left={0}
          top={0}
          size="sm"
          onClick={() => navigate('/')}
          aria-label="Back"
          color={labelColor}
        />
        <Text textAlign="center" fontSize="lg" fontWeight="semibold">
          Profile Settings
        </Text>
      </Box>

      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        px={4}
        py={5}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor={borderColor}
      >
        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>Full Name</FormLabel>
          <Input
            size="sm"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            placeholder="Enter your full name"
            bg={inputBgColor}
          />
        </FormControl>

        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>Email</FormLabel>
          <Input 
            size="sm"
            value={profile.email} 
            isReadOnly 
            bg={inputBgColor}
          />
        </FormControl>

        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>Timezone</FormLabel>
          <Select
            size="sm"
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            bg={inputBgColor}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </FormControl>

        <Divider my={2} borderColor={borderColor} />

        <Text fontSize="sm" fontWeight="medium" color={labelColor} mb={1}>
          Workspace Settings
        </Text>

        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>Workspace ID</FormLabel>
          <Input 
            size="sm"
            value={workspace.id} 
            isReadOnly 
            bg={inputBgColor}
          />
          <FormHelperText fontSize="xs" color={helperTextColor}>
            This is your unique workspace identifier
          </FormHelperText>
        </FormControl>

        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>
            <HStack justify="space-between">
              <Text>Workspace Name</Text>
              <IconButton
                size="xs"
                icon={<Edit2 size={14} />}
                onClick={() => setIsEditing(!isEditing)}
                aria-label="Edit workspace name"
                variant="ghost"
                color={labelColor}
              />
            </HStack>
          </FormLabel>
          <Input
            size="sm"
            value={workspace.name}
            onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
            isReadOnly={!isEditing}
            bg={isEditing ? undefined : inputBgColor}
          />
        </FormControl>

        <FormControl size="sm">
          <FormLabel fontSize="sm" color={labelColor}>Your Role</FormLabel>
          <Input 
            size="sm"
            value={workspace.role} 
            isReadOnly 
            textTransform="capitalize"
            bg={inputBgColor}
          />
        </FormControl>

        <HStack spacing={3} justify="flex-end" pt={2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/')}
            color={labelColor}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSave}
            isLoading={loading}
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default Profile;

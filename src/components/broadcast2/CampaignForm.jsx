import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Grid,
  GridItem,
  useColorModeValue,
  Text,
  Flex,
  Icon,
  Tooltip,
  Divider
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

/**
 * Campaign Form Component
 * 
 * Manages the campaign details form for creating and editing campaigns.
 * Handles validation and data management for campaign metadata.
 */
const CampaignForm = ({ campaign, setCampaign }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCampaign(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Color mode values
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBgColor = useColorModeValue('#f9fafb', 'gray.700');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');
  const hintColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.750');

  const inputStyles = {
    borderRadius: '8px',
    fontSize: '15px',
    bg: inputBgColor,
    borderColor: borderColor,
    height: '44px',
    _hover: {
      borderColor: useColorModeValue('gray.300', 'gray.500'),
    },
    _focus: {
      borderColor: useColorModeValue('blue.400', 'blue.300'),
      boxShadow: `0 0 0 1px ${useColorModeValue('blue.400', 'blue.300')}`,
    },
    _placeholder: {
      color: useColorModeValue('gray.400', 'gray.500')
    }
  };

  return (
    <Box p={6}>
      {/* Three-column layout for the main form fields */}
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={6}>
        {/* Campaign Name */}
        <GridItem colSpan={1}>
          <FormControl isRequired>
            <Flex align="center" mb={1}>
              <FormLabel 
                color={labelColor} 
                fontWeight="semibold"
                fontSize="15px"
                mb={0}
                mr={1}
              >
                Campaign Name
              </FormLabel>
              <Tooltip 
                label="This name will be used for internal reference only and won't be visible to recipients" 
                placement="top"
                hasArrow
              >
                <Icon as={InfoIcon} color={hintColor} boxSize="14px" />
              </Tooltip>
            </Flex>
            <Input
              name="name"
              value={campaign?.name || ''}
              onChange={handleChange}
              placeholder="Enter a descriptive name"
              color={textColor}
              {...inputStyles}
              fontSize="16px"
              fontWeight="normal"
            />
            <Text fontSize="13px" color={hintColor} mt={1}>
              Helps identify this campaign later
            </Text>
          </FormControl>
        </GridItem>

        {/* Campaign Type */}
        <GridItem colSpan={1}>
          <FormControl isRequired>
            <Flex align="center" mb={1}>
              <FormLabel 
                color={labelColor}
                fontWeight="semibold"
                fontSize="15px"
                mb={0}
                mr={1}
              >
                Type
              </FormLabel>
              <Tooltip 
                label="The type determines how messages are sent and scheduled" 
                placement="top"
                hasArrow
              >
                <Icon as={InfoIcon} color={hintColor} boxSize="14px" />
              </Tooltip>
            </Flex>
            <Select
              name="type"
              value={campaign?.type || 'sequence'}
              onChange={handleChange}
              color={textColor}
              {...inputStyles}
              fontSize="16px"
              fontWeight="normal"
              iconSize="18px"
            >
              <option value="sequence">Sequence</option>
              <option value="broadcast">Broadcast</option>
              <option value="drip">Drip Campaign</option>
              <option value="trigger">Triggered Messages</option>
            </Select>
          </FormControl>
        </GridItem>

        {/* Campaign Status */}
        <GridItem colSpan={1}>
          <FormControl>
            <Flex align="center" mb={1}>
              <FormLabel 
                color={labelColor}
                fontWeight="semibold"
                fontSize="15px"
                mb={0}
                mr={1}
              >
                Status
              </FormLabel>
              <Tooltip 
                label="New campaigns start as drafts. Status changes when campaign is activated" 
                placement="top"
                hasArrow
              >
                <Icon as={InfoIcon} color={hintColor} boxSize="14px" />
              </Tooltip>
            </Flex>
            <Select
              name="status"
              value={campaign?.status || 'draft'}
              onChange={handleChange}
              color={textColor}
              isDisabled={!campaign?.id} // Only enable for existing campaigns
              {...inputStyles}
              fontSize="16px"
              fontWeight="normal"
              iconSize="18px"
              _disabled={{
                opacity: 0.7,
                cursor: 'not-allowed',
                bg: useColorModeValue('gray.100', 'gray.800')
              }}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FormControl>
        </GridItem>
      </Grid>

      {/* Campaign Description */}
      <Box>
        <FormControl mb={2}>
          <Flex align="center" mb={1}>
            <FormLabel 
              color={labelColor}
              fontWeight="semibold"
              fontSize="15px"
              mb={0}
              mr={1}
            >
              Description
            </FormLabel>
            <Tooltip 
              label="Add helpful details about this campaign's purpose and goals" 
              placement="top"
              hasArrow
            >
              <Icon as={InfoIcon} color={hintColor} boxSize="14px" />
            </Tooltip>
          </Flex>
          <Textarea
            name="description"
            value={campaign?.description || ''}
            onChange={handleChange}
            placeholder="Add notes about campaign goals, target audience, or other important details"
            rows={3}
            color={textColor}
            borderRadius="8px"
            fontSize="15px"
            bg={inputBgColor}
            borderColor={borderColor}
            _hover={{
              borderColor: useColorModeValue('gray.300', 'gray.500'),
            }}
            _focus={{
              borderColor: useColorModeValue('blue.400', 'blue.300'),
              boxShadow: `0 0 0 1px ${useColorModeValue('blue.400', 'blue.300')}`,
            }}
            _placeholder={{
              color: useColorModeValue('gray.400', 'gray.500')
            }}
            resize="vertical"
            minHeight="100px"
            p={3}
            fontWeight="normal"
          />
          <Text fontSize="13px" color={hintColor} mt={1}>
            This description will help your team understand the purpose of this campaign
          </Text>
        </FormControl>
      </Box>
    </Box>
  );
};

export default CampaignForm; 
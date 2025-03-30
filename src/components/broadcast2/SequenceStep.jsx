import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Button,
  HStack,
  VStack,
  Divider
} from '@chakra-ui/react';
import {
  DragHandleIcon,
  TimeIcon,
  ChatIcon,
  EmailIcon,
  ChevronDownIcon,
  DeleteIcon,
  CopyIcon,
  EditIcon,
  CheckIcon,
  CloseIcon
} from '@chakra-ui/icons';

/**
 * Sequence Step Component
 * 
 * Represents a single step in a multi-day sequence.
 * Manages timing, message content, and delivery channel.
 */
const SequenceStep = ({ 
  step, 
  index,
  onDelete,
  onDuplicate,
  onChange,
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Color values - all at the top level
  const bgColor = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('#f8fafc', 'gray.750');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.650');
  const stepBadgeBg = useColorModeValue('purple.50', 'purple.900');
  const stepBadgeColor = useColorModeValue('purple.700', 'purple.200');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');
  const waitBadgeBg = useColorModeValue('gray.100', 'gray.700');
  
  // Form field specific styles - all at the top level
  const inputBgColor = useColorModeValue('#f8fafc', 'gray.700');
  const focusBorderColor = useColorModeValue('purple.400', 'purple.300');
  const focusShadowColor = `0 0 0 1px ${useColorModeValue('purple.400', 'purple.300')}`;
  
  // Channel specific icons and colors
  const channelConfig = {
    sms: {
      icon: ChatIcon,
      color: 'green',
      label: 'SMS'
    },
    email: {
      icon: EmailIcon,
      color: 'blue',
      label: 'Email'
    }
  };

  const ChannelIcon = channelConfig[step.channel]?.icon || ChatIcon;
  const channelColor = channelConfig[step.channel]?.color || 'gray';
  const channelLabel = channelConfig[step.channel]?.label || 'Message';
  
  const handleContentChange = (e) => {
    onChange({
      ...step,
      content: e.target.value
    });
  };
  
  const handleSubjectChange = (e) => {
    onChange({
      ...step,
      subject: e.target.value
    });
  };
  
  const handleChannelChange = (e) => {
    onChange({
      ...step,
      channel: e.target.value,
      // Reset content when switching channels
      content: '',
      subject: e.target.value === 'email' ? '' : undefined
    });
  };
  
  const handleWaitDurationChange = (value) => {
    onChange({
      ...step,
      wait_duration: parseInt(value)
    });
  };
  
  const handleStartTimeChange = (e) => {
    onChange({
      ...step,
      wait_until_start: e.target.value,
      // If end time is not set or is earlier than start time, set it to start time
      wait_until_end: (!step.wait_until_end || e.target.value > step.wait_until_end) 
        ? e.target.value 
        : step.wait_until_end
    });
  };

  const handleEndTimeChange = (e) => {
    onChange({
      ...step,
      wait_until_end: e.target.value
    });
  };

  const toggleEdit = (e) => {
    if (e) e.stopPropagation();
    setIsEditing(!isEditing);
  };
  
  return (
    <Box p={1} width="100%">
      {/* Header section */}
      <Flex 
        justify="space-between" 
        align="center" 
        bg={headerBg}
        p={4}
        borderTopRadius="10px"
        borderBottomRadius={isEditing ? "0" : "10px"}
        borderBottom={isEditing ? `1px solid ${borderColor}` : "none"}
      >
        <HStack spacing={3}>
          {/* Drag handle */}
          <Tooltip label="Drag to reorder" placement="top">
            <IconButton
              icon={<DragHandleIcon />}
              variant="ghost"
              cursor="grab"
              aria-label="Drag to reorder"
              onMouseDown={(e) => e.stopPropagation()}
              opacity={0.6}
              _hover={{ opacity: 1 }}
              size="sm"
            />
          </Tooltip>
          
          {/* Step number badge */}
          <Badge 
            borderRadius="full" 
            px={3} 
            py={1}
            bg={stepBadgeBg} 
            color={stepBadgeColor}
            fontSize="15px"
            fontWeight="medium"
          >
            STEP {index + 1}
          </Badge>
          
          {/* Channel type */}
          <Badge 
            borderRadius="full" 
            px={3} 
            py={1}
            colorScheme={channelColor}
            fontSize="15px"
            fontWeight="medium"
            display="flex"
            alignItems="center"
          >
            <ChannelIcon mr={2} />
            <Text>{channelLabel}</Text>
          </Badge>
          
          {/* Wait time */}
          <Flex 
            align="center" 
            px={3} 
            py={1} 
            borderRadius="full" 
            bg={waitBadgeBg}
          >
            <TimeIcon mr={2} color={labelColor} />
            <Text fontSize="15px" fontWeight="medium" color={labelColor}>
              {step.wait_duration 
                ? `Wait ${step.wait_duration} ${step.wait_duration === 1 ? 'day' : 'days'}`
                : 'Same day'}
              {step.wait_until_start && step.wait_until_end 
                ? ` between ${step.wait_until_start} - ${step.wait_until_end}` 
                : step.wait_until 
                  ? ` at ${step.wait_until}` 
                  : ''}
            </Text>
          </Flex>
        </HStack>
        
        <HStack>
          {!isEditing ? (
            <Tooltip label="Edit this step" placement="top">
              <IconButton
                icon={<EditIcon />}
                variant="ghost"
                colorScheme="blue"
                size="sm"
                borderRadius="full"
                onClick={toggleEdit}
              />
            </Tooltip>
          ) : (
            <HStack>
              <Tooltip label="Close editor" placement="top">
                <IconButton
                  icon={<CloseIcon />}
                  variant="ghost"
                  colorScheme="gray"
                  size="sm"
                  borderRadius="full"
                  onClick={toggleEdit}
                />
              </Tooltip>
            </HStack>
          )}
          
          {/* Actions menu */}
          <Menu>
            <Tooltip label="More options" placement="top">
              <MenuButton
                as={IconButton}
                icon={<ChevronDownIcon />}
                variant="ghost"
                size="sm"
                borderRadius="full"
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
            <MenuList shadow="lg" borderRadius="md" py={2}>
              <MenuItem 
                icon={<CopyIcon />} 
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(step);
                }}
                fontSize="15px"
                py={2}
              >
                Duplicate Step
              </MenuItem>
              <MenuItem 
                icon={<DeleteIcon />} 
                color="red.500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(step.id);
                }}
                fontSize="15px"
                py={2}
              >
                Delete Step
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* Expanded editing view */}
      {isEditing ? (
        <Box p={5} borderBottomRadius="10px" bg={bgColor}>
          <VStack spacing={6} align="stretch">
            <Flex 
              gap={6} 
              flexDirection={{ base: "column", md: "row" }}
            >
              <FormControl flex={1}>
                <FormLabel 
                  fontSize="15px" 
                  fontWeight="medium" 
                  color={labelColor}
                  mb={2}
                >
                  Channel
                </FormLabel>
                <Select 
                  value={step.channel} 
                  onChange={handleChannelChange}
                  size="md"
                  borderRadius="8px"
                  fontSize="15px"
                  height="42px"
                  bg={inputBgColor}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: focusShadowColor
                  }}
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </Select>
              </FormControl>
              
              {step.channel === 'email' && (
                <FormControl flex={1}>
                  <FormLabel 
                    fontSize="15px" 
                    fontWeight="medium" 
                    color={labelColor}
                    mb={2}
                  >
                    Subject
                  </FormLabel>
                  <Input
                    value={step.subject || ''}
                    onChange={handleSubjectChange}
                    placeholder="Enter email subject"
                    bg={inputBgColor}
                    focusBorderColor={focusBorderColor}
                  />
                </FormControl>
              )}
              
              <FormControl flex={1}>
                <FormLabel 
                  fontSize="15px" 
                  fontWeight="medium" 
                  color={labelColor}
                  mb={2}
                >
                  Wait Duration
                </FormLabel>
                <NumberInput 
                  min={0} 
                  max={30} 
                  value={step.wait_duration || 0}
                  onChange={handleWaitDurationChange}
                  size="md"
                  borderRadius="8px"
                >
                  <NumberInputField 
                    height="42px" 
                    fontSize="15px"
                    bg={inputBgColor}
                    borderColor={borderColor}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: focusShadowColor
                    }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="14px" color={labelColor} mt={1}>
                  Days after previous step
                </Text>
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel 
                  fontSize="15px" 
                  fontWeight="medium" 
                  color={labelColor}
                  mb={2}
                >
                  Time Range
                </FormLabel>
                <Flex direction="row" align="center">
                  <Input 
                    type="time" 
                    value={step.wait_until_start || step.wait_until || '09:00'} 
                    onChange={handleStartTimeChange}
                    size="md"
                    height="42px"
                    fontSize="15px"
                    borderRadius="8px"
                    bg={inputBgColor}
                    borderColor={borderColor}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: focusShadowColor
                    }}
                    mr={2}
                  />
                  <Text mx={2}>to</Text>
                  <Input 
                    type="time" 
                    value={step.wait_until_end || step.wait_until_start || step.wait_until || '18:00'} 
                    onChange={handleEndTimeChange}
                    size="md"
                    height="42px"
                    fontSize="15px"
                    borderRadius="8px"
                    bg={inputBgColor}
                    borderColor={borderColor}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: focusShadowColor
                    }}
                  />
                </Flex>
                <Text fontSize="14px" color={labelColor} mt={1}>
                  Local time range (recipient's timezone)
                </Text>
              </FormControl>
            </Flex>
            
            <FormControl>
              <FormLabel 
                fontSize="15px" 
                fontWeight="medium" 
                color={labelColor}
                mb={2}
              >
                Message Content
              </FormLabel>
              <Textarea
                value={step.content || ''}
                onChange={handleContentChange}
                placeholder={step.channel === 'email' ? 'Enter email content (HTML supported)' : 'Enter message text'}
                minHeight={step.channel === 'email' ? '200px' : '100px'}
                size="md"
                fontSize="15px"
                borderRadius="8px"
                p={4}
                bg={inputBgColor}
                borderColor={borderColor}
                _focus={{
                  borderColor: focusBorderColor,
                  boxShadow: focusShadowColor
                }}
              />
              {step.channel === 'sms' && (
                <Text fontSize="14px" color={labelColor} mt={2}>
                  {(step.content?.length || 0)} / 160 characters
                  {(step.content?.length || 0) > 160 && (
                    <Text as="span" color="red.500" fontWeight="medium">
                      {' '}(Message will be split)
                    </Text>
                  )}
                </Text>
              )}
            </FormControl>
            
            <Flex justify="flex-end" mt={2}>
              <Button
                leftIcon={<CheckIcon />}
                colorScheme="purple"
                onClick={toggleEdit}
                borderRadius="8px"
                px={5}
                py={2}
                height="auto"
                fontWeight="medium"
              >
                Done Editing
              </Button>
            </Flex>
          </VStack>
        </Box>
      ) : (
        /* Collapsed view */
        step.content && (
          <Box 
            p={4} 
            bg={bgColor} 
            borderBottomRadius="10px"
            borderTopWidth={0}
          >
            <Text 
              color={textColor} 
              noOfLines={2} 
              fontSize="15px"
              fontStyle="italic"
              lineHeight="1.5"
            >
              {step.content}
            </Text>
          </Box>
        )
      )}
    </Box>
  );
};

export default SequenceStep; 
import React from 'react';
import { Flex, Text, Box, useColorModeValue } from '@chakra-ui/react';

/**
 * CountBadge - A reusable component that displays a label with a count in a circular badge
 * 
 * @param {Object} props
 * @param {string} props.label - The label text to display (e.g., "Today")
 * @param {number|null} props.count - The count to display in the badge, or null to hide the badge
 * @param {string} props.icon - Optional icon component to display before the label
 * @param {string} props.colorScheme - Color scheme for the badge (default: "green")
 * @param {boolean} props.isActive - Whether the badge is active/selected
 * @param {Object} props.containerProps - Additional props for the container
 */
const CountBadge = ({ 
  label, 
  count, 
  icon: Icon, 
  colorScheme = "green",
  isActive = false,
  containerProps = {},
  ...rest 
}) => {
  // Color mode values for background
  const activeBgColor = useColorModeValue(
    `${colorScheme}.100`, 
    `${colorScheme}.900`
  );
  const inactiveBgColor = useColorModeValue(
    'gray.100',
    'gray.700'
  );
  
  // Color mode values for text
  const activeTextColor = useColorModeValue(
    `${colorScheme}.800`,
    `${colorScheme}.100`
  );
  const inactiveTextColor = useColorModeValue(
    `${colorScheme}.600`,
    `${colorScheme}.300`
  );
  
  // Badge colors
  const badgeBgColor = useColorModeValue("white", "gray.700");
  const badgeTextColor = useColorModeValue("gray.800", "white");

  return (
    <Flex
      alignItems="center"
      bg={isActive ? activeBgColor : inactiveBgColor}
      color={isActive ? activeTextColor : inactiveTextColor}
      py={1}
      px={2}
      borderRadius="full"
      fontSize="xs"
      fontWeight="medium"
      {...containerProps}
      {...rest}
    >
      {Icon && (
        <Box mr={1}>
          <Icon size={14} />
        </Box>
      )}
      <Text>{label}</Text>
      {count !== null && (
        <Box
          ml={1}
          bg={badgeBgColor}
          color={badgeTextColor}
          borderRadius="full"
          minW="20px"
          height="20px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xs"
          fontWeight="bold"
          px={1}
        >
          {count}
        </Box>
      )}
    </Flex>
  );
};

export default CountBadge; 
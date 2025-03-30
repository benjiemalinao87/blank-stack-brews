import React from 'react';
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';

/**
 * MetricsCard - A compact, space-efficient card for displaying metrics
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the metric
 * @param {string|number} props.value - The main value to display
 * @param {string} props.subtitle - The subtitle or description text
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.colorScheme - Color scheme for the card (default: "blue")
 * @param {Object} props.containerProps - Additional props for the container
 */
const MetricsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = "blue",
  containerProps = {},
  ...rest
}) => {
  // Color mode values
  const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const borderColor = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.800`);
  const titleColor = useColorModeValue(`${colorScheme}.700`, `${colorScheme}.200`);
  const valueColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

  return (
    <Box
      bg={bgColor}
      borderRadius="md"
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
      {...containerProps}
      {...rest}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={1}>
        <Text fontSize="xs" fontWeight="medium" color={titleColor}>
          {title}
        </Text>
        {Icon && (
          <Box color={iconColor}>
            <Icon size={14} />
          </Box>
        )}
      </Flex>
      
      <Text fontSize="xl" fontWeight="bold" color={valueColor} lineHeight="1">
        {value}
      </Text>
      
      <Text fontSize="2xs" color={subtitleColor} mt={0.5} noOfLines={1}>
        {subtitle}
      </Text>
    </Box>
  );
};

export default MetricsCard; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  HStack,
  Progress,
  useColorModeValue,
  Circle,
  Flex,
  Divider,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Target, Award, TrendingUp, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, change, subtitle, icon: Icon, color, delay }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const isPositive = !change.includes('-');
  const ArrowIcon = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Box
        p={6}
        bg={bgColor}
        borderRadius="2xl"
        boxShadow="xl"
        position="relative"
        overflow="hidden"
      >
        {/* Background gradient */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="150px"
          h="150px"
          bg={`radial-gradient(circle, ${color}20 0%, transparent 70%)`}
          borderRadius="full"
          transform="translate(30%, -30%)"
        />

        <VStack spacing={4} align="start">
          <HStack spacing={3} width="full" justify="space-between">
            <HStack spacing={3}>
              <Circle size="40px" bg={`${color}20`}>
                <Icon color={color} size={20} />
              </Circle>
              <Text fontSize="lg" fontWeight="medium">
                {title}
              </Text>
            </HStack>
            <Badge
              px={3}
              py={1}
              borderRadius="full"
              colorScheme={isPositive ? 'green' : 'red'}
              variant="subtle"
            >
              <HStack spacing={1}>
                <ArrowIcon size={14} />
                <Text>{change.replace('-', '')}</Text>
              </HStack>
            </Badge>
          </HStack>

          <HStack spacing={4} align="baseline">
            <Text fontSize="4xl" fontWeight="bold">
              {value}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {subtitle}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </motion.div>
  );
};

const MotionSimpleGrid = motion(SimpleGrid);

export const WeeklyWrap = ({ demo = true }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBgColor = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    if (demo) {
      fetchWeeklyStats();
      onOpen();
      return;
    }

    const today = new Date();
    const lastShown = localStorage.getItem('lastWeeklyWrapShown');
    const isMonday = today.getDay() === 1;
    
    if (isMonday && (!lastShown || new Date(lastShown).getDate() !== today.getDate())) {
      fetchWeeklyStats();
      onOpen();
      localStorage.setItem('lastWeeklyWrapShown', today.toISOString());
    }
  }, [demo, onOpen]);

  const fetchWeeklyStats = () => {
    setStats({
      messagesHandled: {
        value: '324',
        change: '+15%',
        subtitle: 'messages this week'
      },
      avgResponseTime: {
        value: '1.5m',
        change: '-30s',
        subtitle: 'average response'
      },
      resolutionRate: {
        value: '92%',
        change: '+5%',
        subtitle: 'resolution rate'
      },
      customerSatisfaction: {
        value: '4.8',
        change: '+0.3',
        subtitle: 'CSAT score'
      }
    });
  };

  if (!stats) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      motionPreset="slideInBottom"
      isCentered
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} overflow="hidden">
        <ModalCloseButton zIndex={2} />
        
        {/* Header Section */}
        <Box bg={headerBgColor} p={8} position="relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={2} align="center">
              <Text 
                fontSize="sm" 
                fontWeight="medium" 
                color="blue.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Weekly Performance Report
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                Your Impact This Week
              </Text>
              <Text color="gray.500" maxW="md" textAlign="center">
                Great work! Here's a snapshot of your performance and improvements from last week.
              </Text>
            </VStack>
          </motion.div>
        </Box>

        <ModalBody p={8}>
          <VStack spacing={6}>
            <MotionSimpleGrid 
              columns={2}
              spacing={6}
              w="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <StatCard
                icon={MessageCircle}
                title="Messages"
                value={stats.messagesHandled.value}
                change={stats.messagesHandled.change}
                subtitle={stats.messagesHandled.subtitle}
                color="#4299E1"
                delay={0.2}
              />
              <StatCard
                icon={Clock}
                title="Response Time"
                value={stats.avgResponseTime.value}
                change={stats.avgResponseTime.change}
                subtitle={stats.avgResponseTime.subtitle}
                color="#48BB78"
                delay={0.3}
              />
              <StatCard
                icon={Target}
                title="Resolution"
                value={stats.resolutionRate.value}
                change={stats.resolutionRate.change}
                subtitle={stats.resolutionRate.subtitle}
                color="#9F7AEA"
                delay={0.4}
              />
              <StatCard
                icon={Award}
                title="Satisfaction"
                value={stats.customerSatisfaction.value}
                change={stats.customerSatisfaction.change}
                subtitle={stats.customerSatisfaction.subtitle}
                color="#ED8936"
                delay={0.5}
              />
            </MotionSimpleGrid>

            <Divider />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ width: '100%' }}
            >
              <Button
                size="lg"
                w="full"
                colorScheme="blue"
                rightIcon={<ChevronRight />}
                onClick={onClose}
                py={7}
                fontSize="md"
              >
                View Detailed Analytics
              </Button>
            </motion.div>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

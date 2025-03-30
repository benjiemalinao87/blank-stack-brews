import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, useColorModeValue, Badge } from '@chakra-ui/react';
import { Rocket } from 'lucide-react';
import FeatureRequestSidebar from './FeatureRequestSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseUnified';

const FeatureRequestButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const bgColor = useColorModeValue('whiteAlpha.900', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch user data and request count on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        fetchRequestCount(user.email);
      }
    };
    
    fetchUserData();
    
    // Set up subscription to feature_requests table
    const subscription = supabase
      .channel('feature_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feature_requests'
      }, (payload) => {
        if (userEmail) {
          fetchRequestCount(userEmail);
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userEmail]);

  // Fetch the count of user's feature requests
  const fetchRequestCount = async (email) => {
    if (!email) return;
    
    try {
      const { data, error, count } = await supabase
        .from('feature_requests')
        .select('*', { count: 'exact' })
        .eq('requested_by', email);
      
      if (error) throw error;
      setRequestCount(count || 0);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  // Stop pulsing after user clicks the button once
  useEffect(() => {
    if (isOpen) {
      setIsPulsing(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Feature Request Button */}
      <Box
        position="fixed"
        right="6"
        top="20"
        zIndex={1000}
      >
        <Tooltip label="24h Feature Delivery" placement="left" hasArrow>
          <Box position="relative">
            <motion.div
              animate={isPulsing ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(66, 153, 225, 0.7)',
                  '0 0 0 10px rgba(66, 153, 225, 0)',
                  '0 0 0 0 rgba(66, 153, 225, 0)'
                ]
              } : {}}
              transition={isPulsing ? { 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              } : {}}
            >
              <IconButton
                icon={<Rocket size={24} />}
                aria-label="Feature Request"
                borderRadius="full"
                size="lg"
                colorScheme="blue"
                boxShadow="lg"
                onClick={() => setIsOpen(!isOpen)}
                isActive={isOpen}
                _hover={{
                  transform: 'scale(1.1)',
                  transition: 'all 0.2s',
                }}
              />
            </motion.div>
            {isPulsing ? (
              <Badge 
                colorScheme="red" 
                position="absolute" 
                top="-2" 
                right="-2" 
                borderRadius="full"
                boxShadow="sm"
              >
                New
              </Badge>
            ) : requestCount > 0 && (
              <Badge 
                colorScheme="blue" 
                position="absolute" 
                top="-2" 
                right="-2" 
                borderRadius="full"
                boxShadow="sm"
              >
                {requestCount}
              </Badge>
            )}
          </Box>
        </Tooltip>
      </Box>
      
      {/* Feature Request Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              right: '24px',
              top: '80px',
              width: '300px',
              zIndex: 900
            }}
          >
            <FeatureRequestSidebar 
              onClose={() => setIsOpen(false)}
              onRequestSubmitted={() => fetchRequestCount(userEmail)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeatureRequestButton;

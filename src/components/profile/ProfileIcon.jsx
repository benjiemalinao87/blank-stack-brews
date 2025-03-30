import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Icon,
  useColorModeValue,
  useColorMode,
  useToast,
  Text,
} from '@chakra-ui/react';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseUnified';

const ProfileIcon = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('whiteAlpha.900', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<Avatar size="sm" icon={<Icon as={User} />} />}
        variant="ghost"
        aria-label="Profile options"
        rounded="xl"
        _hover={{
          bg: bgColor,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s',
        }}
      />
      <MenuList
        bg={bgColor}
        borderColor={borderColor}
        backdropFilter="blur(10px)"
        boxShadow="xl"
        borderRadius="xl"
        p={1}
      >
        <MenuItem
          icon={<Icon as={User} />}
          onClick={handleProfile}
          borderRadius="lg"
          _hover={{ bg: 'gray.100' }}
        >
          Profile
        </MenuItem>
        <MenuItem
          icon={<Icon as={LogOut} />}
          onClick={handleLogout}
          borderRadius="lg"
          _hover={{ bg: 'gray.100' }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ProfileIcon;

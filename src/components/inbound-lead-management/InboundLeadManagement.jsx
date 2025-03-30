import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Heading, 
  Grid, 
  GridItem, 
  Badge, 
  IconButton, 
  Button,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Collapse,
  useToast,
  Checkbox,
  useColorMode,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  X, 
  BarChart2, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Zap,
  Calendar,
  TrendingUp,
  ChevronDown,
  Eye,
  EyeOff,
  Settings,
  MessageSquarePlus,
  MapPin,
  Phone,
  Mail,
  Package,
  Clock as ClockIcon,
  Globe,
  Home,
  Building,
  Droplets,
  Bath,
  Layers,
  Square,
  MoreVertical,
  Edit,
  Trash,
  Grid as GridIcon,
} from 'lucide-react';
import HeatMapModal from './HeatMapModal';
import ColumnVisibilityControl from './ColumnVisibilityControl';
import BulkActionBar from './BulkActionBar';
import QuickFilterChips from './QuickFilterChips';
import LeadGridView from './LeadGridView';
import LeadDetailSidebar from './LeadDetailSidebar';
import MetricsGrid from './MetricsGrid';
import { AnimatePresence } from 'framer-motion';
import FeatureRequestSidebar from '../feature-request/FeatureRequestSidebar';
import FeatureRequestButton from '../feature-request/FeatureRequestButton';

// Mock data for the dashboard
const mockMetrics = {
  total: 10,
  newLeads: 0,
  pendingLeads: 7,
  checkedOutLeads: 3,
  topProduct: 'MacBook Pro',
  topSource: 'Online',
  conversionRate: 0,
  todayLeads: 0
};

// Update mock data with home improvement products
const mockLeads = [
  {
    id: 'CR-010',
    firstName: 'William',
    lastName: 'Williams',
    city: 'Bakersfield',
    state: 'CA',
    phone: '(573) 555-8583',
    product: 'Windows',
    email: 'william.williams@example.com',
    received: '2023-07-15T20:00:00',
    source: 'Online',
    status: 'pending'
  },
  {
    id: 'CR-009',
    firstName: 'Sophia',
    lastName: 'Anderson',
    city: 'San Francisco',
    state: 'CA',
    phone: '(516) 555-8972',
    product: 'Roof',
    email: 'sophia.anderson@example.com',
    received: '2023-07-15T19:30:00',
    source: 'Event',
    status: 'pending'
  },
  {
    id: 'CR-008',
    firstName: 'Jacob',
    lastName: 'Brown',
    city: 'Anaheim',
    state: 'CA',
    phone: '(974) 555-8673',
    product: 'Doors',
    email: 'jacob.brown@example.com',
    received: '2023-07-15T19:00:00',
    source: 'Retail',
    status: 'pending'
  },
  {
    id: 'CR-007',
    firstName: 'Emma',
    lastName: 'Anderson',
    city: 'Santa Ana',
    state: 'CA',
    phone: '(738) 555-3129',
    product: 'Siding',
    email: 'emma.anderson@example.com',
    received: '2023-07-15T18:30:00',
    source: 'Partner',
    status: 'pending'
  },
  {
    id: 'CR-006',
    firstName: 'Ava',
    lastName: 'Jones',
    city: 'Santa Ana',
    state: 'CA',
    phone: '(271) 555-8240',
    product: 'Windows',
    email: 'ava.jones@example.com',
    received: '2023-07-15T18:00:00',
    source: 'Social',
    status: 'pending'
  },
  {
    id: 'CR-005',
    firstName: 'Sophia',
    lastName: 'Moore',
    city: 'San Francisco',
    state: 'CA',
    phone: '(588) 555-2662',
    product: 'Bath',
    email: 'sophia.moore@example.com',
    received: '2023-07-15T17:30:00',
    source: 'Partner',
    status: 'pending'
  },
  {
    id: 'CR-004',
    firstName: 'William',
    lastName: 'Jones',
    city: 'Oakland',
    state: 'CA',
    phone: '(968) 555-1625',
    product: 'Roof',
    email: 'william.jones@example.com',
    received: '2023-07-15T17:00:00',
    source: 'Retail',
    status: 'pending'
  },
  {
    id: 'CR-003',
    firstName: 'William',
    lastName: 'Miller',
    city: 'Oakland',
    state: 'CA',
    phone: '(659) 555-4499',
    product: 'Bath',
    email: 'william.miller@example.com',
    received: '2023-07-15T17:00:00',
    source: 'Email',
    status: 'pending'
  },
  {
    id: 'CR-002',
    firstName: 'Liam',
    lastName: 'Taylor',
    city: 'Oakland',
    state: 'CA',
    phone: '(678) 555-4414',
    product: 'Gutter',
    email: 'liam.taylor@example.com',
    received: '2023-07-15T17:00:00',
    source: 'Partner',
    status: 'pending'
  },
  {
    id: 'CR-001',
    firstName: 'Emma',
    lastName: 'Davis',
    city: 'Fresno',
    state: 'CA',
    phone: '(292) 555-5563',
    product: 'Windows',
    email: 'emma.davis@example.com',
    received: '2023-07-15T17:00:00',
    source: 'Support',
    status: 'pending'
  }
];

// Update columns with icons
const columns = [
  { id: 'id', label: 'ID', icon: <Zap size={16} /> },
  { id: 'firstName', label: 'First Name', icon: <Users size={16} /> },
  { id: 'lastName', label: 'Last Name', icon: <Users size={16} /> },
  { id: 'location', label: 'Location', icon: <MapPin size={16} /> },
  { id: 'phone', label: 'Phone', icon: <Phone size={16} /> },
  { id: 'product', label: 'Product', icon: <Package size={16} /> },
  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
  { id: 'received', label: 'Received', icon: <ClockIcon size={16} /> },
  { id: 'source', label: 'Source', icon: <Globe size={16} /> },
  { id: 'status', label: 'Status', icon: <AlertCircle size={16} /> }
];

const InboundLeadManagement = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  
  // State for card visibility
  const [visibleCards, setVisibleCards] = useState({
    totalLeads: true,
    newLeads: true,
    pending: true,
    checkedOut: true,
    todaysActivity: true,
    topProduct: true,
    topSource: true,
    conversionRate: true
  });
  
  // State for collapsing card sections
  const [showMainMetrics, setShowMainMetrics] = useState(true);
  const [showInsightMetrics, setShowInsightMetrics] = useState(true);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  
  // Card background colors - moved outside of conditional rendering
  const totalLeadsBg = useColorModeValue('blue.50', 'blue.900');
  const newLeadsBg = useColorModeValue('yellow.50', 'yellow.900');
  const pendingBg = useColorModeValue('orange.50', 'orange.900');
  const checkedOutBg = useColorModeValue('green.50', 'green.900');
  const todaysActivityBg = useColorModeValue('purple.50', 'purple.900');
  const topProductBg = useColorModeValue('cyan.50', 'cyan.900');
  const topSourceBg = useColorModeValue('teal.50', 'teal.900');
  const conversionRateBg = useColorModeValue('pink.50', 'pink.900');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState([
    'id',
    'firstName',
    'lastName',
    'location',
    'phone',
    'product',
    'email',
    'received',
    'source',
    'status'
  ]);

  // Filter leads based on search query and filter value
  const filteredLeads = mockLeads.filter(lead => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.customerRecordId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply dropdown filter
    const matchesDropdownFilter = filterValue === 'all' || lead.status === filterValue;
    
    // Apply quick filters
    let matchesQuickFilters = true;
    if (activeFilters.length > 0) {
      matchesQuickFilters = activeFilters.some(filter => {
        switch (filter) {
          case 'all':
            return true;
          case 'new':
            return lead.status === 'new';
          case 'today': {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const leadDate = new Date(lead.received);
            return leadDate >= today;
          }
          case 'contacted':
            return lead.contacted;
          case 'last7days': {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const leadDate = new Date(lead.received);
            return leadDate >= sevenDaysAgo;
          }
          default:
            return false;
        }
      });
    }
    
    return matchesSearch && matchesDropdownFilter && matchesQuickFilters;
  });
  
  // Calculate filter counts
  const calculateFilterCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    return {
      all: mockLeads.length,
      new: mockLeads.filter(lead => lead.status === 'new').length,
      today: mockLeads.filter(lead => {
        const leadDate = new Date(lead.received);
        return leadDate >= today;
      }).length,
      contacted: mockLeads.filter(lead => lead.contacted).length,
      last7days: mockLeads.filter(lead => {
        const leadDate = new Date(lead.received);
        return leadDate >= sevenDaysAgo;
      }).length
    };
  };

  const filterCounts = calculateFilterCounts();
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Handle lead selection
  const handleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };
  
  // Handle select all leads
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Toggle card visibility
  const toggleCardVisibility = (cardKey) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };
  
  // Show/hide all cards
  const showAllCards = () => {
    setVisibleCards({
      totalLeads: true,
      newLeads: true,
      pending: true,
      checkedOut: true,
      todaysActivity: true,
      topProduct: true,
      topSource: true,
      conversionRate: true
    });
  };
  
  const hideAllCards = () => {
    setVisibleCards({
      totalLeads: false,
      newLeads: false,
      pending: false,
      checkedOut: false,
      todaysActivity: false,
      topProduct: false,
      topSource: false,
      conversionRate: false
    });
  };
  
  // Handlers for new components
  const handleToggleColumn = (columnId) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleShowAllColumns = () => {
    setVisibleColumns(columns.map(col => col.id));
  };

  const handleHideAllColumns = () => {
    setVisibleColumns([]);
  };

  const handleToggleFilter = (filterId) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleViewDetails = (leadId) => {
    const lead = mockLeads.find(l => l.id === leadId);
    setSelectedDetailLead(lead);
  };

  // Bulk action handlers
  const handleBulkCheckout = () => {
    // Implement bulk checkout logic
  };

  const handleBulkAssign = () => {
    // Implement bulk assign logic
  };

  const handleBulkDelete = () => {
    // Implement bulk delete logic
  };

  const handleBulkEmail = () => {
    // Implement bulk email logic
  };

  const handleBulkTag = () => {
    // Implement bulk tag logic
  };

  const handleBulkExport = () => {
    // Implement bulk export logic
  };

  const handleBulkMessage = () => {
    // Implement bulk message logic
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setActiveFilters([]);
    setFilterValue('all');
    setSearchQuery('');
  };

  // Add state for section collapse
  const [mainMetricsCollapsed, setMainMetricsCollapsed] = useState(false);
  const [insightsCollapsed, setInsightsCollapsed] = useState(false);

  // Add metrics calculation function
  const calculateMetrics = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count leads by status
    const newLeadsCount = mockLeads.filter(lead => lead.status === 'new').length;
    const pendingCount = mockLeads.filter(lead => lead.status === 'pending').length;
    const checkedOutCount = mockLeads.filter(lead => lead.status === 'checked_out').length;
    
    // Count today's leads
    const todayLeadsCount = mockLeads.filter(lead => {
      const leadDate = new Date(lead.received);
      return leadDate >= today;
    }).length;
    
    // Find top product
    const productCounts = {};
    mockLeads.forEach(lead => {
      productCounts[lead.product] = (productCounts[lead.product] || 0) + 1;
    });
    const topProduct = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0] || 'None';
    
    // Find top source
    const sourceCounts = {};
    mockLeads.forEach(lead => {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    });
    const topSource = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0] || 'None';
    
    // Calculate conversion rate
    const conversionRate = checkedOutCount > 0 
      ? `${Math.round((checkedOutCount / mockLeads.length) * 100)}%` 
      : '0%';
    
    return {
      totalLeads: mockLeads.length,
      newLeads: newLeadsCount,
      pending: pendingCount,
      checkedOut: checkedOutCount,
      todayLeads: todayLeadsCount,
      topProduct,
      topSource,
      conversionRate
    };
  };

  const metrics = calculateMetrics();

  const toast = useToast();
  const [showFeatureRequestSidebar, setShowFeatureRequestSidebar] = useState(false);

  // Function to get product icon
  const getProductIcon = (product) => {
    switch (product) {
      case 'Windows':
        return <Square size={16} />;
      case 'Doors':
        return <Home size={16} />;
      case 'Roof':
        return <Building size={16} />;
      case 'Siding':
        return <Layers size={16} />;
      case 'Gutter':
        return <Droplets size={16} />;
      case 'Bath':
        return <Bath size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  // Function to get source icon
  const getSourceIcon = (source) => {
    switch (source) {
      case 'Online':
        return <Globe size={16} color="#3182CE" />;
      case 'Email':
        return <Mail size={16} color="#3182CE" />;
      case 'Partner':
        return <Users size={16} color="#DD6B20" />;
      case 'Retail':
        return <Home size={16} color="#718096" />;
      case 'Social':
        return <MessageSquarePlus size={16} color="#D53F8C" />;
      case 'Event':
        return <Calendar size={16} color="#805AD5" />;
      case 'Support':
        return <Phone size={16} color="#38A169" />;
      default:
        return <Globe size={16} />;
    }
  };

  // Add helper functions for name and location formatting
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getFullName = (firstName, lastName) => {
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  const getLocation = (city, state) => {
    return `${city || ''}, ${state || ''}`.trim();
  };

  return (
    <>
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1000}
        width="90%"
        maxWidth="1400px"
        height="80vh"
        bg={bgColor}
        borderRadius="lg"
        boxShadow="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Flex 
          p={3} 
          borderBottom="1px solid" 
          borderColor={borderColor}
          bg={headerBg}
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack spacing={3} alignItems="center">
            <Heading size="md">Inbound Lead Management</Heading>
            <Box
              as={motion.div}
              bg="purple.50"
              px={3}
              py={1}
              borderRadius="md"
              display="inline-block"
              borderLeft="3px solid"
              borderColor="purple.500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: [1, 1.03, 1],
                transition: { 
                  duration: 0.5,
                  scale: {
                    repeat: Infinity,
                    duration: 2,
                    repeatType: "reverse"
                  }
                }
              }}
            >
              <Text
                color="purple.500"
                fontSize="sm"
                fontWeight="bold"
                as={motion.p}
                animate={{
                  textShadow: ["0px 0px 0px rgba(128,90,213,0)", "0px 0px 10px rgba(128,90,213,0.5)", "0px 0px 0px rgba(128,90,213,0)"],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
              >
                Coming Soon! 🚀 This feature launches in 2 days. Help shape it by sharing your feedback—click the sidebar! 👉
              </Text>
            </Box>
          </HStack>
          <HStack spacing={4}>
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                leftIcon={<Settings size={16} />}
                variant="outline"
              >
                Display Options
              </MenuButton>
              <MenuList>
                <MenuItem onClick={showAllCards}>Show All Cards</MenuItem>
                <MenuItem onClick={hideAllCards}>Hide All Cards</MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={visibleCards.totalLeads ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('totalLeads')}
                >
                  {visibleCards.totalLeads ? 'Hide' : 'Show'} Total Leads
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.newLeads ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('newLeads')}
                >
                  {visibleCards.newLeads ? 'Hide' : 'Show'} New Leads
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.pending ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('pending')}
                >
                  {visibleCards.pending ? 'Hide' : 'Show'} Pending
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.checkedOut ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('checkedOut')}
                >
                  {visibleCards.checkedOut ? 'Hide' : 'Show'} Checked Out
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={visibleCards.todaysActivity ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('todaysActivity')}
                >
                  {visibleCards.todaysActivity ? 'Hide' : 'Show'} Today's Activity
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.topProduct ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('topProduct')}
                >
                  {visibleCards.topProduct ? 'Hide' : 'Show'} Top Product
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.topSource ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('topSource')}
                >
                  {visibleCards.topSource ? 'Hide' : 'Show'} Top Source
                </MenuItem>
                <MenuItem 
                  icon={visibleCards.conversionRate ? <Eye size={16} /> : <EyeOff size={16} />}
                  onClick={() => toggleCardVisibility('conversionRate')}
                >
                  {visibleCards.conversionRate ? 'Hide' : 'Show'} Conversion Rate
                </MenuItem>
              </MenuList>
            </Menu>

            <Button 
              size="sm" 
              leftIcon={<BarChart2 size={16} />}
              colorScheme="purple"
              variant="outline"
              onClick={() => setShowHeatMap(true)}
            >
              Heat Map
            </Button>

            <IconButton
              icon={<X size={18} />}
              aria-label="Close"
              variant="ghost"
              onClick={onClose}
            />
          </HStack>
        </Flex>
        
        {/* Dashboard Content */}
        <Box p={3} overflowY="auto" height="calc(100% - 56px)">
          {/* Metrics Sections */}
          <MetricsGrid 
            title="Main Metrics" 
            metrics={metrics} 
            isCollapsed={!showMainMetrics}
            onToggleCollapse={() => setShowMainMetrics(!showMainMetrics)}
          />
          
          <MetricsGrid 
            title="Insights" 
            metrics={metrics} 
            isCollapsed={!showInsightMetrics}
            onToggleCollapse={() => setShowInsightMetrics(!showInsightMetrics)}
          />

          {/* Search and Filter Bar */}
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <HStack spacing={2}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Filter options"
                  icon={<Filter size={18} />}
                  size="sm"
                  variant="outline"
                  colorScheme={activeFilters.length > 0 ? "blue" : "gray"}
                />
                <MenuList>
                  <MenuItem onClick={() => handleToggleFilter(null)}>
                    All
                  </MenuItem>
                  <MenuDivider />
                  {Object.entries(filterCounts).map(([filter, count]) => (
                    <MenuItem 
                      key={filter}
                      onClick={() => handleToggleFilter(filter)}
                      icon={activeFilters.includes(filter) ? <CheckCircle size={16} /> : null}
                    >
                      {filter} ({count})
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Button
                leftIcon={<RefreshCw size={16} />}
                size="sm"
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </HStack>
            <HStack spacing={2}>
              <ButtonGroup isAttached size="sm">
                <Button 
                  leftIcon={<BarChart2 size={16} />}
                  variant={viewMode === 'table' ? 'solid' : 'outline'}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </Button>
                <Button 
                  leftIcon={<GridIcon size={16} />}
                  variant={viewMode === 'card' ? 'solid' : 'outline'}
                  onClick={() => setViewMode('card')}
                >
                  Cards
                </Button>
              </ButtonGroup>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDown />} size="sm">
                  Columns
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={handleShowAllColumns}>Show All</MenuItem>
                  <MenuItem onClick={handleHideAllColumns}>Hide All</MenuItem>
                  <MenuDivider />
                  {columns.map(column => (
                    <MenuItem 
                      key={column.id}
                      icon={visibleColumns.includes(column.id) ? <Eye size={16} /> : <EyeOff size={16} />}
                      onClick={() => handleToggleColumn(column.id)}
                    >
                      {column.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          
          {/* Quick Filter Chips */}
          <QuickFilterChips
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            filterCounts={filterCounts}
            onClearFilters={handleClearFilters}
          />

          {/* Leads View (Table or Grid) */}
          {viewMode === 'table' ? (
            <Box
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
            >
              <Table variant="simple" size="md">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th px={4} py={3} width="40px">
                      <Checkbox
                        isChecked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAll}
                        colorScheme="purple"
                      />
                    </Th>
                    {columns.filter(col => visibleColumns.includes(col.id)).map(column => (
                      <Th 
                        key={column.id} 
                        px={4} 
                        py={3}
                        color={textColor}
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        fontWeight="medium"
                        cursor="pointer"
                        _hover={{ color: 'purple.500' }}
                      >
                        <HStack spacing={1}>
                          {column.icon}
                          <Text>{column.label}</Text>
                        </HStack>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLeads.map(lead => (
                    <Tr 
                      key={lead.id}
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                      onClick={() => handleViewDetails(lead.id)}
                    >
                      <Td px={4} py={3} width="40px" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          isChecked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          colorScheme="purple"
                        />
                      </Td>
                      {visibleColumns.includes('id') && (
                        <Td px={4} py={3} fontSize="sm">{lead.id}</Td>
                      )}
                      {visibleColumns.includes('firstName') && (
                        <Td px={4} py={3} fontSize="sm">{lead.firstName}</Td>
                      )}
                      {visibleColumns.includes('lastName') && (
                        <Td px={4} py={3} fontSize="sm">{lead.lastName}</Td>
                      )}
                      {visibleColumns.includes('location') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            <MapPin size={16} color="#718096" />
                            <Text>{getLocation(lead.city, lead.state)}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('phone') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            <Phone size={16} color="#718096" />
                            <Text>{lead.phone}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('product') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            {getProductIcon(lead.product)}
                            <Text>{lead.product}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('email') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            <Mail size={16} color="#718096" />
                            <Text>{lead.email}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('received') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            <ClockIcon size={16} color="#718096" />
                            <Text>{formatDate(lead.received)}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('source') && (
                        <Td px={4} py={3} fontSize="sm">
                          <HStack>
                            {getSourceIcon(lead.source)}
                            <Text>{lead.source}</Text>
                          </HStack>
                        </Td>
                      )}
                      {visibleColumns.includes('status') && (
                        <Td px={4} py={3} fontSize="sm">
                          <Badge colorScheme={lead.status === 'pending' ? 'purple' : 'green'}>
                            {lead.status}
                          </Badge>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={4} mt={4}>
              {filteredLeads.map(lead => (
                <Box 
                  key={lead.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="sm"
                  bg={bgColor}
                  transition="all 0.2s"
                  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                  cursor="pointer"
                  onClick={() => handleViewDetails(lead.id)}
                >
                  <Flex p={4} alignItems="center" borderBottomWidth="1px" borderColor={borderColor}>
                    <Flex
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="purple.100"
                      color="purple.700"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="sm"
                      mr={3}
                    >
                      {getInitials(lead.firstName, lead.lastName)}
                    </Flex>
                    <Box flex="1">
                      <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                        {getFullName(lead.firstName, lead.lastName)}
                      </Text>
                      <Text fontSize="sm" color="gray.500" noOfLines={1}>
                        {lead.product}
                      </Text>
                    </Box>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem icon={<Eye size={16} />}>View Details</MenuItem>
                        <MenuItem icon={<Edit size={16} />}>Edit</MenuItem>
                        <MenuItem icon={<Trash size={16} />}>Delete</MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                  <Box p={4} pt={3}>
                    <Flex direction="column" gap={2}>
                      <Flex alignItems="center">
                        <MapPin size={14} color="#718096" />
                        <Text ml={2} fontSize="sm" color="gray.600" noOfLines={1}>
                          {getLocation(lead.city, lead.state)}
                        </Text>
                      </Flex>
                      <Flex alignItems="center">
                        <Phone size={14} color="#718096" />
                        <Text ml={2} fontSize="sm" color="gray.600" noOfLines={1}>
                          {lead.phone}
                        </Text>
                      </Flex>
                      <Flex alignItems="center">
                        <Mail size={14} color="#718096" />
                        <Text ml={2} fontSize="sm" color="gray.600" noOfLines={1}>
                          {lead.email}
                        </Text>
                      </Flex>
                      <Flex alignItems="center">
                        <ClockIcon size={14} color="#718096" />
                        <Text ml={2} fontSize="sm" color="gray.600">
                          {formatDate(lead.received)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>
                  <Flex 
                    p={3} 
                    borderTopWidth="1px" 
                    borderColor={borderColor}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Badge 
                      colorScheme={
                        lead.source === 'Online' ? 'blue' :
                        lead.source === 'Partner' ? 'orange' :
                        lead.source === 'Retail' ? 'gray' :
                        lead.source === 'Social' ? 'pink' :
                        lead.source === 'Event' ? 'purple' :
                        lead.source === 'Email' ? 'cyan' :
                        lead.source === 'Support' ? 'green' : 'gray'
                      }
                      px={2}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      {lead.source}
                    </Badge>
                    <IconButton
                      icon={getProductIcon(lead.product)}
                      size="sm"
                      variant="ghost"
                      aria-label={lead.product}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle product-specific action
                      }}
                    />
                  </Flex>
                </Box>
              ))}
            </Grid>
          )}

          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedLeads.length}
            onCheckout={handleBulkCheckout}
            onAssign={handleBulkAssign}
            onDelete={handleBulkDelete}
            onEmail={handleBulkEmail}
            onTag={handleBulkTag}
            onExport={handleBulkExport}
            onMessage={handleBulkMessage}
            onClearSelection={() => setSelectedLeads([])}
          />

          {/* Lead Detail Sidebar */}
          <LeadDetailSidebar
            lead={selectedDetailLead}
            isOpen={!!selectedDetailLead}
            onClose={() => setSelectedDetailLead(null)}
            formatDate={formatDate}
          />
        </Box>
      </Box>
      
      {/* Heat Map Modal - Render at root level */}
      {showHeatMap && (
        <HeatMapModal 
          isOpen={showHeatMap} 
          onClose={() => setShowHeatMap(false)} 
        />
      )}

      {/* Feature Request Sidebar */}
      {showFeatureRequestSidebar && (
        <FeatureRequestSidebar
          onClose={() => setShowFeatureRequestSidebar(false)}
          onRequestSubmitted={() => {
            setShowFeatureRequestSidebar(false);
            toast({
              title: "Thank you for your feedback!",
              description: "We'll review your request and get back to you soon.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          }}
        />
      )}
    </>
  );
};

export default InboundLeadManagement; 
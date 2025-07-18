// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ShoeCard from '../components/ShoeCard';
import BottomNavigation from '../components/BottomNavigation';
import FilterModal from '../components/FilterModal';

const HomeScreen = ({ onNavigate, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shoes, setShoes] = useState([]);
  const [filteredShoes, setFilteredShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [userRole, setUserRole] = useState(null);
  
  // Enhanced filter states - FIXED: Set inStock to false by default
  const [filters, setFilters] = useState({
    brands: [],
    priceRange: { min: 0, max: 1000 },
    sizes: [],
    conditions: [],
    categories: [],
    colors: [],
    materials: [],
    genders: [],
    ageGroups: [],
    seasons: [],
    styles: [],
    rating: 0,
    featured: false,
    inStock: false, // FIXED: Changed to false so all shoes show by default
  });

  useEffect(() => {
    loadUserRole();
    const unsubscribe = loadShoes();
    return () => unsubscribe && unsubscribe(); // Cleanup subscription
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [shoes, searchQuery, filters, sortBy]);

  const loadUserRole = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      setUserRole(userData?.role || 'customer');
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadShoes = () => {
    try {
      let q = query(collection(db, 'shoes'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const shoesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Loaded shoes:', shoesData.length); // Debug log
        setShoes(shoesData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading shoes:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up shoes listener:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = shoes.filter(shoe => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
                           shoe.name?.toLowerCase().includes(searchLower) ||
                           shoe.brand?.toLowerCase().includes(searchLower) ||
                           shoe.description?.toLowerCase().includes(searchLower) ||
                           shoe.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
                           shoe.category?.toLowerCase().includes(searchLower) ||
                           shoe.color?.toLowerCase().includes(searchLower);
      
      // Brand filter
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(shoe.brand);
      
      // Price filter - FIXED: Better price filtering
      const shoePrice = parseFloat(shoe.price) || 0;
      const matchesPrice = shoePrice >= filters.priceRange.min && 
                          (filters.priceRange.max === 1000 ? true : shoePrice <= filters.priceRange.max);
      
      // Size filter
      const matchesSize = filters.sizes.length === 0 || 
                         (shoe.sizes && shoe.sizes.some(size => filters.sizes.includes(size)));
      
      // Condition filter
      const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(shoe.condition);
      
      // Category filter
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(shoe.category);
      
      // Color filter - FIXED: Better color matching
      const matchesColor = filters.colors.length === 0 || 
                          (shoe.color && filters.colors.some(color => 
                            shoe.color.toLowerCase().includes(color.toLowerCase())
                          ));
      
      // Material filter - FIXED: Better material matching
      const matchesMaterial = filters.materials.length === 0 || 
                             (shoe.material && filters.materials.some(material => 
                               shoe.material.toLowerCase().includes(material.toLowerCase())
                             ));
      
      // Gender filter
      const matchesGender = filters.genders.length === 0 || filters.genders.includes(shoe.targetGender);
      
      // Age group filter
      const matchesAge = filters.ageGroups.length === 0 || filters.ageGroups.includes(shoe.ageGroup);
      
      // Season filter
      const matchesSeason = filters.seasons.length === 0 || filters.seasons.includes(shoe.season);
      
      // Style filter
      const matchesStyle = filters.styles.length === 0 || filters.styles.includes(shoe.style);
      
      // Rating filter
      const matchesRating = filters.rating === 0 || (shoe.rating || 0) >= filters.rating;
      
      // Featured filter
      const matchesFeatured = !filters.featured || shoe.featured;
      
      // Stock filter - FIXED: Only filter if inStock is true
      const matchesStock = !filters.inStock || shoe.inStock !== false;

      return matchesSearch && matchesBrand && matchesPrice && matchesSize && 
             matchesCondition && matchesCategory && matchesColor && matchesMaterial &&
             matchesGender && matchesAge && matchesSeason && matchesStyle &&
             matchesRating && matchesFeatured && matchesStock;
    });

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA - dateB;
        });
        break;
      case 'priceHigh':
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        break;
      case 'priceLow':
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'nameAZ':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'nameZA':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        break;
    }

    console.log('Filtered shoes:', filtered.length); // Debug log
    setFilteredShoes(filtered);
  };

  const clearFilters = () => {
    setFilters({
      brands: [],
      priceRange: { min: 0, max: 1000 },
      sizes: [],
      conditions: [],
      categories: [],
      colors: [],
      materials: [],
      genders: [],
      ageGroups: [],
      seasons: [],
      styles: [],
      rating: 0,
      featured: false,
      inStock: false, // FIXED: Keep as false
    });
    setSearchQuery('');
    setSortBy('newest');
  };

  const getActiveFiltersCount = () => {
    return filters.brands.length + 
           filters.sizes.length + 
           filters.conditions.length +
           filters.categories.length +
           filters.colors.length +
           filters.materials.length +
           filters.genders.length +
           filters.ageGroups.length +
           filters.seasons.length +
           filters.styles.length +
           (filters.rating > 0 ? 1 : 0) +
           (filters.featured ? 1 : 0) +
           (filters.inStock ? 1 : 0) +
           (filters.priceRange.min > 0 || filters.priceRange.max < 1000 ? 1 : 0);
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Get unique values for filters with safety checks - FIXED: Better error handling
  const getUniqueValues = () => {
    if (!shoes || shoes.length === 0) {
      return {
        brands: [],
        sizes: [],
        conditions: [],
        categories: [],
        colors: [],
        materials: [],
        genders: [],
        ageGroups: [],
        seasons: [],
        styles: [],
      };
    }

    try {
      return {
        brands: [...new Set(shoes.map(shoe => shoe.brand).filter(Boolean))].sort(),
        sizes: [...new Set(shoes.flatMap(shoe => shoe.sizes || []))].sort((a, b) => parseFloat(a) - parseFloat(b)),
        conditions: [...new Set(shoes.map(shoe => shoe.condition).filter(Boolean))].sort(),
        categories: [...new Set(shoes.map(shoe => shoe.category).filter(Boolean))].sort(),
        colors: [...new Set(shoes.map(shoe => shoe.color).filter(Boolean))].sort(),
        materials: [...new Set(shoes.map(shoe => shoe.material).filter(Boolean))].sort(),
        genders: [...new Set(shoes.map(shoe => shoe.targetGender).filter(Boolean))].sort(),
        ageGroups: [...new Set(shoes.map(shoe => shoe.ageGroup).filter(Boolean))].sort(),
        seasons: [...new Set(shoes.map(shoe => shoe.season).filter(Boolean))].sort(),
        styles: [...new Set(shoes.map(shoe => shoe.style).filter(Boolean))].sort(),
      };
    } catch (error) {
      console.error('Error getting unique values:', error);
      return {
        brands: [],
        sizes: [],
        conditions: [],
        categories: [],
        colors: [],
        materials: [],
        genders: [],
        ageGroups: [],
        seasons: [],
        styles: [],
      };
    }
  };

  const uniqueValues = getUniqueValues();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#e0e0e0" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading shoes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with proper spacing for notch */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello ${userRole === 'admin' ? 'Admin' : 'Customer'}! 👋` : 'Welcome Guest! 👋'}
            </Text>
            <Text style={styles.welcomeText}>Find your perfect shoes</Text>
          </View>
        </View>

        {/* Search and Filter Row */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shoes, brands, or tags..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activeFiltersCount > 0 && styles.activeFilterButton]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={20} color={activeFiltersCount > 0 ? "#ffffff" : "#6b7280"} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Sort Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            { key: 'newest', label: 'Newest' },
            { key: 'featured', label: 'Featured' },
            { key: 'priceLow', label: 'Price ↑' },
            { key: 'priceHigh', label: 'Price ↓' },
            { key: 'rating', label: 'Top Rated' },
            { key: 'popular', label: 'Popular' },
            { key: 'nameAZ', label: 'A-Z' }
          ].map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[styles.sortChip, sortBy === sort.key && styles.activeSortChip]}
              onPress={() => setSortBy(sort.key)}
            >
              <Text style={[styles.sortText, sortBy === sort.key && styles.activeSortText]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Summary */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredShoes.length} shoe{filteredShoes.length !== 1 ? 's' : ''} found
        </Text>
        {(activeFiltersCount > 0 || searchQuery.length > 0) && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Shoes Grid */}
      <ScrollView style={styles.shoesContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.shoesGrid}>
          {filteredShoes.map((shoe) => (
            <ShoeCard
              key={shoe.id}
              shoe={shoe}
              onNavigate={onNavigate}
              currentUserId={user?.uid}
              userRole={userRole}
            />
          ))}
        </View>
        {filteredShoes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {shoes.length === 0 ? 'No shoes available' : 'No shoes match your filters'}
            </Text>
            <Text style={styles.emptySubtext}>
              {shoes.length === 0 
                ? 'Be the first to add a shoe to the marketplace!' 
                : 'Try adjusting your filters or search terms'
              }
            </Text>
            {user && (
              <TouchableOpacity
                style={styles.addShoeButton}
                onPress={() => onNavigate('addShoe')}
              >
                <Text style={styles.addShoeButtonText}>
                  {shoes.length === 0 ? 'Add First Shoe' : 'Add New Shoe'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        uniqueValues={uniqueValues}
      />

      {/* Bottom Navigation */}
      <BottomNavigation onNavigate={onNavigate} currentScreen="home" user={user} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop:20,
    backgroundColor: '#ffffff',
    // marginBottom:5
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Extra padding for notch
    paddingBottom: 8,
    borderBottomWidth: 1,
    backgroundColor:'#e0e0e0',
    borderBottomColor: '#f3f4f6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  loginButtonText: {
    color: '#2563eb',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sortContainer: {
    marginBottom: 8,
  },
  sortChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: '#2563eb',
  },
  sortText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeSortText: {
    color: '#ffffff',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  shoesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  shoesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 120, // Extra padding for fancy bottom nav
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addShoeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addShoeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
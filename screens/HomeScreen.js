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
  
  // Enhanced filter states
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
    inStock: true,
  });

  useEffect(() => {
    loadUserRole();
    loadShoes();
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
    let q = query(collection(db, 'shoes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shoesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShoes(shoesData);
      setLoading(false);
    });

    return unsubscribe;
  };

  const applyFilters = () => {
    let filtered = shoes.filter(shoe => {
      // Search filter
      const matchesSearch = shoe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shoe.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shoe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shoe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Brand filter
      const matchesBrand = filters.brands.length === 0 || filters.brands.includes(shoe.brand);
      
      // Price filter
      const matchesPrice = shoe.price >= filters.priceRange.min && 
                          shoe.price <= filters.priceRange.max;
      
      // Size filter
      const matchesSize = filters.sizes.length === 0 || 
                         (shoe.sizes && shoe.sizes.some(size => filters.sizes.includes(size)));
      
      // Condition filter
      const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(shoe.condition);
      
      // Category filter
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(shoe.category);
      
      // Color filter
      const matchesColor = filters.colors.length === 0 || 
                          (shoe.color && filters.colors.some(color => 
                            shoe.color.toLowerCase().includes(color.toLowerCase())
                          ));
      
      // Material filter
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
      const matchesRating = (shoe.rating || 0) >= filters.rating;
      
      // Featured filter
      const matchesFeatured = !filters.featured || shoe.featured;
      
      // Stock filter
      const matchesStock = !filters.inStock || shoe.inStock;

      return matchesSearch && matchesBrand && matchesPrice && matchesSize && 
             matchesCondition && matchesCategory && matchesColor && matchesMaterial &&
             matchesGender && matchesAge && matchesSeason && matchesStyle &&
             matchesRating && matchesFeatured && matchesStock;
    });

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priceHigh':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'priceLow':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'nameAZ':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameZA':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        break;
    }

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
      inStock: true,
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
           (filters.priceRange.min > 0 || filters.priceRange.max < 1000 ? 1 : 0);
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Get unique values for filters with safety checks
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

    return {
      brands: [...new Set(shoes.map(shoe => shoe.brand).filter(Boolean))],
      sizes: [...new Set(shoes.flatMap(shoe => shoe.sizes || []))].sort((a, b) => a - b),
      conditions: [...new Set(shoes.map(shoe => shoe.condition).filter(Boolean))],
      categories: [...new Set(shoes.map(shoe => shoe.category).filter(Boolean))],
      colors: [...new Set(shoes.map(shoe => shoe.color).filter(Boolean))],
      materials: [...new Set(shoes.map(shoe => shoe.material).filter(Boolean))],
      genders: [...new Set(shoes.map(shoe => shoe.targetGender).filter(Boolean))],
      ageGroups: [...new Set(shoes.map(shoe => shoe.ageGroup).filter(Boolean))],
      seasons: [...new Set(shoes.map(shoe => shoe.season).filter(Boolean))],
      styles: [...new Set(shoes.map(shoe => shoe.style).filter(Boolean))],
    };
  };

  const uniqueValues = getUniqueValues();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
          <View style={styles.headerButtons}>
            {user ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onNavigate('addShoe')}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => onNavigate('login')}
              >
                <Ionicons name="person-outline" size={20} color="#2563eb" />
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}
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
        {activeFiltersCount > 0 && (
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
            <Text style={styles.emptyText}>No shoes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
            {user && (
              <TouchableOpacity
                style={styles.addShoeButton}
                onPress={() => onNavigate('addShoe')}
              >
                <Text style={styles.addShoeButtonText}>Add First Shoe</Text>
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
    backgroundColor: '#ffffff',
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

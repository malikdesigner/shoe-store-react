// components/FilterModal.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({ visible, onClose, filters, setFilters, uniqueValues }) => {
  const conditions = ['new', 'like-new', 'good', 'fair', 'refurbished'];
  const genders = ['men', 'women', 'unisex', 'kids'];
  const ageGroups = ['adult', 'youth', 'child', 'toddler', 'infant'];
  const seasons = ['all-season', 'summer', 'winter', 'spring', 'fall'];
  const shoeStyles = ['casual', 'formal', 'athletic', 'vintage', 'modern', 'luxury']; // FIXED: Renamed from styles_list

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
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
      inStock: false, // FIXED: Set to false by default so all shoes show
    });
  };

  const FilterSection = ({ title, items, filterKey, type = 'array' }) => {
    // Don't render section if no items available
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.chipContainer}>
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                type === 'array' 
                  ? filters[filterKey].includes(item) && styles.selectedChip
                  : filters[filterKey] === item && styles.selectedChip
              ]}
              onPress={() => 
                type === 'array' 
                  ? toggleArrayFilter(filterKey, item)
                  : updateFilter(filterKey, item)
              }
            >
              <Text style={[
                styles.chipText,
                type === 'array'
                  ? filters[filterKey].includes(item) && styles.selectedChipText
                  : filters[filterKey] === item && styles.selectedChipText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advanced Filters</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>
                ${filters.priceRange.min} - ${filters.priceRange.max === 1000 ? '1000+' : filters.priceRange.max}
              </Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TouchableOpacity
                style={[
                  styles.priceButton,
                  filters.priceRange.min === 0 && filters.priceRange.max === 1000 && styles.selectedPriceButton
                ]}
                onPress={() => updateFilter('priceRange', { min: 0, max: 1000 })}
              >
                <Text style={[
                  styles.priceButtonText,
                  filters.priceRange.min === 0 && filters.priceRange.max === 1000 && styles.selectedPriceButtonText
                ]}>All Prices</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priceButton,
                  filters.priceRange.min === 0 && filters.priceRange.max === 50 && styles.selectedPriceButton
                ]}
                onPress={() => updateFilter('priceRange', { min: 0, max: 50 })}
              >
                <Text style={[
                  styles.priceButtonText,
                  filters.priceRange.min === 0 && filters.priceRange.max === 50 && styles.selectedPriceButtonText
                ]}>Under $50</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priceButton,
                  filters.priceRange.min === 50 && filters.priceRange.max === 100 && styles.selectedPriceButton
                ]}
                onPress={() => updateFilter('priceRange', { min: 50, max: 100 })}
              >
                <Text style={[
                  styles.priceButtonText,
                  filters.priceRange.min === 50 && filters.priceRange.max === 100 && styles.selectedPriceButtonText
                ]}>$50 - $100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priceButton,
                  filters.priceRange.min === 100 && filters.priceRange.max === 200 && styles.selectedPriceButton
                ]}
                onPress={() => updateFilter('priceRange', { min: 100, max: 200 })}
              >
                <Text style={[
                  styles.priceButtonText,
                  filters.priceRange.min === 100 && filters.priceRange.max === 200 && styles.selectedPriceButtonText
                ]}>$100 - $200</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priceButton,
                  filters.priceRange.min === 200 && filters.priceRange.max === 1000 && styles.selectedPriceButton
                ]}
                onPress={() => updateFilter('priceRange', { min: 200, max: 1000 })}
              >
                <Text style={[
                  styles.priceButtonText,
                  filters.priceRange.min === 200 && filters.priceRange.max === 1000 && styles.selectedPriceButtonText
                ]}>$200+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Brands */}
          <FilterSection title="Brands" items={uniqueValues?.brands || []} filterKey="brands" />

          {/* Categories */}
          <FilterSection title="Categories" items={uniqueValues?.categories || []} filterKey="categories" />

          {/* Sizes */}
          {uniqueValues?.sizes && uniqueValues.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sizes</Text>
              <View style={styles.chipContainer}>
                {uniqueValues.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeChip,
                      filters.sizes.includes(size) && styles.selectedChip
                    ]}
                    onPress={() => toggleArrayFilter('sizes', size)}
                  >
                    <Text style={[
                      styles.chipText,
                      filters.sizes.includes(size) && styles.selectedChipText
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Conditions */}
          <FilterSection title="Condition" items={conditions} filterKey="conditions" />

          {/* Gender */}
          <FilterSection title="Target Gender" items={genders} filterKey="genders" />

          {/* Age Groups */}
          <FilterSection title="Age Group" items={ageGroups} filterKey="ageGroups" />

          {/* Seasons */}
          <FilterSection title="Season" items={seasons} filterKey="seasons" />

          {/* Styles */}
          <FilterSection title="Style" items={shoeStyles} filterKey="styles" /> {/* FIXED: Use shoeStyles */}

          {/* Colors */}
          {uniqueValues?.colors && uniqueValues.colors.length > 0 && (
            <FilterSection title="Colors" items={uniqueValues.colors} filterKey="colors" />
          )}

          {/* Materials */}
          {uniqueValues?.materials && uniqueValues.materials.length > 0 && (
            <FilterSection title="Materials" items={uniqueValues.materials} filterKey="materials" />
          )}

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingChip,
                    filters.rating === rating && styles.selectedChip
                  ]}
                  onPress={() => updateFilter('rating', rating)}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color={filters.rating === rating ? "#ffffff" : "#fbbf24"}
                  />
                  <Text style={[
                    styles.chipText,
                    filters.rating === rating && styles.selectedChipText
                  ]}>
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Filters</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  filters.featured && styles.selectedChip
                ]}
                onPress={() => updateFilter('featured', !filters.featured)}
              >
                <Ionicons 
                  name={filters.featured ? "star" : "star-outline"} 
                  size={16} 
                  color={filters.featured ? "#ffffff" : "#6b7280"} 
                />
                <Text style={[
                  styles.chipText,
                  filters.featured && styles.selectedChipText,
                  { marginLeft: 4 }
                ]}>
                  Featured Only
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.chip,
                  filters.inStock && styles.selectedChip
                ]}
                onPress={() => updateFilter('inStock', !filters.inStock)}
              >
                <Ionicons 
                  name={filters.inStock ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={16} 
                  color={filters.inStock ? "#ffffff" : "#6b7280"} 
                />
                <Text style={[
                  styles.chipText,
                  filters.inStock && styles.selectedChipText,
                  { marginLeft: 4 }
                ]}>
                  In Stock Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  priceInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedPriceButton: {
    backgroundColor: '#2563eb',
  },
  priceButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedPriceButtonText: {
    color: '#ffffff',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sizeChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#ffffff',
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal;
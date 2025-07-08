// screens/AddShoeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AddShoeScreen = ({ onNavigate, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    originalPrice: '',
    imageUrl: '',
    additionalImages: '',
    description: '',
    condition: 'new',
    category: 'sneakers',
    color: '',
    material: '',
    weight: '',
    manufacturer: '',
    countryOfOrigin: '',
    sku: '',
    tags: '',
    targetGender: 'unisex',
    ageGroup: 'adult',
    season: 'all-season',
    style: 'casual',
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);

  // Enhanced options
  const availableSizes = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15];
  const conditions = ['new', 'like-new', 'good', 'fair', 'refurbished'];
  const categories = ['sneakers', 'boots', 'sandals', 'formal', 'athletic', 'casual', 'hiking', 'running', 'basketball', 'soccer'];
  const genders = ['men', 'women', 'unisex', 'kids'];
  const ageGroups = ['adult', 'youth', 'child', 'toddler', 'infant'];
  const seasons = ['all-season', 'summer', 'winter', 'spring', 'fall'];
  const styles = ['casual', 'formal', 'athletic', 'vintage', 'modern', 'luxury'];

  // Check if user is logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color="#9ca3af" />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Please login to add shoes to the store</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size].sort((a, b) => a - b);
      }
    });
  };

  const handleAddShoe = async () => {
    const { name, brand, price, imageUrl } = formData;
    
    if (!name || !brand || !price || !imageUrl) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (selectedSizes.length === 0) {
      Alert.alert('Error', 'Please select at least one size');
      return;
    }

    setLoading(true);
    try {
      // Parse additional images
      const additionalImagesArray = formData.additionalImages
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await addDoc(collection(db, 'shoes'), {
        // Basic Info
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        price: parseFloat(price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(price),
        
        // Images
        image: imageUrl.trim(),
        additionalImages: additionalImagesArray,
        
        // Details
        description: formData.description.trim(),
        condition: formData.condition,
        category: formData.category,
        color: formData.color.trim(),
        material: formData.material.trim(),
        weight: formData.weight.trim(),
        
        // Manufacturing
        manufacturer: formData.manufacturer.trim(),
        countryOfOrigin: formData.countryOfOrigin.trim(),
        sku: formData.sku.trim(),
        
        // Classification
        targetGender: formData.targetGender,
        ageGroup: formData.ageGroup,
        season: formData.season,
        style: formData.style,
        
        // Availability
        sizes: selectedSizes,
        featured: formData.featured,
        tags: tagsArray,
        
        // Metrics
        rating: 0,
        ratingCount: 0,
        views: 0,
        likes: 0,
        
        // Seller Info
        sellerId: user.uid,
        sellerEmail: user.email,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Status
        isActive: true,
        inStock: true,
      });

      Alert.alert('Success', 'Shoe added successfully!');
      onNavigate('home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Shoe</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shoe Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Air Max 270"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nike"
              value={formData.brand}
              onChangeText={(value) => updateFormData('brand', value)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="150"
                value={formData.price}
                onChangeText={(value) => updateFormData('price', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Original Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="200"
                value={formData.originalPrice}
                onChangeText={(value) => updateFormData('originalPrice', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                placeholder="Black"
                value={formData.color}
                onChangeText={(value) => updateFormData('color', value)}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                placeholder="Leather"
                value={formData.material}
                onChangeText={(value) => updateFormData('material', value)}
              />
            </View>
          </View>

          {/* Classification */}
          <Text style={styles.sectionTitle}>Classification</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      formData.category === category && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('category', category)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.category === category && styles.selectedChipText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Target Gender *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.chip,
                      formData.targetGender === gender && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('targetGender', gender)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.targetGender === gender && styles.selectedChipText
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age Group *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {ageGroups.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.chip,
                      formData.ageGroup === age && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('ageGroup', age)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.ageGroup === age && styles.selectedChipText
                    ]}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Style *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {styles.map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.chip,
                      formData.style === style && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('style', style)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.style === style && styles.selectedChipText
                    ]}>
                      {style}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Season *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {seasons.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.chip,
                      formData.season === season && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('season', season)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.season === season && styles.selectedChipText
                    ]}>
                      {season}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Condition Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Condition *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {conditions.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.chip,
                      formData.condition === condition && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('condition', condition)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.condition === condition && styles.selectedChipText
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Size Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Available Sizes * ({selectedSizes.length} selected)</Text>
            <View style={styles.sizeGrid}>
              {availableSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    selectedSizes.includes(size) && styles.selectedSizeChip
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={[
                    styles.sizeChipText,
                    selectedSizes.includes(size) && styles.selectedSizeChipText
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Details */}
          <Text style={styles.sectionTitle}>Additional Details</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                placeholder="300g"
                value={formData.weight}
                onChangeText={(value) => updateFormData('weight', value)}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                placeholder="SKU-001"
                value={formData.sku}
                onChangeText={(value) => updateFormData('sku', value)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                placeholder="Nike Inc."
                value={formData.manufacturer}
                onChangeText={(value) => updateFormData('manufacturer', value)}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Country of Origin</Text>
              <TextInput
                style={styles.input}
                placeholder="Vietnam"
                value={formData.countryOfOrigin}
                onChangeText={(value) => updateFormData('countryOfOrigin', value)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="running, lightweight, breathable"
              value={formData.tags}
              onChangeText={(value) => updateFormData('tags', value)}
            />
          </View>

          {/* Featured Toggle */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.toggleContainer, formData.featured && styles.toggleActive]}
              onPress={() => updateFormData('featured', !formData.featured)}
            >
              <Ionicons 
                name={formData.featured ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={24} 
                color={formData.featured ? "#2563eb" : "#6b7280"} 
              />
              <Text style={[styles.toggleText, formData.featured && styles.toggleActiveText]}>
                Featured Product
              </Text>
            </TouchableOpacity>
          </View>

          {/* Media & Description */}
          <Text style={styles.sectionTitle}>Media & Description</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Main Image URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/shoe-image.jpg"
              value={formData.imageUrl}
              onChangeText={(value) => updateFormData('imageUrl', value)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Images (comma separated URLs)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              value={formData.additionalImages}
              onChangeText={(value) => updateFormData('additionalImages', value)}
              multiline
              numberOfLines={3}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the shoe features, condition, special details, etc."
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && styles.disabledButton]}
            onPress={handleAddShoe}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? 'Adding Shoe...' : 'Add Shoe'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sizeChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedSizeChip: {
    backgroundColor: '#2563eb',
  },
  sizeChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedSizeChipText: {
    color: '#ffffff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  toggleText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    fontWeight: '500',
  },
  toggleActiveText: {
    color: '#2563eb',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddShoeScreen;
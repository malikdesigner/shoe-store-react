// screens/AddShoeScreen.js
import React, { useState, useEffect } from 'react';
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
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AddShoeScreen = ({ onNavigate, user }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
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
    shoeStyle: 'casual',
    featured: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);

  // Enhanced options
  const availableSizes = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15];
  const conditions = ['new', 'like-new', 'good', 'fair', 'refurbished'];
  const categories = ['sneakers', 'boots', 'sandals', 'formal', 'athletic', 'casual', 'hiking', 'running', 'basketball', 'soccer'];
  const genders = ['men', 'women', 'unisex', 'kids'];
  const ageGroups = ['adult', 'youth', 'child', 'toddler', 'infant'];
  const seasons = ['all-season', 'summer', 'winter', 'spring', 'fall'];
  const shoeStyles = ['casual', 'formal', 'athletic', 'vintage', 'modern', 'luxury'];

  useEffect(() => {
    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      setUserRole(userData?.role || 'customer');
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('customer'); // Default to customer
    }
    setLoading(false);
  };

  // Check if user can add shoes (only customers and admins, not guests)
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.restrictedContainer}>
          <Ionicons name="person-add-outline" size={64} color="#f59e0b" />
          <Text style={styles.restrictedTitle}>Customer Access Required</Text>
          <Text style={styles.restrictedSubtitle}>
            Only registered customers can add shoes to the marketplace. Join our community to start selling!
          </Text>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => onNavigate('signup')}
          >
            <Ionicons name="person-add" size={20} color="#ffffff" />
            <Text style={styles.signupButtonText}>Sign Up as Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.loginButtonText}>Already have an account? Login</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only customers and admins can add shoes
  if (userRole !== 'customer' && userRole !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.restrictedContainer}>
          <Ionicons name="business-outline" size={64} color="#ef4444" />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedSubtitle}>
            Only customers can add shoes to sell in the marketplace. Your current role doesn't allow this action.
          </Text>
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
      Alert.alert('Missing Information', 'Please fill in all required fields: Name, Brand, Price, and Image URL');
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    if (selectedSizes.length === 0) {
      Alert.alert('Missing Sizes', 'Please select at least one available size');
      return;
    }

    setSubmitting(true);
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
        style: formData.shoeStyle,
        
        // Availability
        sizes: selectedSizes,
        featured: userRole === 'admin' ? formData.featured : false, // Only admins can set featured
        tags: tagsArray,
        
        // Metrics
        rating: 0,
        ratingCount: 0,
        views: 0,
        likes: 0,
        
        // Seller Info
        sellerId: user.uid,
        sellerEmail: user.email,
        sellerRole: userRole,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Status
        isActive: true,
        inStock: true,
      });

      Alert.alert(
        'Success! 🎉', 
        'Your shoe has been added to the marketplace successfully!',
        [
          { text: 'Add Another', onPress: () => {
            // Reset form
            setFormData({
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
              shoeStyle: 'casual',
              featured: false,
            });
            setSelectedSizes([]);
          }},
          { text: 'View Marketplace', onPress: () => onNavigate('home') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to add shoe: ${error.message}`);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add New Shoe</Text>
          {userRole === 'admin' && (
            <Text style={styles.adminBadge}>Admin Mode</Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* User Info Banner */}
          <View style={styles.sellerBanner}>
            <View style={styles.sellerInfo}>
              <Ionicons name="person-circle" size={24} color="#2563eb" />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>Selling as: {user.email}</Text>
                <Text style={styles.sellerRole}>{userRole === 'admin' ? 'Administrator' : 'Customer'}</Text>
              </View>
            </View>
          </View>

          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shoe Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Air Max 270, Stan Smith Classic"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nike, Adidas, Converse"
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
                placeholder="Black, White, Red"
                value={formData.color}
                onChangeText={(value) => updateFormData('color', value)}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                placeholder="Leather, Canvas, Synthetic"
                value={formData.material}
                onChangeText={(value) => updateFormData('material', value)}
              />
            </View>
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

          {/* Classification */}
          <Text style={styles.sectionTitle}>Product Classification</Text>

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

          {/* Admin-only Featured Toggle */}
          {userRole === 'admin' && (
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.toggleContainer, formData.featured && styles.toggleActive]}
                onPress={() => updateFormData('featured', !formData.featured)}
              >
                <Ionicons 
                  name={formData.featured ? "star" : "star-outline"} 
                  size={24} 
                  color={formData.featured ? "#f59e0b" : "#6b7280"} 
                />
                <Text style={[styles.toggleText, formData.featured && styles.toggleActiveText]}>
                  Featured Product (Admin Only)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Media & Description */}
          <Text style={styles.sectionTitle}>Images & Description</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Main Image URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/shoe-image.jpg"
              value={formData.imageUrl}
              onChangeText={(value) => updateFormData('imageUrl', value)}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Tip: Use high-quality images for better sales. Make sure the URL ends with .jpg, .png, or .webp
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the shoe's features, condition, fit, style, and any special details that buyers should know..."
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, submitting && styles.disabledButton]}
            onPress={handleAddShoe}
            disabled={submitting}
          >
            {submitting ? (
              <Text style={styles.addButtonText}>Adding Shoe...</Text>
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Shoe to Marketplace</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
            <Text style={styles.disclaimerText}>
              By adding this shoe, you agree to our seller terms and conditions. 
              Ensure all information is accurate and images are of the actual product.
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  restrictedSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  adminBadge: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  sellerBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sellerRole: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 2,
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
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
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
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  toggleText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    fontWeight: '500',
  },
  toggleActiveText: {
    color: '#f59e0b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    lineHeight: 16,
    flex: 1,
  },
});

export default AddShoeScreen;
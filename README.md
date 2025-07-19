# 👟 SoleHub - Premium Shoe Store App

A modern React Native e-commerce application for buying and selling premium footwear. Built with Firebase backend and featuring a clean, user-friendly interface.

## 📱 Features

### 🛍️ Shopping Experience
- **Browse & Search**: Explore thousands of shoes with advanced search and filtering
- **Categories**: Sneakers, formal shoes, boots, sandals, athletic wear, and more
- **Size Selection**: Comprehensive size charts and availability
- **Wishlist**: Save favorite shoes for later
- **Guest Shopping**: Browse and purchase without creating an account
- **Secure Checkout**: Multiple payment options with encrypted transactions

### 👤 User Management
- **Role-based Access**: Customer and Admin roles
- **Profile Management**: Edit personal information and preferences
- **Order History**: Track purchases and delivery status
- **Seller Dashboard**: List and manage your shoe inventory

### 🏪 Seller Features
- **Product Listing**: Add shoes with detailed specifications
- **Inventory Management**: Track stock, sizes, and conditions
- **Price Management**: Set competitive prices with discount options
- **Image Gallery**: Multiple product photos support

### 🔧 Admin Features
- **Content Moderation**: Review and approve listings
- **User Management**: Monitor user activities and roles
- **Featured Products**: Highlight premium or trending shoes
- **Analytics Dashboard**: Sales insights and platform metrics

## 🏗️ Technical Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Navigation**: Bottom Tab Navigation
- **UI Framework**: Custom components with modern design
- **Icons**: Expo Vector Icons
- **State Management**: React Hooks

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- iOS Simulator or Android Emulator

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/solehub-app.git
cd solehub-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Create `firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.sellerId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### 5. Run the Application
```bash
expo start
```

## 📁 Project Structure

```
solehub-app/
├── components/
│   ├── ProductCard.js          # Shoe product display card
│   ├── BottomNavigation.js     # Main navigation component
│   ├── FilterModal.js          # Advanced filtering system
│   └── CartItem.js            # Shopping cart item component
├── screens/
│   ├── HomeScreen.js          # Main product listing
│   ├── LoginScreen.js         # User authentication
│   ├── SignupScreen.js        # Account creation
│   ├── AddProductScreen.js    # Sell shoes interface
│   ├── EditProductScreen.js   # Edit shoe listings
│   ├── CartScreen.js          # Shopping cart
│   ├── WishlistScreen.js      # Saved shoes
│   ├── ProfileScreen.js       # User profile
│   └── CheckoutScreen.js      # Purchase flow
├── firebase/
│   └── config.js              # Firebase configuration
├── App.js                     # Main application component
└── README.md
```

## 🎯 Key Features Explained

### Shoe-Specific Filtering
- **Brand**: Nike, Adidas, Jordan, Converse, etc.
- **Size**: US, EU, UK sizing with half-sizes
- **Category**: Sneakers, dress shoes, boots, sandals
- **Price Range**: Custom price filtering
- **Condition**: New, like-new, good, fair
- **Color**: Comprehensive color options
- **Material**: Leather, canvas, synthetic, mesh

### Size Management
- Multiple size standards (US, EU, UK)
- Half-size availability
- Size-specific inventory tracking
- Size recommendations

### Advanced Search
- Search by brand, model, or style
- Filter by multiple criteria simultaneously
- Sort by price, popularity, or newness
- Save search preferences

## 👥 User Roles

### Customer
- Browse and search shoes
- Add items to cart and wishlist
- Purchase shoes securely
- Track order status
- Leave reviews and ratings

### Seller
- List shoes for sale
- Manage inventory and pricing
- Upload multiple product images
- Track sales performance
- Communicate with buyers

### Admin
- Moderate all content
- Manage user accounts
- Access analytics dashboard
- Control featured products
- Handle disputes

## 🛒 E-commerce Features

### Shopping Cart
- Add/remove items
- Quantity management
- Size selection
- Price calculations
- Guest cart persistence (3 hours)

### Checkout Process
- Shipping information
- Payment method selection
- Order confirmation
- Email notifications

### Payment Integration
- Credit/Debit cards
- PayPal support
- Apple Pay integration
- Secure transaction processing

## 🎨 Design System

### Color Palette
- Primary: Orange (#FF6B35)
- Secondary: Dark Gray (#2D3436)
- Background: Light Gray (#F8F9FA)
- Accent: Blue (#007AFF)

### Typography
- Headers: Bold, modern sans-serif
- Body: Clean, readable fonts
- Product names: Emphasized styling

## 📱 Screen Previews

### Home Screen
- Featured shoe collections
- Search and filter options
- Category quick access
- Trending products

### Product Details
- High-quality shoe images
- Detailed specifications
- Size selector
- Customer reviews
- Add to cart/wishlist

### Profile Dashboard
- Order history
- Saved shoes
- Account settings
- Seller statistics (if applicable)

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
```

### App Configuration
Customize app settings in `app.json`:
```json
{
  "expo": {
    "name": "SoleHub",
    "slug": "solehub-shoe-store",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B35"
    }
  }
}
```

## 🚀 Deployment

### Build for Production
```bash
expo build:android
expo build:ios
```

### Publishing Updates
```bash
expo publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 Support

For support, email support@solehub.com or join our Slack channel.

## 🔮 Roadmap

- [ ] AR try-on feature
- [ ] Social sharing integration
- [ ] Advanced recommendation engine
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Voice search capability
- [ ] Barcode scanning for authenticity

---

**SoleHub** - Step into the future of shoe shopping! 👟✨
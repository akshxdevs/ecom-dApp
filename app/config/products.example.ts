/**
 * Example Configuration File for Products
 * 
 * This file shows you how to configure seller public keys for your dApp.
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to `app/config/products.ts`
 * 2. Replace the example seller public keys with your actual seller public keys
 * 3. Import this configuration in your Products.tsx component
 * 
 * HOW TO GET YOUR SELLER PUBLIC KEYS:
 * 1. Run `anchor test` in your terminal
 * 2. Look for console output showing seller public keys
 * 3. Copy those public keys and paste them below
 */

export const SELLER_PUBKEYS = [
  // Example seller public keys (replace with your actual keys)
  "11111111111111111111111111111111", // Example key 1
  "22222222222222222222222222222222", // Example key 2
  // Add more seller public keys here
];

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  // Devnet for testing
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    programId: "FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7",
  },
  
  // Mainnet for production (update when ready)
  mainnet: {
    rpcUrl: "https://api.mainnet-beta.solana.com",
    programId: "FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7",
  },
  
  // Localhost for local development
  localhost: {
    rpcUrl: "http://127.0.0.1:8899",
    programId: "FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7",
  },
};

/**
 * Product Categories Configuration
 */
export const PRODUCT_CATEGORIES = [
  { value: "Electronics", label: "Electronics" },
  { value: "BeautyAndPersonalCare", label: "Beauty & Personal Care" },
  { value: "SnacksAndDrinks", label: "Snacks & Drinks" },
  { value: "HouseholdEssentials", label: "Household Essentials" },
  { value: "GroceryAndKitchen", label: "Grocery & Kitchen" },
];

/**
 * Product Divisions Configuration
 */
export const PRODUCT_DIVISIONS = [
  { value: "Mobile", label: "Mobile" },
  { value: "Laptop", label: "Laptop" },
  { value: "Headphone", label: "Headphone" },
  { value: "SmartWatch", label: "Smart Watch" },
  { value: "ComputerPeripherals", label: "Computer Peripherals" },
];

/**
 * Default Product Configuration
 */
export const DEFAULT_PRODUCT_CONFIG = {
  category: "Electronics",
  division: "Mobile",
  quantity: 1,
  rating: 0.0,
  stockStatus: "InStock",
};

/**
 * Example Product Data (for testing/development)
 */
export const EXAMPLE_PRODUCTS = [
  {
    productName: "iPhone 17 Pro",
    productShortDescription: "Premium flagship smartphone with advanced features",
    price: 0.5, // SOL
    category: "Electronics",
    division: "Mobile",
    sellerName: "Apple",
    productImgurl: "https://example.com/iphone.jpg",
  },
  {
    productName: "MacBook Pro",
    productShortDescription: "High-performance laptop for professionals",
    price: 1.0, // SOL
    category: "Electronics",
    division: "Laptop",
    sellerName: "Apple",
    productImgurl: "https://example.com/macbook.jpg",
  },
  {
    productName: "Apple Watch SE",
    productShortDescription: "Smartwatch for health tracking and notifications",
    price: 0.25, // SOL
    category: "Electronics",
    division: "SmartWatch",
    sellerName: "Apple",
    productImgurl: "https://example.com/watch.jpg",
  },
];


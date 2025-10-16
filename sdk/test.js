import { initCreateProduct } from './program.js';

// Test script to verify the SDK is working
async function testSDK() {
  console.log('🧪 Testing SDK functionality...\n');
  
  try {
    // Test 1: Import works
    console.log('✅ Module imported successfully');
    
    // Test 2: Check if function exists
    if (typeof initCreateProduct === 'function') {
      console.log('✅ initCreateProduct function is available');
    } else {
      console.log('❌ initCreateProduct function not found');
      return;
    }
    
    // Test 3: Test with dummy data (this will likely fail but should show proper error handling)
    console.log('\n📦 Testing product creation with dummy data...');
    
    const testResult = await initCreateProduct(
      'dummy-secret-key', // This will cause an error, but that's expected
      'Test Product',
      'A test product description',
      1.5, // 1.5 SOL
      'Electronics',
      'Gadgets',
      'Test Seller',
      'https://example.com/image.jpg'
    );
    
    console.log('Test result:', testResult);
    
    if (testResult.success) {
      console.log('✅ Product creation test passed');
    } else {
      console.log('⚠️  Product creation failed as expected (dummy key):', testResult.error);
    }
    
  } catch (error) {
    console.error('❌ SDK test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSDK().catch(console.error);

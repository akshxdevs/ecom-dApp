import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import IDL from './ecom_dapp.json';

const ECOM_PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

const local = "http://127.0.0.1:8899";
const devnet = "https://api.devnet.solana.com";
const connection = new Connection(devnet);

// Simple wallet interface for compatibility
function createSimpleWallet(keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      tx.sign(keypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      return txs.map(tx => {
        tx.sign(keypair);
        return tx;
      });
    },
  };
}

function createProvider(wallet) {
    return new anchor.AnchorProvider(connection, wallet, {
        commitment:"processed"
    })
}
export async function initializeProgram() {
  try {
    console.log("Verifying program exists...");
    const programInfo = await connection.getAccountInfo(ECOM_PROGRAM_ID);
    if (programInfo) {
      console.log("Program found on devnet!");
      console.log(`Program is executable: ${programInfo.executable}`);
    } else {
      console.log("Program NOT found on devnet!");
      console.log(programInfo);
    }
  } catch (error) {
    console.log("⚠️  Could not verify program (network issue):", error.message);
    console.log("SDK will still work for local testing");
  }
}


export async function initCreateProduct(
  walletAdapter, 
  product_name, 
  product_short_description,
  price,
  category,
  division,
  seller_name,
  product_imgurl
) {
  try {
    if (!walletAdapter || !walletAdapter.publicKey) {
      throw new Error("Wallet not connected");
    }

    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    
    const ecomProgram = new anchor.Program(IDL, provider);

    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), walletAdapter.publicKey.toBuffer(), Buffer.from(product_name)],
      ECOM_PROGRAM_ID
    );
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );
    console.log("Creating product with PDA:", productPda.toString());
    console.log("Creating productList  with PDA:", productListPda.toString());

    const tx = await ecomProgram.methods.createProduct(
        product_name,
        product_short_description,
        price, // Pass price as-is (u32), not in lamports
        { [category]: {} }, 
        { [division]: {} }, 
        seller_name,
        product_imgurl
      )
      .accounts({
        product: productPda,
        productList:productListPda,
        seller: walletAdapter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Product created successfully! Transaction:", tx);
    console.log("Product PDA:", productPda.toString());
    console.log("Product List PDA:", productListPda.toString());

    
    return {
      success: true,
      transaction: tx,
      productPda: productPda.toString()
    };
  } catch (err) {
    console.error("Error creating product:", err.message);
    console.error("Stack:", err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

// Fetch a single product by PDA
export async function fetchProduct(productPdaString, walletAdapter) {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    const ecomProgram = new anchor.Program(IDL, provider);
    
    const productPda = new PublicKey(productPdaString);
    const productData = await ecomProgram.account.product.fetch(productPda);
    
    return {
      success: true,
      data: productData
    };
  } catch (error) {
    console.error("Error fetching product:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fetch all products from a seller's product list
export async function fetchAllProductsFromSeller(sellerPubkeyString, walletAdapter) {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    const ecomProgram = new anchor.Program(IDL, provider);
    
    const sellerPubkey = new PublicKey(sellerPubkeyString);
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), sellerPubkey.toBuffer()],
      ECOM_PROGRAM_ID
    );
    
    const productListData = await ecomProgram.account.productsList.fetch(productListPda);
    
    // Fetch each product
    const products = [];
    for (const productPubkey of productListData.products) {
      try {
        const productData = await ecomProgram.account.product.fetch(productPubkey);
        products.push({
          pubkey: productPubkey.toString(),
          ...productData
        });
      } catch (err) {
        console.error(`Error fetching product ${productPubkey.toString()}:`, err.message);
      }
    }
    
    return {
      success: true,
      products: products
    };
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}

// Fetch all products from multiple sellers (hardcoded sellers)
export async function fetchAllProducts(walletAdapter) {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    const ecomProgram = new anchor.Program(IDL, provider);
    
    // Hardcoded seller public keys from your test file
    // You can add more sellers here
    const sellers = [
      // Add your seller public keys here
      // Example: "YourSellerPublicKeyHere"
    ];
    
    let allProducts = [];
    
    for (const sellerPubkeyString of sellers) {
      try {
        const result = await fetchAllProductsFromSeller(sellerPubkeyString, walletAdapter);
        if (result.success && result.products) {
          allProducts = [...allProducts, ...result.products];
        }
      } catch (err) {
        console.error(`Error fetching products from seller ${sellerPubkeyString}:`, err.message);
      }
    }
    
    return {
      success: true,
      products: allProducts
    };
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}

// Helper function to convert product data to display format
export function formatProductData(productData) {
  return {
    productId: productData.productId,
    productName: productData.productName,
    productShortDescription: productData.productShortDescription,
    price: productData.price / 100, // Convert cents to dollars/SOL
    category: productData.category,
    division: productData.division,
    sellerName: productData.sellerName,
    sellerPubkey: productData.sellerPubkey.toString(),
    productImgurl: productData.productImgurl,
    quantity: productData.quantity,
    rating: productData.rating,
    stockStatus: productData.stockStatus
  };
}


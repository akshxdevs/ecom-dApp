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
export function getCategoryVariant(category) {
  switch (category) {
    case "Electronics":
      return { electronics: {} };
    case "BeautyAndPersonalCare":
      return { beautyAndPersonalCare: {} };
    case "SnacksAndDrinks":
      return { snacksAndDrinks: {} };
    case "HouseholdEssentials":
      return { householdEssentials: {} };
    case "GroceryAndKitchen":
      return { groceryAndKitchen: {} };
    default:
      throw new Error(`Invalid category: ${category}`);
  }
}

export function getDivisionVariant(division) {
  switch (division) {
    case "Mobile":
      return { mobile: {} };
    case "Laptop":
      return { laptop: {} };
    case "Headphone":
      return { headphone: {} };
    case "SmartWatch":
      return { smartWatch: {} };
    case "ComputerPeripherals":
      return { computerPeripherals: {} };
    default:
      throw new Error(`Invalid division: ${division}`);
  }
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
    console.log("Could not verify program (network issue):", error.message);
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

    try {
      const existingProduct = await ecomProgram.account.product.fetch(productPda);
      if (existingProduct) {
        throw new Error("Product with this name already exists");
      }
    } catch (err) {
      if (err.message.includes("Account does not exist")) {
        console.log("Product doesn't exist, proceeding with creation...");
      } else if (err.message.includes("Product with this name already exists")) {
        throw err; 
      } else {
        console.log("Error checking existing product:", err.message);
      }
    }

    const categoryVariant = getCategoryVariant(category);
    const divisionVariant = getDivisionVariant(division);
    
    await connection.getLatestBlockhash();
    
    const tx = await ecomProgram.methods.createProduct(
        product_name,
        product_short_description,
        new BN(Math.round(price * 100)), 
        categoryVariant,
        divisionVariant,
        seller_name,
        product_imgurl
      )
      .accounts({
        product: productPda,
        productList:productListPda,
        seller: walletAdapter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: "confirmed",
        commitment: "confirmed"
      });

    console.log("Product created successfully! Transaction:", tx);
    console.log("Product PDA:", productPda.toString());
    console.log("Product List PDA:", productListPda.toString());

    const productList = await ecomProgram.account.productsList.fetch(productListPda);
    console.log("Product Details: ",productList);
    
    
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
    
    console.log("Fetching products for seller:", sellerPubkeyString);
    console.log("ProductList PDA:", productListPda.toString());
    
    let productListData;
    try {
      productListData = await ecomProgram.account.productsList.fetch(productListPda);
      console.log("ProductList data:", productListData);
      console.log("Number of products in list:", productListData.products.length);
    } catch (err) {
      console.error("Error fetching ProductsList:", err);
      if (err.message.includes("Account does not exist")) {
        console.log(`No products found for seller ${sellerPubkeyString}`);
        return {
          success: true,
          products: []
        };
      }
      throw err;
    }
    
    // Fetch each product
    const products = [];
    console.log("Fetching individual products...");
    for (const productPubkey of productListData.products) {
      try {
        console.log("Fetching product:", productPubkey.toString());
        const productData = await ecomProgram.account.product.fetch(productPubkey);
        console.log("Product data:", productData);
        
        // Check if productData is valid
        if (!productData) {
          console.error("Product data is null/undefined for:", productPubkey.toString());
          continue;
        }
        
        const formattedProduct = {
          pubkey: productPubkey.toString(),
          ...formatProductData(productData)
        };
        console.log("Formatted product:", formattedProduct);
        products.push(formattedProduct);
      } catch (err) {
        console.error(`Error fetching product ${productPubkey.toString()}:`, err.message);
        console.error("Full error:", err);
      }
    }
    
    console.log("Total products fetched:", products.length);
    
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
    
    // Use the current wallet's public key as a seller
    const sellers = [
      walletAdapter.publicKey.toString()
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
  console.log("Raw product data:", productData);
  
  return {
    productId: productData.product_id || [],
    productName: productData.product_name || "",
    productShortDescription: productData.product_short_description || "",
    price: (productData.price || 0) / 100, // Convert cents to dollars/SOL
    category: productData.category || {},
    division: productData.division || {},
    sellerName: productData.seller_name || "",
    sellerPubkey: productData.seller_pubkey ? productData.seller_pubkey.toString() : "",
    productImgurl: productData.product_imgurl || "",
    quantity: productData.quantity || 0,
    rating: productData.rating || 0,
    stockStatus: productData.stock_status || {}
  };
}


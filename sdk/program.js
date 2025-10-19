import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import IDL from './ecom_dapp.json';

const ECOM_PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

const local = "http://127.0.0.1:8899";
const devnet = "https://api.devnet.solana.com";
const connection = new Connection(devnet);



function createProvider(wallet) {
    return new anchor.AnchorProvider(connection, wallet, {
        commitment:"processed"
    })
}
export function getCategoryVariant(category) {
  if (!category || category.trim() === "") {
    category = "Electronics"; 
  }
  
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
  if (!division || division.trim() === "") {
    division = "Mobile"; 
  }
  
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

 
    let productPda;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts <= maxAttempts) {
      try {
        productPda = PublicKey.findProgramAddressSync(
          [Buffer.from("product"), walletAdapter.publicKey.toBuffer(), Buffer.from(product_name)],
          ECOM_PROGRAM_ID
        )[0];
      } catch (err) {
          throw err;
      }
      
      try {
        const existingProduct = await ecomProgram.account.product.fetch(productPda);
        if (existingProduct) {
        } else {
          break; 
        }
      } catch (err) {
        if (err.message.includes("Account does not exist")) {
          break; 
        } else {
          throw err;
        }
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Unable to generate unique product name after multiple attempts");
    }
    
    console.log(`Using product name: ${product_name}`);
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

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
    console.log("Category: ",category);
    console.log("Category Varient: ",categoryVariant);
    
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
    
    const products = [];
    const productListData = await ecomProgram.account.productsList.fetch(productListPda);
    console.log("Fetching individual products...");
    for (const productPubkey of productListData.products) {
      try {
        console.log("Fetching product:", productPubkey.toString());
        const productData = await ecomProgram.account.product.fetch(productPubkey);
        console.log("Product data:", productData);
        
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

export async function fetchAllProducts(walletAdapter) {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    
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
    productId: productData.productId || [],
    productName: productData.productName || "",
    productShortDescription: productData.productShortDescription || "",
    price: (productData.price || 0), 
    category: productData.category || {},
    division: productData.division || {},
    sellerName: productData.sellerName || "",
    sellerPubkey: productData.sellerPubkey ? productData.sellerPubkey.toString() : "",
    productImgurl: productData.productImgurl || "",
    quantity: productData.quantity || 0,
    rating: productData.rating || 0,
    stockStatus: productData.stockStatus || {}
  };
}


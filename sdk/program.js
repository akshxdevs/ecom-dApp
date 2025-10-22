import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import IDL from "./ecom_dapp.json";
import { 
  createMint, 
  mintTo, 
  TOKEN_PROGRAM_ID,           
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";

const ECOM_PROGRAM_ID = new PublicKey(
  "FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7"
);

const local = "http://127.0.0.1:8899";
const devnet = "https://api.devnet.solana.com";
const connection = new Connection(devnet);

function createProvider(wallet) {
  return new anchor.AnchorProvider(connection, wallet, {
    commitment: "processed",
  });
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
          [
            Buffer.from("product"),
            walletAdapter.publicKey.toBuffer(),
            Buffer.from(product_name),
          ],
          ECOM_PROGRAM_ID
        )[0];
      } catch (err) {
        throw err;
      }

      try {
        const existingProduct = await ecomProgram.account.product.fetch(
          productPda
        );
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
      throw new Error(
        "Unable to generate unique product name after multiple attempts"
      );
    }

    console.log(`Using product name: ${product_name}`);
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

    const categoryVariant = getCategoryVariant(category);
    const divisionVariant = getDivisionVariant(division);
    console.log("Category: ", category);
    console.log("Category Varient: ", categoryVariant);

    await connection.getLatestBlockhash();

    const tx = await ecomProgram.methods
      .createProduct(
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
        productList: productListPda,
        seller: walletAdapter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: "confirmed",
        commitment: "confirmed",
      });

    console.log("Product created successfully! Transaction:", tx);
    console.log("Product PDA:", productPda.toString());
    console.log("Product List PDA:", productListPda.toString());

    const productList = await ecomProgram.account.productsList.fetch(
      productListPda
    );
    console.log("Product Details: ", productList);

    return {
      success: true,
      transaction: tx,
      productPda: productPda.toString(),
    };
  } catch (err) {
    console.error("Error creating product:", err.message);
    console.error("Stack:", err.stack);
    return {
      success: false,
      error: err.message,
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
      data: productData,
    };
  } catch (error) {
    console.error("Error fetching product:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function fetchAllProductsFromSeller(
  sellerPubkeyString,
  walletAdapter
) {
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
    const productListData = await ecomProgram.account.productsList.fetch(
      productListPda
    );
    console.log("Fetching individual products...");
    for (const productPubkey of productListData.products) {
      try {
        console.log("Fetching product:", productPubkey.toString());
        const productData = await ecomProgram.account.product.fetch(
          productPubkey
        );
        console.log("Product data:", productData);

        if (!productData) {
          console.error(
            "Product data is null/undefined for:",
            productPubkey.toString()
          );
          continue;
        }

        const formattedProduct = {
          pubkey: productPubkey.toString(),
          ...formatProductData(productData),
        };
        console.log("Formatted product:", formattedProduct);
        products.push(formattedProduct);
      } catch (err) {
        console.error(
          `Error fetching product ${productPubkey.toString()}:`,
          err.message
        );
        console.error("Full error:", err);
      }
    }

    console.log("Total products fetched:", products.length);

    return {
      success: true,
      products: products,
    };
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return {
      success: false,
      error: error.message,
      products: [],
    };
  }
}

export async function fetchAllProducts(walletAdapter) {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);

    const sellers = [walletAdapter.publicKey.toString()];

    let allProducts = [];

    for (const sellerPubkeyString of sellers) {
      try {
        const result = await fetchAllProductsFromSeller(
          sellerPubkeyString,
          walletAdapter
        );
        if (result.success && result.products) {
          allProducts = [...allProducts, ...result.products];
        }
      } catch (err) {
        console.error(
          `Error fetching products from seller ${sellerPubkeyString}:`,
          err.message
        );
      }
    }

    return {
      success: true,
      products: allProducts,
    };
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    return {
      success: false,
      error: error.message,
      products: [],
    };
  }
}

export function formatProductData(productData) {
  console.log("Raw product data:", productData);
  const normalizePublicKey = (input) => {
    try {
      if (!input) return "";
      if (typeof input === "string") {
        const trimmed = input.trim();
        return new PublicKey(trimmed).toBase58();
      }
      return new PublicKey(input).toBase58();
    } catch (e) {
      console.warn("Failed to normalize public key:", input);
      return "";
    }
  };

  return {
    productId: productData.productId || [],
    productName: productData.productName || "",
    productShortDescription: productData.productShortDescription || "",
    price: productData.price || 0,
    category: productData.category || {},
    division: productData.division || {},
    sellerName: productData.sellerName || "",
    sellerPubkey: normalizePublicKey(productData.sellerPubkey),
    productImgurl: productData.productImgurl || "",
    quantity: productData.quantity || 0,
    rating: productData.rating || 0,
    stockStatus: productData.stockStatus || false,
  };
}

export async function AddToCart(
  walletAdapter,
  sellerPubkeyString,
  product_name,
  quantity,
  price,
  product_imgurl
) {
  try {
    if (!walletAdapter || !walletAdapter.publicKey) {
      throw new Error("Wallet Not Connected..");
    }

    if (!sellerPubkeyString) {
      throw new Error("Seller public key is required");
    }
    if (!product_name) {
      throw new Error("Product name is required");
    }
    if (!quantity || quantity <= 0) {
      throw new Error("Valid quantity is required");
    }
    if (!price || price <= 0) {
      throw new Error("Valid price is required");
    }
    if (!product_imgurl) {
      throw new Error("Product image URL is required");
    }

    console.log("AddToCart parameters:", {
      sellerPubkeyString,
      product_name,
      quantity,
      price,
      product_imgurl,
    });

    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    const ecomProgram = new anchor.Program(IDL, provider);

    // Validate seller public key before creating PublicKey
    if (
      typeof sellerPubkeyString !== "string" ||
      sellerPubkeyString.length === 0
    ) {
      throw new Error(`Invalid seller public key: ${sellerPubkeyString}`);
    }

    let seller_pubkey;
    try {
      seller_pubkey = new PublicKey(sellerPubkeyString);
    } catch (e) {
      throw new Error(`Invalid seller public key: ${sellerPubkeyString}`);
    }

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller_pubkey.toBuffer(),
        Buffer.from(product_name),
      ],
      ECOM_PROGRAM_ID
    );

    const [cartPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cart"),
        walletAdapter.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      ECOM_PROGRAM_ID
    );

    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

    const tx = await ecomProgram.methods
      .addToCart(product_name, quantity, seller_pubkey, product_imgurl, price)
      .accounts({
        consumer: walletAdapter.publicKey,
        cart: cartPda,
        products: productPda,
        cart_list: cartListPda,
        system_program: SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: "confirmed",
        commitment: "confirmed",
      });

    const cart = await ecomProgram.account.cart.fetch(cartPda);
    console.log("Cart Details: ", cart);

    const cartList = await ecomProgram.account.cartList.fetch(cartListPda);
    console.log("CartList Details: ", cartList);

    return {
      success: true,
      transaction: tx,
      cartPda: cartPda.toString(),
      cartListPda: cartListPda.toString(),
    };
  } catch (err) {
    console.error("Error Adding Product To Cart..", err.message);
    console.error("Stack: ", err.stack);
    return {
      success: false,
      error: err.message,
    };
  }
}

export const fetchCart = async (cartPdaString, walletAdapter) => {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);
    const ecomProgram = new anchor.Program(IDL, provider);

    const cartPda = new PublicKey(cartPdaString);
    const cartData = await ecomProgram.account.cart.fetch(cartPda);

    return {
      success: true,
      data: cartData,
    };
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const fetchCartList = async (walletAdapter) => {
  try {
    const provider = createProvider(walletAdapter);
    anchor.setProvider(provider);

    const ecomProgram = new anchor.Program(IDL, provider);
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

    const cartList = await ecomProgram.account.cartList.fetch(cartListPda);

    return {
      success: true,
      cart: cartList,
    };
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    return {
      success: false,
      error: error.message,
      cart: [],
    };
  }
};

export const initCreatePayment = async (walletAdapter, totalAmount) => {
  const provider = createProvider(walletAdapter);
  anchor.setProvider(provider);

  const ecomProgram = new anchor.Program(IDL, provider);

  try {
    const [paymentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), walletAdapter.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

    // Check if payment account already exists
    try {
      const existingAccount = await provider.connection.getAccountInfo(paymentPda);
      if (existingAccount) {
        console.log("Payment account already exists, skipping creation");
        return {
          success: true,
          transaction: "Account already exists",
          payment: paymentPda.toString(),
        };
      }
    } catch (checkError) {
      // Account doesn't exist, proceed with creation
    }

    const tx = await ecomProgram.methods
      .createPayment(
        new BN(totalAmount), 
        paymentPda, 
        null
      ).accounts({
        signer: walletAdapter.publicKey,
        payment: paymentPda,
        system_program: SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: "confirmed",
        commitment: "confirmed",
      });
    return {
      success: true,
      transaction: tx,
      payment: paymentPda.toString(),
    };
  } catch (error) {
    console.error("Something went wrong...", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const initCreateEscrow = async (walletAdapter, sellerPubkey, totalAmount) => {
  // Validate wallet adapter and required parameters
  console.log("initCreateEscrow called with:", {
    walletAdapter,
    walletAdapterType: typeof walletAdapter,
    hasPublicKey: !!walletAdapter?.publicKey,
    sellerPubkey,
    totalAmount
  });
  
  if (!walletAdapter || !walletAdapter.publicKey) {
    throw new Error("Wallet not connected or invalid wallet adapter");
  }
  
  if (!sellerPubkey) {
    throw new Error("Seller pubkey is required");
  }
  
  if (!totalAmount || totalAmount <= 0) {
    throw new Error("Valid total amount is required");
  }

  const provider = createProvider(walletAdapter);
  anchor.setProvider(provider);

  const ecomProgram = new anchor.Program(IDL, provider);
  const owner = walletAdapter.publicKey; // Use actual wallet public key
  const buyer = walletAdapter.publicKey;
  const seller = new PublicKey(sellerPubkey); // Convert sellerPubkey to PublicKey
  
  console.log("Buyer Pubkey: ",walletAdapter.publicKey);
  console.log("Seller Pubkey: ",sellerPubkey);
  console.log("Total Amount: ",totalAmount);
  
  try {
    // Create a proper wallet object for SPL token functions
    const wallet = {
      publicKey: walletAdapter.publicKey,
      signTransaction: walletAdapter.signTransaction,
      signAllTransactions: walletAdapter.signAllTransactions,
    };
    
    console.log("About to create mint with:", {
      connection: provider.connection,
      wallet,
      owner,
      ownerType: typeof owner,
      ownerString: owner?.toString(),
      walletKeys: Object.keys(wallet || {}),
      walletPublicKey: wallet?.publicKey?.toString()
    });
    
    let mint;
    try {
      mint = await createMint(
        provider.connection,
        wallet, // Use proper wallet object
        owner,
        null,
        6
      );
      console.log("Mint created successfully:", mint.toString());
    } catch (mintError) {
      console.error("Mint creation failed:", mintError);
      throw new Error(`Mint creation failed: ${mintError.message}`);
    }

    // Fix: Use owner instead of buyer for PDA seeds (as per IDL and Rust code)
    console.log("Creating PDAs with owner:", owner.toString());
    let escrowPda, paymentPda;
    try {
      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), owner.toBuffer()],
        ECOM_PROGRAM_ID
      );
      console.log("Escrow PDA:", escrowPda.toString());

      [paymentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), owner.toBuffer()],
        ECOM_PROGRAM_ID
      );
      console.log("Payment PDA:", paymentPda.toString());
    } catch (pdaError) {
      console.error("PDA creation failed:", pdaError);
      throw new Error(`PDA creation failed: ${pdaError.message}`);
    }

    if (!walletAdapter || !sellerPubkey) throw new Error("Required pubkeys missing");

    let escrowAta, buyerAta, sellerAta, userAta;
    
    try {
      console.log("Creating escrow ATA...");
      escrowAta = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          wallet,
          mint,
          escrowPda,
          true
        )
      ).address;
      console.log("Escrow ATA:", escrowAta.toString());

      console.log("Creating buyer ATA...");
      buyerAta = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          wallet,
          mint,
          buyer
        )
      ).address;
      console.log("Buyer ATA:", buyerAta.toString());

      console.log("Creating seller ATA...");
      sellerAta = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          wallet,
          mint,
          seller
        )
      ).address;
      console.log("Seller ATA:", sellerAta.toString());

      console.log("Creating user ATA...");
      userAta = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          wallet,
          mint,
          owner
        )
      ).address;
      console.log("User ATA:", userAta.toString());
    } catch (ataError) {
      console.error("Token account creation failed:", ataError);
      throw new Error(`Token account creation failed: ${ataError.message}`);
    }

    try {
      console.log("Minting tokens...");
      await mintTo(
        provider.connection,
        wallet,
        mint,
        userAta,
        wallet,
        100_000_000_000
      );
      console.log("Tokens minted successfully");
    } catch (mintToError) {
      console.error("Minting tokens failed:", mintToError);
      throw new Error(`Minting tokens failed: ${mintToError.message}`);
    }

    // First create a payment account (required for escrow creation)
    let paymentResult;
    try {
      console.log("Creating payment account...");
      paymentResult = await initCreatePayment(walletAdapter, totalAmount);
      
      if (!paymentResult.success) {
        throw new Error(`Payment creation failed: ${paymentResult.error}`);
      }
      
      console.log("Payment Result:", paymentResult);
    } catch (paymentError) {
      console.error("Payment creation failed:", paymentError);
      throw new Error(`Payment creation failed: ${paymentError.message}`);
    }

    // Then create the escrow
    let tx;
    try {
      console.log("Creating escrow...");
      console.log("Escrow accounts:", {
        owner: owner.toString(),
        escrow: escrowPda.toString(),
        payment: paymentPda.toString(),
        userAta: userAta.toString(),
        escrowAta: escrowAta.toString(),
        buyerAta: buyerAta.toString(),
        sellerAta: sellerAta.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        systemProgram: SystemProgram.programId.toString(),
      });
      
      tx = await ecomProgram.methods
        .createEscrow(buyer, seller, new anchor.BN(totalAmount))
        .accounts({
          owner,
          escrow: escrowPda,
          payment: paymentPda,
          userAta,
          escrowAta,
          buyerAta,
          sellerAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          skipPreflight: false,
          preflightCommitment: "confirmed",
          commitment: "confirmed",
        });
    } catch (escrowError) {
      console.error("Escrow transaction failed:", escrowError);
      throw new Error(`Escrow transaction failed: ${escrowError.message}`);
    }

    console.log("Escrow Transaction Signature:", tx);
    console.log("--- CREATED ESCROW ---");
    return {
      success:true,
      data:escrowPda,
    }
  } catch (error) {
    console.error("Escrow creation failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const initDepositeEscrow = (walletAdapter) => {
  const provider = createProvider(walletAdapter);
  anchor.setProvider(provider);

  const ecomProgram = new anchor.Program(IDL,provider);
}
export const initWithdrawEscrow = (walletAdapter) => {
  const provider = createProvider(walletAdapter);
  anchor.setProvider(provider);

  const ecomProgram = new anchor.Program(IDL,provider);
}
export const fetchConfirmPayment = (walletAdapter) => {
  const provider = createProvider(walletAdapter);
  anchor.setProvider(provider);

  const ecomProgram = new anchor.Program(IDL,provider);  
}
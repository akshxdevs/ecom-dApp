import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcomDapp } from "../target/types/ecom_dapp";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { expect } from "chai";



describe("anchor", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EcomDapp as Program<EcomDapp>;
  const signer = provider.wallet.publicKey;

  let seller = Keypair.generate();
  let consumer = Keypair.generate();
  
  let product_id:any;
  let product_name: string;
  let product_short_description: string;
  let price: number;
  let category: any;
  let division: any;
  let seller_name: string;
  let product_imgurl: string;

  function bytesToUuid(bytes: number[]): string {
    if (bytes.length !== 16) throw new Error("Invalid UUID length");

    const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }


  it("should initialize and create product!", async () => {
    await provider.connection.requestAirdrop(
      seller.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    product_name = "IPhone 17 Pro";
    product_short_description = "The iPhone 17 Pro, launched September 2025, is a premium flagship with a 6.3-inch ProMotion display, A19 Pro chip, and advanced triple-camera system.";
    price = 799;
    category = { electronics: {} };
    division = { mobile: {} };
    seller_name = "Apple";
    product_imgurl = "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-cosmicorange?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0RUlmWnJkM2NiV2hVVVF2ZE1VdGpQZWhsQTdPYWVGbmdIenAvNE9qYmZVYVFDb1F2RTNvUEVHRkpGaGtOSVFHak5NTEhXRE11VU1QNVo2eDJsWlpuWHRlLys5ZkozSXJXZWZXNk8rZDF5S0V3&traceId=1";

    // Calculate PDAs
    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const [productListPda, productListBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.methods
      .createProduct(
        product_name,
        product_short_description,
        price,
        category,
        division,
        seller_name,
        product_imgurl
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();

    console.log("Your transaction signature", tx);

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);

    const getSellerBalance = await provider.connection.getBalance(
      seller.publicKey
    );
    const seller_balance = getSellerBalance / 1e9;
    console.log("Seller Balance: ", seller_balance + "SOL");

    product_id = bytesToUuid(product.productId);
    console.log("Product Id:", product_id);
  });
  it("creating another product!", async () => {
    product_name = "MacBook Pro";
    product_short_description = "Powerful, sleek, high-performance laptop with stunning display and long battery.";
    price = 1599;
    category = { electronics: {} };
    division = { laptop: {} };
    seller_name = "Apple";
    product_imgurl = "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRTYbESY_XvQ5bcb8ukHm5q0LCmvzK9AaK5DyMGbcFqIovxJvYCCkG-5AQU5IqaBI_EIXeqDuY9nGJ7Q8P9P_f_7ZBkuu3l01ucR-iNkEa5OKrHs5L8kF53";

    // Calculate PDAs
    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const [productListPda, productListBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.methods
      .createProduct(
        product_name,
        product_short_description,
        price,
        category,
        division,
        seller_name,
        product_imgurl
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();

    console.log("Your transaction signature", tx);

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);

    product_id = bytesToUuid(product.productId);
    console.log("Product Id:", product_id);
  });
  it("should display all the created products", async () => {
    product_name = "Apple Watch SE";
    product_short_description =
      "The Apple Watch is Apple's premium smartwatch lineup, designed for health tracking, fitness, connectivity, and safety.";
    price = 249;
    category = { electronics: {} };
    division = { smartWatch: {} };
    seller_name = "Apple";
    product_imgurl = "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSfoMHgS1tRqOz2hmUMFLJ4z6RqDlr5QqKlJ9_IOuUBMlcASEw1778AlhSNluH43nlADPMe20U7ZkmDoEsx_7w8d0r_6cJjvHKTQtPPR-1r5CrMhqfeDGib7L8";

    // Calculate PDAs
    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const [productListPda, productListBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.methods
      .createProduct(
        product_name,
        product_short_description,
        price,
        category,
        division,
        seller_name,
        product_imgurl
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();

    console.log("Your transaction signature", tx); 

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);

    const productList = await program.account.productsList.fetch(
      productListPda
    );
    console.log("Product List: ", productList);

    product_id = bytesToUuid(product.productId);
    console.log("Product Id:", product_id);
  });

  it("should add product to cart",async()=>{
    await provider.connection.requestAirdrop(
      consumer.publicKey,
      2* anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((res)=> setTimeout(res,1000));
    console.log(product_name);

    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"),consumer.publicKey.toBuffer(),],
      program.programId
    );

    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );

    const tx = await program.methods
      .addToCart(
        product_name,        
        1,                   
        seller.publicKey,    
        product_imgurl,      
        price                
      )
      .accounts({
        consumer: consumer.publicKey,
        cart: cartPda,
        products:productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([consumer])
      .rpc();

    console.log("Your transaction signature", tx);
    const cart = await program.account.cart.fetch(cartPda);
    console.log("Product Added to Cart: ",cart);
    const cartProductId = bytesToUuid(cart.productId); 
    console.log("Cart Product Id: ",cartProductId);

  });

  it("should added product to cart",async()=>{
    console.log(product_name);
    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"),consumer.publicKey.toBuffer(),],
      program.programId
    );

    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const tx = await program.methods
      .addToCart(
        product_name,        
        1,                   
        seller.publicKey,    
        product_imgurl,      
        price                
      )
      .accounts({
        consumer: consumer.publicKey,
        cart: cartPda,
        products:productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([consumer])
      .rpc();

    console.log("Your transaction signature", tx);
    const cart = await program.account.cart.fetch(cartPda);
    console.log("Product Added to Cart: ",cart);
    const cartProductId = bytesToUuid(cart.productId); 
    console.log("Cart Product Id: ",cartProductId);
    
  });

  it("should display cart count and fetch individual cart items",async()=>{
    console.log("Displaying cart information...");
    
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"),consumer.publicKey.toBuffer(),],
      program.programId
    );

    const cartList = await program.account.cartList.fetch(cartListPda);
    console.log("CartList: ",cartList.cartList);
  });

  // it("should create a escrow",async()=>{

  // });

  // it("should transfer funds perform payment",async()=>{

  // });

  // it("should book the order",async()=>{

  // });
});

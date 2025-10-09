import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcomDapp } from "../target/types/ecom_dapp";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("anchor", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EcomDapp as Program<EcomDapp>;
  const signer = provider.wallet.publicKey;

  let seller = Keypair.generate();

  it("should initialize and create product!", async () => {
    await provider.connection.requestAirdrop(
      seller.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const product_name = "IPhone 17 Pro";
    const product_short_description = "The iPhone 17 Pro, launched September 2025, is a premium flagship with a 6.3-inch ProMotion display, A19 Pro chip, and advanced triple-camera system.";
    const price = 799;
    const category = { electronics: {} };
    const division = { mobile: {} };
    const seller_name = "Apple";
    const product_imgurl = "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-cosmicorange?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0RUlmWnJkM2NiV2hVVVF2ZE1VdGpQZWhsQTdPYWVGbmdIenAvNE9qYmZVYVFDb1F2RTNvUEVHRkpGaGtOSVFHak5NTEhXRE11VU1QNVo2eDJsWlpuWHRlLys5ZkozSXJXZWZXNk8rZDF5S0V3&traceId=1";

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
      })
      .signers([seller])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);
    console.log("Your transaction signature", tx);

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
    console.log("Product Id:", bytesToUuid(product.productId));
    const getSellerBalance = await provider.connection.getBalance(
      seller.publicKey
    );
    const seller_balance = getSellerBalance / 1e9;
    console.log("Seller Balance: ", seller_balance + "SOL");
  });
  it("creating another product!", async () => {
    const product_name = "MacBook Pro";
    const product_short_description = "Powerful, sleek, high-performance laptop with stunning display and long battery.";
    const price = 1599;
    const category = { electronics: {} };
    const division = { laptop: {} };
    const seller_name = "Apple";
    const product_imgurl = "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRTYbESY_XvQ5bcb8ukHm5q0LCmvzK9AaK5DyMGbcFqIovxJvYCCkG-5AQU5IqaBI_EIXeqDuY9nGJ7Q8P9P_f_7ZBkuu3l01ucR-iNkEa5OKrHs5L8kF53";

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
      })
      .signers([seller])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);
    console.log("Your transaction signature", tx);

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
    console.log("Product Id:", bytesToUuid(product.productId));
  });
  it("should display all the created products", async () => {
    const product_name = "Apple Watch SE";
    const product_short_description =
      "The Apple Watch is Apple's premium smartwatch lineup, designed for health tracking, fitness, connectivity, and safety.";
    const price = 249;
    const category = { electronics: {} };
    const division = { smartWatch: {} };
    const seller_name = "Apple";
    const product_imgurl =
      "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSfoMHgS1tRqOz2hmUMFLJ4z6RqDlr5QqKlJ9_IOuUBMlcASEw1778AlhSNluH43nlADPMe20U7ZkmDoEsx_7w8d0r_6cJjvHKTQtPPR-1r5CrMhqfeDGib7L8";

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
      })
      .signers([seller])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);
    console.log("Your transaction signature", tx);

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
    console.log("Product Id:", bytesToUuid(product.productId));
    const getSellerBalance = await provider.connection.getBalance(
      seller.publicKey
    );
    const seller_balance = getSellerBalance / 1e9;
    console.log("Seller Balance: ", seller_balance + "SOL");

    const productList = await program.account.productsList.fetch(
      productListPda
    );
    console.log("Product List: ", productList);
  });
});

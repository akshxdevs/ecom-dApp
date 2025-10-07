import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcomDapp } from "../target/types/ecom_dapp";
import { Keypair, PublicKey } from "@solana/web3.js";

describe("anchor", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EcomDapp as Program<EcomDapp>;
  const signer = provider.wallet.publicKey;

  let seller = Keypair.generate();
  
  it("should initialize and create product!", async () => {
    // Airdrop SOL to seller
    await provider.connection.requestAirdrop(seller.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for airdrop

    const product_name = "IPhone 17 Pro";
    const product_short_description =
      "The iPhone 17 Pro, launched September 2025, is a premium flagship with a 6.3-inch ProMotion display, A19 Pro chip, and advanced triple-camera system.";
    const price = 799;
    const category = { electronics: {} };
    const division = { mobile: {} };
    const seller_name = "Apple";
    const product_imgurl =
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-cosmicorange?wid=5120&hei=2880&fmt=webp&qlt=90&.v=NUNzdzNKR0FJbmhKWm5YamRHb05tUzkyK3hWak1ybHhtWDkwUXVINFc0RUlmWnJkM2NiV2hVVVF2ZE1VdGpQZWhsQTdPYWVGbmdIenAvNE9qYmZVYVFDb1F2RTNvUEVHRkpGaGtOSVFHak5NTEhXRE11VU1QNVo2eDJsWlpuWHRlLys5ZkozSXJXZWZXNk8rZDF5S0V3&traceId=1";
    
    // Calculate PDAs
    const [productPda, productBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), seller.publicKey.toBuffer(), Buffer.from(product_name)],
      program.programId
    );
    
    // Product list not needed for now
    // const [productListPda, productListBump] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("product_list")],
    //   program.programId
    // );

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
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([seller])
      .rpc();
      
    const product = await program.account.product.fetch(productPda);
    console.log("Added Product Details: ", product);
    console.log("Your transaction signature", tx);
  });
});

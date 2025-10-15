import * as anchor from "@coral-xyz/anchor";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import {
    PublicKey,
    clusterApiUrl,
    Transaction,
    Connection,
    SystemProgram,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { readFileSync } from 'fs';  
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ECOM_PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

// For now, we'll create a basic IDL structure
// You should replace this with your actual IDL from anchor/target/idl/ecom_dapp.json
const IDL: any = {
  "version": "0.1.0",
  "name": "ecom_dapp",
  "instructions": [
    {
      "name": "createProduct",
      "accounts": [
        {
          "name": "product",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productName",
          "type": "string"
        },
        {
          "name": "productShortDescription",
          "type": "string"
        },
        {
          "name": "productImgurl",
          "type": "string"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "division",
          "type": "string"
        },
        {
          "name": "sellerName",
          "type": "string"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [],
  "types": []
};
const local = "http://127.0.0.1:8899";
const connection = new Connection(local, "confirmed");


function createProvider(wallet:any) {
    return new anchor.AnchorProvider(connection,wallet,{
        commitment:"processed"
    })
}

async function verifyProgram() {
  console.log("Verifying program exists...");
  const programInfo = await connection.getAccountInfo(ECOM_PROGRAM_ID);
  if (programInfo) {
    console.log("Program found on localnet!");
    console.log(`Program is executable: ${programInfo.executable}`);
  } else {
    console.log("Program NOT found on localnet!");
    console.log(programInfo);
  }
}

async function initCreateProduct(
  secretKeyStr: Uint8Array,
  product_name: string, 
  product_short_description: string,
  price: number,
  category: string,
  division: string,
  seller_name: string,
  product_imgurl: string
) {
  try {
    // Create wallet from secret key
    const keypair = anchor.web3.Keypair.fromSecretKey(secretKeyStr);
    const wallet = new anchor.Wallet(keypair);
    
    // Create provider
    const provider = createProvider(wallet);
    anchor.setProvider(provider);
    
    // Create program instance
    const ecomProgram = new anchor.Program(IDL, provider);

    // Generate PDA for product
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), wallet.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );

    console.log("Creating product with PDA:", productPda.toString());

    // Call the createProduct instruction
    const tx = await (ecomProgram.methods as any)
      .createProduct(
        product_name,
        product_short_description,
        product_imgurl,
        category,
        division,
        seller_name,
        new anchor.BN(price * LAMPORTS_PER_SOL)
      )
      .accounts({
        product: productPda,
        seller: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Product created successfully! Transaction:", tx);
    console.log("Product PDA:", productPda.toString());
    
    return {
      success: true,
      transaction: tx,
      productPda: productPda.toString()
    };
    
  } catch (err: any) {
    console.error("Error creating product:", err.message);
    console.error("Stack:", err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}
// Run verification if this file is executed directly
if (require.main === module) {
  verifyProgram().catch(console.error);
}

export { createProvider, verifyProgram, initCreateProduct, ECOM_PROGRAM_ID, connection };

import * as anchor from "@coral-xyz/anchor";
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
import { readFileSync } from 'fs';  
import { fileURLToPath } from 'url';
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDL = JSON.parse(
  readFileSync(path.join(__dirname,'./ecom_dapp.json'),'utf8')
);
const ECOM_PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

const local = "http://127.0.0.1:8899";
const devnet = "https://api.devnet.solana.com";
const connection = new Connection(devnet);

function createProvider(wallet) {
    return new anchor.AnchorProvider(connection,wallet,{
        commitment:"processed"
    })
}
// Initialize and verify program on module load
async function initializeProgram() {
  console.log("Verifying program exists...");
  const programInfo = await connection.getAccountInfo(ECOM_PROGRAM_ID);
  if (programInfo) {
    console.log("Program found on devnet!");
    console.log(`Program is executable: ${programInfo.executable}`);
  } else {
    console.log("Program NOT found on devnet!");
    console.log(programInfo);
  }
}

// Run initialization
initializeProgram().catch(console.error);

export async function initCreateProduct(
  secretKeyStr,
  product_name, 
  product_short_description,
  price,
  category,
  division,
  seller_name,
  product_imgurl
) {
  try {
    const wallet = new anchor.Wallet(secretKeyStr);
    
    const provider = createProvider(wallet);
    anchor.setProvider(provider);
    
    const ecomProgram = new anchor.Program(IDL, provider);

    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), wallet.publicKey.toBuffer()],
      ECOM_PROGRAM_ID
    );
    console.log("Creating product with PDA:", productPda.toString());

    const tx = await ecomProgram.methods.createProduct(
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
  } catch (err) {
    console.error("Error creating product:", err.message);
    console.error("Stack:", err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}


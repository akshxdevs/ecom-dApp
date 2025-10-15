import * as anchor from "@coral-xyz/anchor";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import {
    PublicKey,
    clusterApiUrl,
    Transaction,
    Connection,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js'

const ECOM_PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

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

export { createProvider, verifyProgram, ECOM_PROGRAM_ID, connection };

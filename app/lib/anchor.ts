import { WalletAdapter } from "@solana/wallet-adapter-base";
import {
    PublicKey,
    clusterApiUrl,
    Transaction,
    Connection,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js'

const PROGRAM_ID = new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7");

// Type definitions for product creation
export interface CreateProductParams {
    productName: string;
    productShortDescription: string;
    price: number;
    category: 'Electronics' | 'BeautyAndPersonalCare' | 'SnacksAndDrinks' | 'HouseholdEssentials' | 'GroceryAndKitchen';
    division: 'Mobile' | 'Laptop' | 'Headphone' | 'SmartWatch' | 'ComputerPeripherals';
    sellerName: string;
    productImgUrl: string;
}

export class AnchorClient {
    private connection:Connection;
    private wallet:WalletAdapter;
    
    constructor(wallet: WalletAdapter) {
        this.connection = new Connection(clusterApiUrl("devnet"),"confirmed");
        this.wallet = wallet;
    }
    async intialize(){
     try {
        if (!this.wallet.publicKey) throw new Error("Wallet Not Connected!");
        return "mock_tx_ignature";
     } catch (error) {
        throw error;
     }
    }
    async create_product(params: CreateProductParams): Promise<string> {
        try {
            if (!this.wallet.publicKey) throw new Error("Wallet Not Connected!");
            
            // Convert category and division to the format expected by the program
            const categoryMap: Record<string, number> = {
                'Electronics': 0,
                'BeautyAndPersonalCare': 1,
                'SnacksAndDrinks': 2,
                'HouseholdEssentials': 3,
                'GroceryAndKitchen': 4
            };
            
            const divisionMap: Record<string, number> = {
                'Mobile': 0,
                'Laptop': 1,
                'Headphone': 2,
                'SmartWatch': 3,
                'ComputerPeripherals': 4
            };
            
            // Find PDAs
            const [productPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("product"),
                    this.wallet.publicKey.toBuffer(),
                    Buffer.from(params.productName),
                ],
                PROGRAM_ID
            );
            
            const [productListPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("product_list"), this.wallet.publicKey.toBuffer()],
                PROGRAM_ID
            );
            
            // Create instruction data
            const instructionData = Buffer.alloc(8 + 4 + params.productName.length + 4 + params.productShortDescription.length + 4 + 1 + 1 + 4 + params.sellerName.length + 4 + params.productImgUrl.length);
            let offset = 0;
            
            // Discriminator for create_product instruction: [183, 155, 202, 119, 43, 114, 174, 225]
            instructionData.set([183, 155, 202, 119, 43, 114, 174, 225], offset);
            offset += 8;
            
            // Product name (string)
            instructionData.set(Buffer.from(params.productName), offset + 4);
            instructionData.writeUInt32LE(params.productName.length, offset);
            offset += 4 + params.productName.length;
            
            // Product short description (string)
            instructionData.set(Buffer.from(params.productShortDescription), offset + 4);
            instructionData.writeUInt32LE(params.productShortDescription.length, offset);
            offset += 4 + params.productShortDescription.length;
            
            // Price (u32)
            instructionData.writeUInt32LE(params.price, offset);
            offset += 4;
            
            // Category (enum)
            instructionData.writeUInt8(categoryMap[params.category], offset);
            offset += 1;
            
            // Division (enum)
            instructionData.writeUInt8(divisionMap[params.division], offset);
            offset += 1;
            
            // Seller name (string)
            instructionData.set(Buffer.from(params.sellerName), offset + 4);
            instructionData.writeUInt32LE(params.sellerName.length, offset);
            offset += 4 + params.sellerName.length;
            
            // Product image URL (string)
            instructionData.set(Buffer.from(params.productImgUrl), offset + 4);
            instructionData.writeUInt32LE(params.productImgUrl.length, offset);
            
            // Create the instruction
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: productPda, isSigner: false, isWritable: true },
                    { pubkey: productListPda, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
                ],
                programId: PROGRAM_ID,
                data: instructionData
            });
            
            // Create and send transaction
            const transaction = new Transaction().add(instruction);
            const signature = await this.connection.sendTransaction(transaction, [this.wallet as any]);
            
            // Wait for confirmation
            await this.connection.confirmTransaction(signature);
            
            console.log("Product created successfully!");
            console.log("Transaction signature:", signature);
            console.log("Product PDA:", productPda.toString());
            
            return signature;
            
        } catch (error) {
            if(error instanceof Error){
                throw new Error(`Transaction Failed: ${error.message}`);
            }
            throw new Error(`Transaction Failed With Unknown Error..`);
        }
    }

    // Helper method to create a product with simpler parameters
    async createProduct(
        name: string,
        description: string,
        price: number,
        sellerName: string,
        imageUrl: string,
        category: CreateProductParams['category'] = 'Electronics',
        division: CreateProductParams['division'] = 'Mobile'
    ): Promise<string> {
        return this.create_product({
            productName: name,
            productShortDescription: description,
            price,
            category,
            division,
            sellerName,
            productImgUrl: imageUrl
        });
    }
}
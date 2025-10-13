import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcomDapp } from "../target/types/ecom_dapp";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { expect } from "chai";
import { BN } from "@coral-xyz/anchor";
import { 
  createMint, 
  mintTo, 
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";

describe("anchor", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EcomDapp as Program<EcomDapp>;
  const signer = provider.wallet as anchor.Wallet;
  const owner = provider.wallet as anchor.Wallet;

  let seller = Keypair.generate();
  let consumer = Keypair.generate();
  let buyer = Keypair.generate();
  

  let product_id: string[] = [];
  let product_name: string[] = [];
  let product_short_description: string[] = [];
  let price: number[] = [];;
  let category: any;
  let division: any;
  let seller_name: string[] = [];;
  let product_imgurl: string[] = [];;
  let total_amount: number;

  let escrow:anchor.web3.PublicKey;
  let mint:anchor.web3.PublicKey;
  let escrowAta:anchor.web3.PublicKey;
  let sellerAta:anchor.web3.PublicKey;
  let buyerAta:anchor.web3.PublicKey;
  let userAta:anchor.web3.PublicKey;

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
  async function getSolPrice(): Promise<number> {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const data = (await res.json()) as { solana: { usd: number } };
    return data.solana.usd; 
  }
  async function convertUsdToLamports(usdAmount: number): Promise<number> {
    const solPrice = await getSolPrice();   // $ per SOL
    const solAmount = usdAmount / solPrice; // SOL needed
    const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
    return lamports;
  }

  it.only("should initialize and create product", async () => {
    await provider.connection.requestAirdrop(
      seller.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    product_name[0] = "iPhone 17 Pro";
    product_short_description[0] = "Premium flagship smartphone";
    price[0] = 799;
    category = { electronics: {} };
    division = { mobile: {} };
    seller_name[0] = "Apple";
    product_imgurl[0] = "https://example.com/iphone.jpg";

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name[0]),
      ],
      program.programId
    );
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    
    const tx = await program.methods
      .createProduct(
        product_name[0],
        product_short_description[0],
        price[0],
        category,
        division,
        seller_name[0],
        product_imgurl[0]
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();
    console.log("Transaction Signature: ",tx);
    
    const productDetails = await program.account.product.fetch(productPda);
    
    product_id.push(bytesToUuid(productDetails.productId));

    console.log("CREATED / ADDED PRODUCT SUCCESSFULLY!");
    console.log("Product Id: ",product_id[0]);
    console.log(productDetails);

    // expect(productDetails.productName).to.equal(product_name);
    // expect(productDetails.price).to.equal(price);
  });

  it.only("should create another product", async () => {
    product_name[1] = "MacBook Pro";
    product_short_description[1] = "High-performance laptop";
    price[1] = 1599;
    category = { electronics: {} };
    division = { laptop: {} };
    seller_name[1] = "Apple";
    product_imgurl[1] = "https://example.com/macbook.jpg";

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name[1]),
      ],
      program.programId
    );
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    
    const tx = await program.methods
      .createProduct(
        product_name[1],
        product_short_description[1],
        price[1],
        category,
        division,
        seller_name[1],
        product_imgurl[1]
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();
    console.log("Transaction Signature: ",tx);

    const productDetails = await program.account.product.fetch(productPda);
    
    product_id.push(bytesToUuid(productDetails.productId));

    console.log("ADDED PRODUCT SUCCESSFULLY!");
    console.log("Product Id: ",product_id[1]);
    console.log(productDetails);

    // expect(productDetails.productName).to.equal(product_name);
    // expect(productDetails.price).to.equal(price);
  });

  it.only("should create third product and display all products", async () => {
    product_name[2] = "Apple Watch SE";
    product_short_description[2] = "Smartwatch for health tracking";
    price[2] = 249;
    category = { electronics: {} };
    division = { smartWatch: {} };
    seller_name[2] = "Apple";
    product_imgurl[2] = "https://example.com/watch.jpg";

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name[2]),
      ],
      program.programId
    );
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );
    
    const tx = await program.methods
      .createProduct(
        product_name[2],
        product_short_description[2],
        price[2],
        category,
        division,
        seller_name[2],
        product_imgurl[2]
      )
      .accounts({
        seller: seller.publicKey,
        product: productPda,
        productList: productListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([seller])
      .rpc();
    console.log("Transaction Signature: ",tx);

    const productDetails = await program.account.product.fetch(productPda);
    
    product_id.push(bytesToUuid(productDetails.productId));

    console.log("ADDED PRODUCT SUCCESSFULLY!");

    // expect(productDetails.productName).to.equal(product_name);
    // expect(productDetails.price).to.equal(price);

  });
  it.only("should display product list list", async () => {
    const [productListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_list"), seller.publicKey.toBuffer()],
      program.programId
    );

    const productList = await program.account.productsList.fetch(productListPda);
    console.log("Product Id: ",product_id);
    console.log("Product List Details: ",productList);
    
    // expect(productList.products.length).to.equal(3);
  });
  it.only("should add product to cart", async () => {
    await provider.connection.requestAirdrop(
      consumer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name[2])
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
      program.programId
    );

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name[2]),
      ],
      program.programId
    );

    const tx = await program.methods
      .addToCart(
        product_name[2],        
        2,                   
        seller.publicKey,    
        product_imgurl[2],      
        price[2]                
      )
      .accounts({
        consumer: consumer.publicKey,
        products: productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([consumer])
      .rpc();
    console.log("Transaction Signature: ",tx);

    const cart = await program.account.cart.fetch(cartPda);
    // const cartProductId = bytesToUuid(cart.productId); 
    console.log("Cart Amount Added: ",cart.amount.toString());
    
    console.log("Cart Added Product Details: ",bytesToUuid(cart.productId));
    expect(bytesToUuid(cart.productId)).to.equal(product_id[2]);    
    // expect(cart.productName).to.equal(product_name);
    // expect(cart.quantity).to.equal(1);
  });

  it.only("should add another product to cart", async () => {
    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name[0])
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
      program.programId
    );

    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name[0]),
      ],
      program.programId
    );
    
    const tx = await program.methods
      .addToCart(
        product_name[0],        
        1,                   
        seller.publicKey,    
        product_imgurl[0],      
        price[0]                
      )
      .accounts({
        consumer: consumer.publicKey,
        products: productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([consumer])
      .rpc();
    console.log("Transaction Signature: ",tx);

    const cart = await program.account.cart.fetch(cartPda);
    // const cartProductId = bytesToUuid(cart.productId); 
    console.log("Cart Amount Added: ",cart.amount.toString());
    console.log("Cart Added Product Details: ",bytesToUuid(cart.productId));
    expect(bytesToUuid(cart.productId)).to.equal(product_id[0]);
    
    // expect(cart.productName).to.equal(product_name);
  });

  it.only("should display cart list", async () => {
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
      program.programId
    );

    const cartList = await program.account.cartList.fetch(cartListPda);
    console.log("Cart Details: ",cartList);
    total_amount = Number(cartList.totalAmount); 
    console.log("Total Amount: ", total_amount);
    
    // expect(cartList.cartList.length).to.be.greaterThan(0);
  });

  it.only("should intialize and create payment", async () => {
    await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [paymentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), buyer.publicKey.toBuffer()],
      program.programId
    );
    const totalPaymentAmount = new BN(total_amount);
    
    const payment_tx = await program.methods.createPayment(
      totalPaymentAmount,
      paymentPda,
      null,
    ).accounts({
      signer: buyer.publicKey,
      payments: paymentPda,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([buyer]).rpc();
    console.log("Transaction Signature: ",payment_tx);
    
    const payment = await program.account.payment.fetch(paymentPda);
    console.log("Payment Details: ",payment);
    if (expect(payment.paymentStatus).to.have.property("pending")) {
      console.log("Payment Not Intialized!");
      require;
    }else{
      payment.txSignature = payment_tx;
    }
  });

  it("should create escrow and mint token", async () => {
    mint = await createMint(
      provider.connection,
      owner.payer,
      owner.publicKey,
      null,
      6
    );
        
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        owner.publicKey.toBuffer(),
      ],
      program.programId
    );

    escrowAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner.payer,
        mint,
        escrowPda,
        true
      )
    ).address;

    buyerAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner.payer,
        mint,
        buyer.publicKey
      )
    ).address;

    sellerAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner.payer,
        mint,
        seller.publicKey
      )
    ).address;

    userAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        signer.payer,
        mint,
        owner.publicKey
      )
    ).address;

    await mintTo(
      provider.connection,
      owner.payer,
      mint,
      userAta,
      owner.payer,
      100_000_000_000
    )
    const tx = await program.methods.createEscrow(
      buyer.publicKey,
      seller.publicKey,
      new anchor.BN(1499),
    ).accounts({
      owner: owner.publicKey,
      escrow: escrowPda,
      userAta: userAta,
      escrowAta: escrowAta,
      buyerAta: buyerAta,
      sellerAta: sellerAta,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID
    } as any).rpc()
    console.log("Transaction Signature: ",tx);
    
    console.log("---CREATED ESCROW---");
    

    const userBalance = await provider.connection.getTokenAccountBalance(userAta);
    const sellererBalance = await provider.connection.getTokenAccountBalance(sellerAta);
    const buyerBalance = await provider.connection.getTokenAccountBalance(buyerAta);

    console.log("User Balance: ",Number(userBalance.value.amount) / LAMPORTS_PER_SOL + "SOL");
    console.log("Buyer Balance: ",Number(sellererBalance.value.amount) / LAMPORTS_PER_SOL + "SOL");
    console.log("Seller Balance: ",Number(buyerBalance.value.amount) / LAMPORTS_PER_SOL + "SOL");
    const escrowDetails = await program.account.escrow.fetch(escrowPda);

    expect(escrowDetails.escrowStatus).to.have.property("swapPending");
  });

  it("should buyer deposite funds to escrow",async()=>{
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        owner.publicKey.toBuffer(),
      ],
      program.programId
    );
    const lamports = (await convertUsdToLamports(1499));
    const deposite_tx = await program.methods.depositEscrow(
      1,
      new anchor.BN(lamports),
    ).accounts({
      escrow: escrowPda,
      owner: owner.publicKey,
      userAta: userAta,
      escrowAta: escrowAta,
      buyerAta: buyerAta,
      sellerAta: sellerAta, 
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any).rpc();
    console.log("Transaction Signature: ",deposite_tx)

    console.log("AFTER DEPOSITE...");

    console.log("Grand Total (solana): ",(lamports /LAMPORTS_PER_SOL).toFixed(2) + "SOL");
    console.log("Grand Total($): ",1499 + "$");
    
    const dUser = await provider.connection.getTokenAccountBalance(userAta);
    const dEscrow = await provider.connection.getTokenAccountBalance(escrowAta);
    const dBuyer = await provider.connection.getTokenAccountBalance(buyerAta);
    const dSeller = await provider.connection.getTokenAccountBalance(sellerAta)

    console.log("User Token Balance:", dUser.value.uiAmountString);
    console.log("Escrow Token Balance:", dEscrow.value.uiAmountString);
    console.log("Buyer Token Balance:", dBuyer.value.uiAmountString);
    console.log("Seller Token Balance:", dSeller.value.uiAmountString);

    const escrowDetails = await program.account.escrow.fetch(escrowPda);
    
    expect(escrowDetails.releaseFund).to.be.true;
    expect(escrowDetails.escrowStatus).to.have.property("fundsReceived");

    });

  it("Escrow withdraws and sent to seller",async()=>{
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        owner.publicKey.toBuffer(),
      ],
      program.programId
    );
    const escrowBefore = await program.account.escrow.fetch(escrowPda);
    expect(escrowBefore.releaseFund).to.be.true;

    const usd = 1499;
    const lamports = (await convertUsdToLamports(usd));
    const withdraw_tx = await program.methods.withdrawEscrow(
      1,
      new anchor.BN(lamports),
    ).accounts({
      escrow: escrowPda,
      owner: owner.publicKey,
      userAta: userAta,
      escrowAta: escrowAta,
      buyerAta: buyerAta,
      sellerAta: sellerAta, 
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any).rpc();
    console.log("Transaction Signature: ",withdraw_tx)

    console.log("AFTER WITHDRAWL...");

    console.log("Grand Total (solana): ",(lamports /LAMPORTS_PER_SOL).toFixed(2) + "SOL");
    console.log("Grand Total($): ",usd + "$");
    
    const wUser = await provider.connection.getTokenAccountBalance(userAta);
    const wEscrow = await provider.connection.getTokenAccountBalance(escrowAta);
    const wBuyer = await provider.connection.getTokenAccountBalance(buyerAta);
    const wSeller = await provider.connection.getTokenAccountBalance(sellerAta)

    console.log("User Token Balance:", wUser.value.uiAmountString);
    console.log("Escrow Token Balance:", wEscrow.value.uiAmountString);
    console.log("Buyer Token Balance:", wBuyer.value.uiAmountString);
    console.log("Seller Token Balance:", wSeller.value.uiAmountString)
    const escrowAfter = await program.account.escrow.fetch(escrowPda);
    
    expect(escrowAfter.escrowStatus).to.have.property("swapSuccess");
    expect(escrowAfter.releaseFund).to.be.false;
    });
  it("should check & confirm payment status", async () => {
    await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [paymentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), buyer.publicKey.toBuffer()],
      program.programId
    );
    const totalPaymentAmount = new BN(total_amount);
    
    const payment_tx = await program.methods.createPayment(
      totalPaymentAmount,
      paymentPda,
      null,
    ).accounts({
      signer: buyer.publicKey,
      payments: paymentPda,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([buyer]).rpc();
    console.log("Transaction Signature: ",payment_tx);
    
    const payment = await program.account.payment.fetch(paymentPda);
    console.log("Payment Details: ",payment);
    if (expect(payment.paymentStatus).to.have.property("pending")) {
      console.log("Payment Not Intialized!");
      require;
    }else{
      payment.txSignature = payment_tx;
    }
  });
    it("should palce order and show details",async()=>{
    // const [orderPda] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("order"), buyer.publicKey.toBuffer()],
    //   program.programId
    // );

    // const order_tx = await program.methods.createOrder(
    //   product_id_bytes,
    //   payment.paymentId,
    //   product_id_bytes,
    // ).accounts({
    //   signer: buyer.publicKey,
    //   order: orderPda,
    //   cart: cartPda,
    //   payment: paymentPda,
    //   systemProgram: SYSTEM_PROGRAM_ID,
    // } as any).signers([buyer]).rpc();
    
    // const order = await program.account.order.fetch(orderPda);

    // // expect(payment.paymentAmount.toString()).to.equal(total_amount.toString());
    // expect(order.orderStatus).to.have.property("pending");
    });
});
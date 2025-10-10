import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcomDapp } from "../target/types/ecom_dapp";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { expect } from "chai";
import { BN } from "@coral-xyz/anchor";
import { 
  createMint, 
  createAssociatedTokenAccount, 
  getAssociatedTokenAddress, 
  mintTo, 
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";

describe("anchor", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EcomDapp as Program<EcomDapp>;
  const signer = provider.wallet.publicKey;

  let seller = Keypair.generate();
  let consumer = Keypair.generate();
  let buyer = Keypair.generate();
  let cpiBuyer = Keypair.generate();

  let product_id: any;
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

  it("should initialize and create product", async () => {
    await provider.connection.requestAirdrop(
      seller.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    product_name = "iPhone 17 Pro";
    product_short_description = "Premium flagship smartphone";
    price = 799;
    category = { electronics: {} };
    division = { mobile: {} };
    seller_name = "Apple";
    product_imgurl = "https://example.com/iphone.jpg";

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

    const product = await program.account.product.fetch(productPda);
    product_id = bytesToUuid(product.productId);
    
    expect(product.productName).to.equal(product_name);
    expect(product.price).to.equal(price);
  });

  it("should create another product", async () => {
    product_name = "MacBook Pro";
    product_short_description = "High-performance laptop";
    price = 1599;
    category = { electronics: {} };
    division = { laptop: {} };
    seller_name = "Apple";
    product_imgurl = "https://example.com/macbook.jpg";

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

    const product = await program.account.product.fetch(productPda);
    product_id = bytesToUuid(product.productId);
    
    expect(product.productName).to.equal(product_name);
    expect(product.price).to.equal(price);
  });

  it("should create third product and display all products", async () => {
    product_name = "Apple Watch SE";
    product_short_description = "Smartwatch for health tracking";
    price = 249;
    category = { electronics: {} };
    division = { smartWatch: {} };
    seller_name = "Apple";
    product_imgurl = "https://example.com/watch.jpg";

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

    const product = await program.account.product.fetch(productPda);
    const productList = await program.account.productsList.fetch(productListPda);
    product_id = bytesToUuid(product.productId);
    
    expect(productList.products.length).to.equal(3);
  });

  it("should add product to cart", async () => {
    await provider.connection.requestAirdrop(
      consumer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
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
        products: productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([consumer])
      .rpc();

    const cart = await program.account.cart.fetch(cartPda);
    const cartProductId = bytesToUuid(cart.productId); 
    
    expect(cart.productName).to.equal(product_name);
    expect(cart.quantity).to.equal(1);
  });

  it("should add another product to cart", async () => {
    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
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
        products: productPda,
        cartList: cartListPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      } as any)
      .signers([consumer])
      .rpc();

    const cart = await program.account.cart.fetch(cartPda);
    const cartProductId = bytesToUuid(cart.productId); 
    
    expect(cart.productName).to.equal(product_name);
  });

  it("should display cart count", async () => {
    const [cartListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart_list"), consumer.publicKey.toBuffer()],
      program.programId
    );

    const cartList = await program.account.cartList.fetch(cartListPda);
    expect(cartList.cartList.length).to.be.greaterThan(0);
  });

  it("should create payment and order", async () => {
    await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [paymentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), buyer.publicKey.toBuffer()],
      program.programId
    );

    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );

    const cartData = await program.account.cart.fetch(cartPda);
    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const productData = await program.account.product.fetch(productPda);
    const product_id_bytes = productData.productId;

    const total_amount = cartData.price * cartData.quantity;
    const payment_amount = new BN(total_amount);
    
    const payment_tx = await program.methods.createPayment(
      payment_amount,
      cartPda,
      null,
    ).accounts({
      signer: buyer.publicKey,
      payments: paymentPda,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([buyer]).rpc();
    
    const payment = await program.account.payment.fetch(paymentPda);

    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), buyer.publicKey.toBuffer()],
      program.programId
    );

    const order_tx = await program.methods.createOrder(
      product_id_bytes,
      payment.paymentId,
      product_id_bytes,
    ).accounts({
      signer: buyer.publicKey,
      order: orderPda,
      cart: cartPda,
      payment: paymentPda,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([buyer]).rpc();
    
    const order = await program.account.order.fetch(orderPda);

    expect(payment.paymentAmount.toString()).to.equal(total_amount.toString());
    expect(order.orderStatus).to.have.property("pending");
  });

  it("should implement CPI transfer with token accounts", async () => {
    await provider.connection.requestAirdrop(
      cpiBuyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create SPL Token Mint
    const mint = await createMint(
      provider.connection,
      cpiBuyer,
      cpiBuyer.publicKey,
      null,
      6
    );

    // Get cart data for amount calculation
    const [cartPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cart"), 
        consumer.publicKey.toBuffer(), 
        Buffer.from(product_name)
      ],
      program.programId
    );
    const cartData = await program.account.cart.fetch(cartPda);
    const total_amount = cartData.price * cartData.quantity;

    // Create Associated Token Accounts (ATAs)
    const buyerAta = await getAssociatedTokenAddress(mint, cpiBuyer.publicKey);
    try {
      await createAssociatedTokenAccount(
        provider.connection,
        cpiBuyer,
        mint,
        cpiBuyer.publicKey
      );
    } catch (error) {
      // Account already exists
    }

    const sellerAta = await getAssociatedTokenAddress(mint, seller.publicKey);
    try {
      await createAssociatedTokenAccount(
        provider.connection,
        cpiBuyer,
        mint,
        seller.publicKey
      );
    } catch (error) {
      // Account already exists
    }

    // Get product data for product_id
    const [productPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        seller.publicKey.toBuffer(),
        Buffer.from(product_name),
      ],
      program.programId
    );
    const productData = await program.account.product.fetch(productPda);
    const product_id_bytes = productData.productId;
    const product_id_u32 = new DataView(Buffer.from(product_id_bytes).buffer).getUint32(0, true);

    // Note: escrowPda will be derived automatically by Anchor

    // Mint tokens to buyer
    const mintAmount = total_amount * 2;
    await mintTo(
      provider.connection,
      cpiBuyer,
      mint,
      buyerAta,
      cpiBuyer.publicKey,
      mintAmount
    );

    // Create Payment and Escrow
    const [paymentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), cpiBuyer.publicKey.toBuffer()],
      program.programId
    );

    const payment_amount = new BN(total_amount);
    const payment_tx = await program.methods.createPayment(
      payment_amount,
      cartPda,
      null,
    ).accounts({
      signer: cpiBuyer.publicKey,
      payments: paymentPda,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([cpiBuyer]).rpc();
    const product_id_buffer = Buffer.alloc(4);
    product_id_buffer.writeUInt32LE(product_id_u32, 0);
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        cpiBuyer.publicKey.toBuffer(),
        product_id_buffer,
      ],
      program.programId
    );

    // Create escrow ATA now that we know the escrow PDA
    const escrowAta = await getAssociatedTokenAddress(mint, escrowPda, true);
      await createAssociatedTokenAccount(
        provider.connection,
        cpiBuyer,
        mint,
        escrowPda
      );
    const escrow_tx = await program.methods.createEscrow(
      cpiBuyer.publicKey,
      seller.publicKey,
      payment_amount,
      product_id_u32,
    ).accounts({
      owner: cpiBuyer.publicKey,
      payment: paymentPda,
      cart: cartPda,
      userAta: buyerAta,
      buyerAta: buyerAta,
      escrowAta: escrowAta,
      sellerAta: sellerAta,
      products: productPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([cpiBuyer]).rpc();

    // Get the escrow PDA that was created

    // Deposit to Escrow (CPI Transfer)
    const deposit_tx = await program.methods.depositEscrow(
      product_id_u32
    ).accounts({
      owner: cpiBuyer.publicKey,
      escrow: escrowPda,
      payment: paymentPda,
      cart: cartPda,
      userAta: buyerAta,
      escrowAta: escrowAta,
      buyerAta: buyerAta,
      sellerAta: sellerAta,
      products: productPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([cpiBuyer]).rpc();

    // Check balances after deposit
    const buyerBalanceAfter = await getAccount(provider.connection, buyerAta);
    const escrowBalanceAfter = await getAccount(provider.connection, escrowAta);

    expect(escrowBalanceAfter.amount.toString()).to.equal(total_amount.toString());

    // Withdraw from Escrow (CPI Transfer)
    const withdraw_tx = await program.methods.withdrawEscrow(
      product_id_u32
    ).accounts({
      owner: cpiBuyer.publicKey,
      escrow: escrowPda,
      payment: paymentPda,
      cart: cartPda,
      userAta: buyerAta,
      escrowAta: escrowAta,
      buyerAta: buyerAta,
      sellerAta: sellerAta,
      products: productPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
    } as any).signers([cpiBuyer]).rpc();

    // Check final balances
    const sellerBalanceFinal = await getAccount(provider.connection, sellerAta);
    const escrowBalanceFinal = await getAccount(provider.connection, escrowAta);

    expect(sellerBalanceFinal.amount.toString()).to.equal(total_amount.toString());
    expect(escrowBalanceFinal.amount.toString()).to.equal("0");
  });
});
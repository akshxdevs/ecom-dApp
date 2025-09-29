use anchor_lang::prelude::*;

use crate::states::cart::{Cart, Cartlist, Stock};



impl <'info> AddToCart <'info> {
    pub fn add_to_cart(
        &mut self,
        product_id: u32,
        product_name: String,
        quantity: u32,
        seller_pubkey: Pubkey,
        product_imgurl: String,
        price: u32,
        cart_bump:u8,
    ) -> Result<()>{
        self.cart.set_inner(Cart 
            { 
                product_id, 
                product_name, 
                quantity, 
                seller_pubkey, 
                product_imgurl,
                price, 
                stock_status:Stock::InStock,
                cart_bump,
            });

            
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(product_id:u32, product_name: String, product_imgurl: String)]
pub struct AddToCart<'info> {
    #[account(mut)]
    pub consumer: Signer<'info>,

    #[account(
        init,
        payer = consumer,
        seeds = [b"cart", consumer.key().as_ref(), &product_id.to_le_bytes()],
        bump,
        space = 8
            + 4 
            + 4 + product_name.len() 
            + 4 
            + 32 
            + 4 + product_imgurl.len() 
            + 4 
            + 1 
    )]
    pub cart: Account<'info, Cart>,
    #[account(
        mut,
        seeds= [b"cart_list"],
        bump
    )]
    pub cart_list:Account<'info,Cartlist>,
    pub system_program: Program<'info, System>,
}

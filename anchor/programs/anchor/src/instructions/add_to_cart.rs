use anchor_lang::prelude::*;
use crate::states::cart::{Cart, CartCreated, Cartlist, Stock};

#[derive(Accounts)]
#[instruction(product_id:u32, product_name: String, product_imgurl: String)]
pub struct AddToCart<'info> {
    #[account(mut)]
    pub consumer: Signer<'info>,

    #[account(
        init,
        payer = consumer,
        seeds = [b"cart", consumer.key().as_ref(), &product_id.swap_bytes()],
        space = 8 + Cart::INIT_SPACE
    )]
    pub cart: Account<'info, Cart>,
    #[account(
        init_if_needed,
        payer = consumer,
        seeds= [b"cart_list",consumer.key().as_ref()],
        bump,
        space = 8 + Cartlist::INIT_SPACE
    )]
    pub cart_list:Account<'info,Cartlist>,
    pub system_program: Program<'info, System>,
}

impl <'info> AddToCart <'info> {
    pub fn add_to_cart(
        &mut self,
        product_id: String,
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
                product_name: product_name.clone(),
                quantity, 
                seller_pubkey, 
                product_imgurl: product_imgurl.clone(),
                price, 
                stock_status: Stock::InStock,
                cart_bump,
            });

        emit!(CartCreated{
            product_name,
            price,
            quantity,
            seller:self.cart.seller_pubkey,
        });
        Ok(())
    }
    pub fn cart_list(
        &mut self,
        cart_list_bump:u8,
    )->Result<()>{
        if self.cart_list.cart_list.is_empty() && self.cart_list.cart_list_bump == 0 {
            self.cart_list.set_inner(Cartlist { 
                cart_list: Vec::new(), 
                cart_list_bump 
            });
        }

        Ok(())
    }
}


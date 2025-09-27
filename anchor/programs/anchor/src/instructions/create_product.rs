use anchor_lang::prelude::*;
use crate::states::{Category, Division, Product, Stock};


impl <'info> CreateProduct<'info> {
    pub fn create_product(
        &mut self,
        product_name:String,
        product_short_description:String,
        price:u32,
        category: Category,
        division:Division,
        seller_name:String,
        product_imgurl:String,
        creation_bump:u8,
    ) -> Result<()> {
        self.product.set_inner(Product { 
            product_id: 0, 
            product_name, 
            category , 
            division, 
            quantity: 100, 
            seller_pubkey:self.seller.key().clone(), 
            seller_name, 
            product_short_description, 
            product_imgurl, 
            price, 
            rating: 0.0, 
            stock_status: Stock::InStock,
            creation_bump  
        });
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction(product_name: String, product_short_description: String)]
pub struct CreateProduct<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        init,
        payer = seller,
        seeds = [b"product", seller.key().as_ref(), product_name.as_bytes()],
        bump,
        space = 8
              + 4 + product_name.len()
              + 1
              + 1
              + 4
              + 32
              + 4 + 50
              + 4 + product_short_description.len()
              + 4 + 200
              + 4
              + 4
              + 1
              + 8
              + 1
    )]
    pub product: Account<'info, Product>,

    pub system_program: Program<'info, System>,
}

#![allow(unexpected_cfgs,deprecated)]
use anchor_lang::prelude::*;
mod instructions;
mod states;
use crate::instructions::*;
use crate::states::{Category,Division};

declare_id!("4ueHQod8MRop3TfjKwhyni58TKtVqFHHLX4cAyEN8SLn");

#[program]
pub mod ecom_dapp {
    use crate::states::{Category, Division};

    use super::*;
    pub fn create_product(
        ctx: Context<CreateProduct>,
        product_name:String,
        product_short_description:String,
        price:u32,
        category: Category,
        division:Division,
        seller_name:String,
        product_imgurl:String,    
    ) -> Result<()> {
        ctx.accounts.create_product(
            product_name, 
            product_short_description, 
            price, category, 
            division, 
            seller_name, 
            product_imgurl, 
            ctx.bumps.product,
        )?;
        let product_key = ctx.accounts.product.key();
        ctx.accounts.product_list.products.push(product_key);
        Ok(())
    }

    pub fn add_to_cart(
        ctx: Context<AddToCart>,
        product_id: u32,
        product_name: String,
        quantity: u32,
        seller_pubkey: Pubkey,
        product_imgurl: String,
        price: u32,
    ) -> Result<()> {
        ctx.accounts.add_to_cart(
            product_id,
            product_name,
            quantity,
            seller_pubkey,
            product_imgurl,
            price,
            ctx.bumps.cart,
        )?;
        let cart_key = ctx.accounts.cart.key();
        ctx.accounts.cart_list.cart_list.push(cart_key);
        Ok(())
    }
}

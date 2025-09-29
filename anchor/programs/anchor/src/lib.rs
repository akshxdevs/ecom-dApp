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
        creation_bump:u8,
        seller_name:String,
        product_imgurl:String,    
    ) -> Result<()> {
        ctx.accounts.create_product(
            product_name, product_short_description, price, category, division, seller_name, product_imgurl, creation_bump
        )?;
        let product_key = ctx.accounts.product.key();
        ctx.accounts.product_list.products.push(product_key);
        Ok(())
    }
}

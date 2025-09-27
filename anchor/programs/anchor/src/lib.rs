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

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

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
            product_name, product_short_description, price, category, division, product_imgurl, seller_name, creation_bump)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {

}

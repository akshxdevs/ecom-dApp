use anchor_lang::prelude::*;
use crate::states::ProductsList;

#[derive(Accounts)]
pub struct ListProducts<'info> {
    #[account(mut, seeds = [b"product_list"], bump)]
    pub products_list: Account<'info, ProductsList>,
}

pub fn product_list(ctx: Context<ListProducts>) -> Result<Vec<Pubkey>> {
    Ok(ctx.accounts.products_list.products.clone())
}

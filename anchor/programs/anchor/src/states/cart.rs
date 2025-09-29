use anchor_lang::prelude::*;

#[account]
pub struct Cart{
    pub product_id: u32,
    pub product_name: String,
    pub quantity: u32,
    pub seller_pubkey: Pubkey,
    pub product_imgurl: String,
    pub stock_status: Stock,
    pub price: u32,
    pub cart_bump:u8,
}

#[account]
pub struct Cartlist{
    pub cart_list: Vec<Pubkey>, 
}

#[derive(AnchorDeserialize,AnchorSerialize,Clone)]
pub enum Stock {
    OutOfStock,
    InStock,
    Restoring
}
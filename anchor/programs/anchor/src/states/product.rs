use anchor_lang::prelude::*;

#[account]
pub struct Product {
    pub product_id: u32,
    pub product_name: String,
    pub category: Category,
    pub division: Division,
    pub quantity: u32,
    pub seller_pubkey: Pubkey,
    pub seller_name: String,
    pub product_short_description: String,
    pub product_imgurl: String,
    pub price: u32,
    pub rating: f32,
    pub stock_status: Stock,
    pub creation_bump:u8,
}

#[account]
pub struct ProductsList{
    pub products:Vec<Pubkey>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Category {
    Electronics,
    BeautyAndPersonalCare,
    SnacksAndDrinks,
    HouseholdEssentials,
    GroceryAndKitchen,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Division {
    Mobile,
    Laptop,
    Headphone,
    SmartWatch,
    ComputerPeripherals,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Stock {
    OutOfStock,
    InStock,
    Restoring
}


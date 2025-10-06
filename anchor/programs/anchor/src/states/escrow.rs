use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct Escrow{
    pub owner:Pubkey,
    pub buyer_pubkey:Pubkey,
    pub seller_pubkey:Pubkey,
    pub product_id:u32,
    pub payment_id:u32,
    pub amount:u64,
    pub release_fund:bool,
    pub time_stamp:i64,
    pub update_timestamp:i64,
    pub escrow_status:EscrowStatus,
    pub escrow_bump:u8,
}

#[derive(Clone,AnchorDeserialize,AnchorSerialize,InitSpace)]
pub enum EscrowStatus {
    WaitingForSwap,
    FundsReceived,
    SellerNotPaid,
    BuyerNotPaid,
    SwapPending,
    TransferSuccess,
    TransferFailed,
}
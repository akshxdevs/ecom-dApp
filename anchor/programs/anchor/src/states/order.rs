use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Order{
    pub order_id:[u8;16],
    pub product_id:[u8;16],
    pub payment_id:[u8;16],
    pub tracking_id:[u8;16],
    pub order_status:OrderStatus,
    pub order_tracking:OrderTracking,
    pub created_at: i64,
    pub updated_at: i64,
    pub order_bump:u8,
}

#[derive(Clone,AnchorDeserialize,AnchorSerialize,InitSpace)]
pub enum OrderStatus {
    Pending,
    Placed,
    Failed,
    Returned
}
#[derive(Clone,AnchorDeserialize,AnchorSerialize,InitSpace)]
pub enum OrderTracking {
    WatingForOrders,
    Booked,
    InTransit,
    Shipped,
    OutForDelivery,
    Delivered,
}
use anchor_lang::prelude::*;
use crate::states::{cart::Cart, order::{Order, OrderStatus, OrderTracking}, payment::Payment};

#[derive(Accounts)]
pub struct CreateOrder<'info>{
    #[account(mut)]
    pub signer:Signer<'info>,

    #[account(
        init,
        payer = signer,
        seeds = [b"order",signer.key().as_ref()],
        bump,
        space = 9 + Order::INIT_SPACE,
    )]
    pub order:Account<'info,Order>,
    #[account(mut)]
    pub cart:Account<'info,Cart>,
    #[account(mut)]
    pub payment:Account<'info,Payment>,
    pub system_program:Program<'info,System>,
}

impl<'info> CreateOrder<'info> {
    pub fn create_order(
        &mut self,
        product_id:u32,
        payment_id:u32,
        tracking_id:u32,
        order_bump:u8,
    ) -> Result<()> {
        let clock = Clock::get()?;
        self.order.set_inner(Order { 
            order_id: 0,
            product_id , 
            payment_id, 
            tracking_id , 
            order_status:OrderStatus::Pending, 
            order_tracking:OrderTracking::Booked, 
            created_at:clock.unix_timestamp, 
            updated_at:clock.unix_timestamp, 
            order_bump,
        });
       Ok(()) 
    }
}
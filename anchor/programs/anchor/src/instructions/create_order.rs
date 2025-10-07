use anchor_lang::prelude::*;
use crate::states::{cart::Cart, order::{Order, OrderStatus, OrderTracking}, payment::Payment};
use anchor_lang::solana_program::hash::{self};
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
        product_id:[u8;16],
        payment_id:[u8;16],
        tracking_id:[u8;16],
        order_bump:u8,
    ) -> Result<()> {
        let clock = Clock::get()?;

        let seed_data = [
            self.signer.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
        ].concat();
        let hash = hash::hash(&seed_data);
        let order_id = hash.to_bytes()[..16]
            .try_into()
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        self.order.set_inner(Order { 
            order_id: order_id,
            product_id , 
            payment_id, 
            tracking_id , 
            order_status:OrderStatus::Pending, 
            order_tracking:OrderTracking::WatingForOrders, 
            created_at:clock.unix_timestamp, 
            updated_at:clock.unix_timestamp, 
            order_bump,
        });
       Ok(()) 
    }
}
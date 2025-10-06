use anchor_lang::prelude::*;

use crate::states::payment::{Payment, PaymentMethod, PaymentStatus};

#[derive(Accounts)]
pub struct CreatePayment<'info>{
    #[account(mut)]
    pub signer:Signer<'info>,

    #[account(
        init,
        payer = signer,
        seeds = [b"payment",signer.key().as_ref()],
        bump,
        space = 8 + Payment::INIT_SPACE
    )]
    pub payments:Account<'info,Payment>,
    pub system_program:Program<'info,System>
}


impl<'info> CreatePayment<'info>{
    pub fn create_payment(
        &mut self,
        payment_amount: u32,
        product_pubkey:Pubkey,
        tx_signature:Option<String>,
        payment_bump:u8,
    ) -> Result<()> {
        let clock = Clock::get()?;
        self.payments.set_inner(
            Payment { 
                payment_id: 0, 
                payment_amount, 
                product_pubkey, 
                payment_method: PaymentMethod::SOL, 
                payment_status: PaymentStatus::Pending, 
                time_stamp: clock.unix_timestamp, 
                tx_signature, 
                payment_bump, 
            }
        );
        Ok(())
    }
}
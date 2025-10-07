use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};
use crate::states::{escrow::{Escrow, EscrowStatus}, payment::{Payment, PaymentMethod, PaymentStatus}};
use anchor_lang::solana_program::hash::{self};
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

#[derive(Accounts)]
#[instruction(product_id:u32)]
pub struct CreateEscrow<'info>{
    #[account(mut)]
    pub owner:Signer<'info>,
    #[account(
        init,
        payer = owner,
        seeds = [b"escrow",owner.key().as_ref(),&product_id.to_le_bytes()],
        bump,
        space = 8 + Escrow::INIT_SPACE,
    )]
    pub escrow: Account<'info,Escrow>,

    #[account(mut)]
    pub payment:Account<'info,Payment>,

    //CHECKS: User Token Account
    #[account(mut)]
    pub user_ata: AccountInfo<'info>,
    //CHECKS: Escrow Token Account
    #[account(mut)]
    pub escrow_ata: AccountInfo<'info>,
    //CHECKS: Buyer Token Account
    #[account(mut)]
    pub buyer_ata: AccountInfo<'info>,
    //CHECKS: Seller Token Account
    #[account(mut)]
    pub seller_ata: AccountInfo<'info>,

    pub token_program:Program<'info,Token>,
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
        let seed_data = [
            self.signer.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
        ].concat();
        let hash = hash::hash(&seed_data);
        let payment_id:[u8;16] = hash.to_bytes()[..16]
        .try_into()
        .map_err(|_| ProgramError::InvalidInstructionData)?;
        self.payments.set_inner(
            Payment { 
                payment_id: payment_id, 
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

impl <'info> CreateEscrow<'info> {
    pub fn create_escrow(
        &mut self,
        buyer_pubkey:Pubkey,
        seller_pubkey:Pubkey,
        product_id:u32,
        payment_id:u32,
        amount:u64,
        escrow_bump:u8,
    )->Result<()> {
        let clock = Clock::get()?;
        self.escrow.set_inner(Escrow { 
            owner: self.owner.key(), 
            buyer_pubkey, 
            seller_pubkey, 
            product_id, 
            payment_id, 
            amount, 
            release_fund: false, 
            time_stamp: clock.unix_timestamp, 
            update_timestamp :clock.unix_timestamp, 
            escrow_status:EscrowStatus::WaitingForSwap, 
            escrow_bump,
        });

        Ok(())
    }

    pub fn deposite_escrow(
        &mut self,
        product_id:u32,
        escrow_bump:u8,
        amount:u64,
    )-> Result<()> {
        let cpi_accounts = Transfer{
            from:self.buyer_ata.to_account_info(),
            to:self.escrow_ata.to_account_info(),
            authority: self.user_ata.to_account_info(),
        };
        let cpi_programs = self.token_program.to_account_info();
        let seeds: &[&[u8]] = &[
            b"escrow",
            self.owner.key.as_ref(),
            &product_id.to_le_bytes(),
            &[escrow_bump],
        ];        
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_programs, 
            cpi_accounts, 
            signer_seeds
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdrawl_escrow(
        &mut self,
        product_id:u32,
        escrow_bump:u8,
        amount:u64,
    )-> Result<()> {
        let cpi_accounts = Transfer{
            from:self.escrow_ata.to_account_info(),
            to:self.seller_ata.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let cpi_programs = self.token_program.to_account_info();
        let seeds: &[&[u8]] = &[
            b"escrow",
            self.owner.key.as_ref(),
            &product_id.to_le_bytes(),
            &[escrow_bump],
        ];        
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_programs, 
            cpi_accounts, 
            signer_seeds
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
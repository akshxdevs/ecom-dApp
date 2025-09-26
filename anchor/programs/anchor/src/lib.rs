use anchor_lang::prelude::*;

declare_id!("5jKhUFjuZDmmKYw9chhNxofFVTniJMrWqM8Ktvh46u7p");

#[program]
pub mod anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

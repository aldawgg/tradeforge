# Claude Instructions for TradeForge

You are helping me build TradeForge, a trading journal web app.

## Project Context

TradeForge is a futures trading journal for traders, mainly focused on MES and MNQ traders.

The goal is to build a clean and simple trading journal MVP first.

The app should help users:

- Log trades
- Track P/L
- Track win rate
- Track current win streaks and loss streaks
- Upload screenshots
- Review mistakes
- Analyse setups
- Track prop firm evaluation progress manually

## Tech Stack

Use the existing project stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

## Coding Style

- Keep code simple and beginner-friendly.
- Use clear file names.
- Use readable variable names.
- Do not overengineer.
- Do not add major libraries without asking.
- Build one feature at a time.
- Explain what you changed after each task.
- Keep components clean and reusable.
- Prefer simple solutions over complex abstractions.
- Do not create unnecessary files.
- Do not rewrite large parts of the project unless needed.

## MVP Scope

Only build the trading journal MVP first.

The MVP should include:

- Landing page
- Login page
- Register page
- Dashboard
- Add trade form
- Trade history table
- Trade detail page
- Screenshot upload
- Setup tags
- Mistake tags
- Basic analytics
- Win rate tracking
- P/L tracking
- Current win streak tracking
- Current loss streak tracking
- Manual prop firm evaluation tracker

## Do Not Build Yet

Do not build these features yet:

- Copy trading
- Broker API connection
- Live trade execution
- Backtesting
- AI review
- Payment system
- Subscription system

## Safety Rule

Do not create any feature that sends real trading orders.

Do not create copy-trading functionality until the journal MVP is complete.

Do not connect to broker APIs yet.

Do not create live execution logic.

## Required Trade Fields

Each trade should include:

- Date
- Instrument
- Direction
- Session
- Entry price
- Exit price
- Stop loss
- Target
- Number of contracts
- Setup type
- Mistake tags
- Notes
- Screenshot
- Profit/loss
- R-multiple

## Instrument Options

Start with these instruments:

- MES
- MNQ
- ES
- NQ

Allow the app to support more instruments later.

## Direction Options

Each trade should have one direction:

- Long
- Short

## Session Options

Each trade should have one session:

- Asia
- London
- New York AM
- New York PM
- Other

## Setup Tags

Start with these setup tags:

- VWAP bounce
- VWAP reclaim
- Liquidity sweep
- FVG continuation
- Inverse FVG
- Rejection block
- Breakout retest
- Failed breakout
- Trend continuation
- Reversal trade
- News trade
- Other

## Mistake Tags

Start with these mistake tags:

- Entered too early
- Moved stop loss
- Overtraded
- Revenge traded
- Ignored news
- No clear setup
- Took profit too early
- Held loser too long
- Oversized
- Broke daily loss limit
- FOMO entry
- Other

## Required Analytics

The TradeForge dashboard must eventually include the following analytics.

### Win Rate

Show win rate across:

- Daily
- Weekly
- Monthly
- Annual

A winning trade is a trade with positive P/L.

A losing trade is a trade with negative P/L.

Break-even trades should not count as wins or losses.

### P/L Tracker

Show profit and loss across:

- Daily
- Weekly
- Monthly
- Annual

### Current Streak

Show:

- Current win streak
- Current loss streak

Rules:

- A winning trade is a trade with positive P/L.
- A losing trade is a trade with negative P/L.
- Break-even trades should not increase the win streak.
- Break-even trades should not increase the loss streak.

## Dashboard Requirements

The dashboard should show simple performance cards.

Required cards:

- Total P/L
- Daily P/L
- Weekly P/L
- Monthly P/L
- Annual P/L
- Daily win rate
- Weekly win rate
- Monthly win rate
- Annual win rate
- Current win streak
- Current loss streak
- Total trades
- Best setup
- Worst setup

The dashboard should use placeholder data first.

Do not connect Supabase until the UI structure is clean.

## Manual Prop Firm Eval Tracker

Include a manual prop firm evaluation tracker.

This should allow users to manually track:

- Prop firm name
- Account name
- Account size
- Starting balance
- Current balance
- Profit target
- Max drawdown
- Daily loss limit
- Minimum trading days
- Completed trading days
- Evaluation status
- Notes

Evaluation status options:

- Not started
- In progress
- Passed
- Failed
- Funded

Important:

Do not hardcode rules for specific prop firms.

Different prop firms have different rules and rules may change.

Make the eval tracker customizable and manual.

## Screenshot Upload

Users should be able to upload screenshots for each trade.

Possible screenshot types:

- Entry screenshot
- Exit screenshot
- Before trade screenshot
- After trade screenshot
- Higher timeframe screenshot
- Marked-up review screenshot

Use Supabase Storage later for screenshot storage.

Do not connect screenshot upload to Supabase until the basic trade form and trade detail page are working.

## Page Structure

The app should eventually have these pages.

### Public Pages

- Landing page
- Login page
- Register page

### Protected App Pages

- Dashboard
- Trade history
- Add trade
- Trade detail
- Analytics
- Evaluation tracker
- Settings

## Suggested Development Order

Build TradeForge in this order:

1. Basic project structure
2. Landing page
3. Dashboard layout with placeholder data
4. Add trade form UI
5. Trade history table UI
6. Trade detail page UI
7. Basic analytics UI
8. Evaluation tracker UI
9. Supabase setup
10. Authentication
11. Save trades to Supabase
12. Load trades from Supabase
13. Calculate real analytics from saved trades
14. Screenshot upload with Supabase Storage

## Important Development Rules

- Build one feature at a time.
- Do not build the whole app at once.
- Do not add unnecessary complexity.
- Do not add backtesting yet.
- Do not add copy trading yet.
- Do not add broker APIs yet.
- Do not add AI features yet.
- Always explain what files were changed.
- Ask before adding new libraries.
- Prioritise a clean, working MVP.

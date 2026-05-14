# TradeForge Project Plan

## App Name
TradeForge

## Goal
Build a futures trading journal web app for traders, mainly focused on MES and MNQ traders.

TradeForge should help users:
- Log trades
- Track performance
- Review mistakes
- Upload screenshots
- Analyse setups
- Track win rate and P/L
- Monitor current win/loss streaks
- Manually track prop firm evaluation progress

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

## MVP Features

1. Landing page
2. Login and register
3. Dashboard
4. Add trade form
5. Trade history table
6. Trade detail page
7. Screenshot upload
8. Setup tags
9. Mistake tags
10. Basic analytics
11. Win rate tracking
12. P/L tracking
13. Current win streak and loss streak tracking
14. Manual prop firm evaluation tracker

## Trade Fields

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

## Instruments

The main instruments should include:

- MES
- MNQ
- ES
- NQ

The app should allow more instruments to be added later.

## Direction Options

Each trade should have a direction:

- Long
- Short

## Session Options

Each trade should have a trading session:

- Asia
- London
- New York AM
- New York PM
- Other

## Setup Tags

Users should be able to tag trades based on their setup.

Example setup tags:

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

Users should be able to tag mistakes made during trades.

Example mistake tags:

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

## Analytics Features

TradeForge should track performance across different time periods.

### Win Rate Tracking

Users should be able to view win rate for:

- Daily performance
- Weekly performance
- Monthly performance
- Annual performance

Example:

- Today: 60% win rate
- This week: 55% win rate
- This month: 58% win rate
- This year: 52% win rate

A winning trade is any trade with positive P/L.

A losing trade is any trade with negative P/L.

Break-even trades should not count as wins or losses.

### P/L Tracking

Users should be able to view profit and loss for:

- Daily P/L
- Weekly P/L
- Monthly P/L
- Annual P/L

Example:

- Today: +$250
- This week: +$780
- This month: +$2,150
- This year: +$8,400

### Current Streak Tracking

The dashboard should show:

- Current win streak
- Current loss streak

Example:

- Current win streak: 4 trades
- Current loss streak: 0 trades

Rules:

- A winning trade has positive P/L.
- A losing trade has negative P/L.
- A break-even trade should not increase the win streak or loss streak.
- A break-even trade should not break the current streak unless decided later.

## Dashboard Requirements

The dashboard should show key performance cards.

Required dashboard cards:

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

The dashboard should also include simple charts later, such as:

- P/L over time
- Win rate over time
- Performance by setup
- Performance by instrument
- Performance by session
- Mistake frequency

## Prop Firm Evaluation Tracker

TradeForge should include a manual evaluation tracker for users who are trading prop firm challenges or funded account evaluations.

This feature should be manual and customizable because different prop firms have different rules.

### Purpose

The eval tracker helps users track their progress toward passing a prop firm evaluation.

### Fields

Each evaluation account should include:

- Prop firm name
- Account name
- Account size
- Starting balance
- Current balance
- Profit target
- Max drawdown
- Daily loss limit
- Minimum trading days
- Current trading days completed
- Evaluation status
- Notes

### Example

Prop firm: Apex  
Account size: $50,000  
Starting balance: $50,000  
Current balance: $51,250  
Profit target: $3,000  
Progress: 41.7%  
Max drawdown remaining: manually entered by user  
Status: In progress  

### Eval Status Options

- Not started
- In progress
- Passed
- Failed
- Funded

### Important Rule

The eval tracker should not automatically claim to know each prop firm's rules.

Users should manually enter their own evaluation rules and numbers.

This avoids incorrect calculations because prop firm rules can change.

## Screenshot Upload

Users should be able to upload screenshots for each trade.

Possible screenshot types:

- Entry screenshot
- Exit screenshot
- Before trade screenshot
- After trade screenshot
- Higher timeframe screenshot
- Marked-up review screenshot

Screenshots should be stored using Supabase Storage.

## Basic Pages

The MVP should include these pages:

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

## Future Features

Do not build these yet:

- Backtesting
- Chart replay
- AI trade review
- Broker sync
- Copy trading
- Live trade execution
- Payment system
- Subscription system

## Future Backtesting Features

Later, TradeForge may include a backtesting system.

Possible future features:

- Upload candle data
- Test simple strategies
- Compare backtested results with live journal results
- Show backtest win rate
- Show backtest P/L
- Show backtest drawdown
- Show backtest R-multiple performance

Do not build this during the MVP stage.

## Future Copy Trading Features

Later, TradeForge may include a copy trading simulator or live copy trading system.

Do not build this during the MVP stage.

Important rule:

TradeForge should not send real trading orders until the journal MVP is complete and the system has been heavily tested.

## Development Rules

- Build one feature at a time.
- Keep the code simple and beginner-friendly.
- Do not overengineer.
- Do not add major libraries without asking first.
- Do not build live trading features yet.
- Do not build copy trading yet.
- Do not build backtesting yet.
- Prioritise a clean trading journal MVP first.
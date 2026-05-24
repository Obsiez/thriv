import type { GlossaryTerm } from '../types'

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Stock', definition: 'A share representing partial ownership in a corporation. When you buy stock, you own a slice of that company.' },
  { term: 'Ticker Symbol', definition: 'A short code (e.g., AAPL) used to identify a stock on an exchange.' },
  { term: 'Market Order', definition: 'An order to buy or sell immediately at the best available current price.' },
  { term: 'Limit Order', definition: 'An order to buy or sell only at a specified price or better. It may not fill if the market never reaches your price.' },
  { term: 'Portfolio', definition: 'The collection of all investments you hold, including cash and stocks.' },
  { term: 'P/E Ratio', definition: 'Price-to-earnings ratio: stock price divided by earnings per share. Often used to compare valuation.' },
  { term: 'Market Cap', definition: 'Total market value of a company\'s outstanding shares (price × shares outstanding).' },
  { term: 'Volume', definition: 'The number of shares traded during a given period. Higher volume often means more liquidity.' },
  { term: 'Bull Market', definition: 'A period when prices are generally rising and investor confidence is strong.' },
  { term: 'Bear Market', definition: 'A prolonged decline in stock prices, typically 20% or more from recent highs.' },
  { term: 'Dividend', definition: 'A portion of company profits paid to shareholders, usually on a regular schedule.' },
  { term: 'Diversification', definition: 'Spreading investments across sectors and assets to reduce risk from any single holding.' },
  { term: 'Volatility', definition: 'How much a stock\'s price moves up and down. Higher volatility means larger price swings.' },
  { term: 'Bid / Ask', definition: 'Bid is the highest price buyers offer; ask is the lowest price sellers accept. The spread is the difference.' },
  { term: 'Paper Trading', definition: 'Simulated trading with virtual money—no real financial risk. Thriv is a paper trading platform.' },
]

export const LESSONS = [
  {
    title: 'Start with a plan',
    body: 'Before placing trades, decide your goal (learning, long-term growth simulation) and how much virtual capital you are willing to risk in one position—many educators suggest no more than 10% in a single stock.',
  },
  {
    title: 'Understand market vs limit orders',
    body: 'Market orders execute quickly at the current simulated price. Limit orders give you price control but may not fill if the market moves away from your target.',
  },
  {
    title: 'Read the tape',
    body: 'Watch price charts and volume together. A price move on high volume often carries more significance than a move on thin trading.',
  },
  {
    title: 'Diversify across sectors',
    body: 'Thriv includes Technology, Healthcare, Finance, Energy, and more. Holding stocks across sectors can reduce the impact of one industry\'s downturn.',
  },
  {
    title: 'Track your performance',
    body: 'Use the Portfolio tab to review cost basis, unrealized gains, and order history. Reflect on why trades succeeded or failed—this is the core educational loop.',
  },
]

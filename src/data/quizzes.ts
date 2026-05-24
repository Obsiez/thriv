import type { QuizQuestion } from '../types'

export const BASICS_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What does buying a stock represent?',
    options: ['Lending money to the company', 'Partial ownership in the company', 'A guaranteed profit', 'A government bond'],
    correctIndex: 1,
    explanation: 'Stocks are equity — you own a small slice of the corporation.',
  },
  {
    id: 'q2',
    question: 'A market order will…',
    options: ['Execute at a price you set', 'Execute immediately at the best available price', 'Never fill', 'Only work after market close'],
    correctIndex: 1,
    explanation: 'Market orders prioritize speed over exact price.',
  },
  {
    id: 'q3',
    question: 'Diversification mainly helps to…',
    options: ['Maximize one stock\'s return', 'Reduce risk from any single investment', 'Avoid all losses', 'Eliminate taxes'],
    correctIndex: 1,
    explanation: 'Spreading across sectors limits damage if one area falls.',
  },
  {
    id: 'q4',
    question: 'P/E ratio compares stock price to…',
    options: ['Trading volume', 'Earnings per share', 'Dividend yield', 'Market cap only'],
    correctIndex: 1,
    explanation: 'Price ÷ earnings per share — a common valuation shortcut.',
  },
  {
    id: 'q5',
    question: 'Paper trading means…',
    options: ['Trading paper commodities', 'Simulated trading with virtual money', 'Illegal insider trading', 'Only trading bank stocks'],
    correctIndex: 1,
    explanation: 'Thriv is paper trading — learn without real financial risk.',
  },
  {
    id: 'q6',
    question: 'If a stock drops 10% then rises 10%, you are…',
    options: ['Back to even', 'Still down overall', 'Up 20%', 'At exactly zero'],
    correctIndex: 1,
    explanation: 'Percent changes compound. A 10% loss then 10% gain still leaves you below start.',
  },
]

export const ADVANCED_QUIZ: QuizQuestion[] = [
  {
    id: 'aq1',
    question: 'A limit buy at $50 when market is $52 will…',
    options: ['Fill immediately at $52', 'Wait until price ≤ $50', 'Always cancel', 'Sell your shares'],
    correctIndex: 1,
    explanation: 'Limit buys fill when the market reaches your price or better.',
  },
  {
    id: 'aq2',
    question: 'High trading volume often suggests…',
    options: ['No one is interested', 'More liquidity and activity', 'The stock is delisted', 'Guaranteed upward movement'],
    correctIndex: 1,
    explanation: 'Volume reflects how many shares change hands — often tied to liquidity.',
  },
  {
    id: 'aq3',
    question: 'Bear market typically means…',
    options: ['Prices broadly falling', 'Only energy stocks rise', 'Government shutdown', 'Zero volatility'],
    correctIndex: 0,
    explanation: 'Bear markets are extended periods of declining prices and pessimism.',
  },
  {
    id: 'aq4',
    question: 'Market cap equals…',
    options: ['Price × shares outstanding', 'Daily volume only', 'P/E × 100', 'Cash on hand'],
    correctIndex: 0,
    explanation: 'It\'s the total value the market assigns to all outstanding shares.',
  },
]

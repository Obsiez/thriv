import type { ScenarioDef } from '../types'

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'earnings-dip',
    title: 'Earnings Dip',
    context: 'AAPL dropped 6% ahead of earnings. Analysts are split. You hold no position. Virtual capital available.',
    symbol: 'AAPL',
    choices: [
      { id: 'buy', label: 'Buy the dip', feedback: 'Buying dips can work if fundamentals stay strong — but earnings risk remains. Good for learning entry timing.', xp: 25 },
      { id: 'wait', label: 'Wait for earnings', feedback: 'Patience reduces event risk. Many pros wait for clarity before sizing up.', xp: 30 },
      { id: 'short-sim', label: 'Avoid — too uncertain', feedback: 'Sitting out is valid. Not every move needs a trade; capital preservation matters.', xp: 20 },
    ],
  },
  {
    id: 'sector-rotation',
    title: 'Tech Selloff',
    context: 'NVDA fell 8% in one session on chip demand headlines. Your portfolio is 40% tech.',
    symbol: 'NVDA',
    choices: [
      { id: 'rebalance', label: 'Sell some tech, add Finance', feedback: 'Rebalancing after a run-up or selloff is a core diversification skill.', xp: 35 },
      { id: 'hold', label: 'Hold — long-term view', feedback: 'Holding through volatility teaches discipline, but concentration risk stays high.', xp: 20 },
      { id: 'add', label: 'Add more NVDA', feedback: 'Averaging down can help or hurt. Only add if your thesis is unchanged.', xp: 15 },
    ],
  },
  {
    id: 'dividend-play',
    title: 'Dividend Defender',
    context: 'JNJ is flat but pays ~3% dividend yield. Markets are choppy. You want stability practice.',
    symbol: 'JNJ',
    choices: [
      { id: 'buy-jnj', label: 'Buy JNJ for stability', feedback: 'Dividend stocks often behave differently in downturns — good for defensive practice.', xp: 30 },
      { id: 'tech', label: 'Skip — buy tech instead', feedback: 'Growth vs income is a classic trade-off. Tech may outperform but swings harder.', xp: 15 },
      { id: 'cash', label: 'Stay in cash', feedback: 'Cash is a position. Waiting for better entries is underrated.', xp: 25 },
    ],
  },
  {
    id: 'news-spike',
    title: 'Headline Spike',
    context: 'TSLA jumped 5% on delivery news. You already own shares at a lower cost basis.',
    symbol: 'TSLA',
    choices: [
      { id: 'trim', label: 'Sell half — lock gains', feedback: 'Taking partial profits teaches realized vs unrealized gains.', xp: 35 },
      { id: 'hold', label: 'Hold entire position', feedback: 'Letting winners run can work — but greed and fear both apply.', xp: 20 },
      { id: 'add', label: 'Buy more on momentum', feedback: 'Chasing spikes is risky. Momentum works until it doesn\'t.', xp: 10 },
    ],
  },
  {
    id: 'rate-scare',
    title: 'Rate Scare',
    context: 'JPM and V fell 3% on Fed commentary. Financials often move with rate expectations.',
    symbol: 'JPM',
    choices: [
      { id: 'buy-fin', label: 'Buy financials cheap', feedback: 'Value investors often buy sector weakness if the thesis is intact.', xp: 25 },
      { id: 'energy', label: 'Rotate to Energy (XOM)', feedback: 'Sector rotation is a real strategy when macro drivers shift.', xp: 30 },
      { id: 'wait', label: 'Do nothing', feedback: 'Macro events reward patience. Observation is a skill.', xp: 25 },
    ],
  },
]

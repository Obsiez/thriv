import type { MarketNews } from '../types'

const HEADLINES: Omit<MarketNews, 'id' | 'timestamp' | 'flash' | 'impactPct'>[] = [
  {
    headline: 'Tech giants lead market rally on AI optimism',
    summary: 'Major technology stocks climbed as investors weighed new AI product announcements and cloud revenue forecasts.',
    symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL'],
    sentiment: 'bullish',
  },
  {
    headline: 'Energy sector steady as oil prices hold range',
    summary: 'Exxon and Chevron shares traded flat while crude oil futures remained within a narrow band.',
    symbols: ['XOM', 'CVX'],
    sentiment: 'neutral',
  },
  {
    headline: 'Retail earnings beat expectations; consumer stocks rise',
    summary: 'Walmart reported stronger-than-expected same-store sales, lifting sentiment across consumer discretionary names.',
    symbols: ['WMT', 'AMZN', 'DIS'],
    sentiment: 'bullish',
  },
  {
    headline: 'Fed minutes hint at cautious rate path',
    summary: 'Financial stocks reacted to central bank commentary suggesting a measured approach to future policy decisions.',
    symbols: ['JPM', 'V'],
    sentiment: 'neutral',
  },
  {
    headline: 'Healthcare names mixed on policy headlines',
    summary: 'UnitedHealth and Johnson & Johnson moved in opposite directions amid regulatory discussion in Washington.',
    symbols: ['UNH', 'JNJ'],
    sentiment: 'neutral',
  },
  {
    headline: 'EV maker volatility continues after delivery data',
    summary: 'Tesla shares swung as traders parsed quarterly delivery figures against analyst consensus.',
    symbols: ['TSLA'],
    sentiment: 'bearish',
  },
  {
    headline: 'Semiconductor demand outlook lifts chip stocks',
    summary: 'AMD and NVIDIA gained on reports of strong data-center orders; Intel lagged peers.',
    symbols: ['AMD', 'NVDA', 'INTC'],
    sentiment: 'bullish',
  },
  {
    headline: 'Streaming wars: Netflix subscriber growth in focus',
    summary: 'Netflix led communication services higher while legacy media names traded sideways.',
    symbols: ['NFLX', 'DIS', 'META'],
    sentiment: 'bullish',
  },
]

const FLASH_HEADLINES: Omit<MarketNews, 'id' | 'timestamp'>[] = [
  {
    headline: 'BREAKING: Chip export rules shock semiconductor names',
    summary: 'Instant sell-off across hardware suppliers as traders price in supply-chain risk.',
    symbols: ['NVDA', 'AMD', 'INTC'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 5.8,
  },
  {
    headline: 'BREAKING: Mega-cap tech beats on cloud revenue',
    summary: 'Sharp bid in large-cap software as earnings surprise hits the tape.',
    symbols: ['MSFT', 'GOOGL', 'AAPL'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 4.6,
  },
  {
    headline: 'BREAKING: Oil spike lifts energy complex',
    summary: 'Crude futures jump; refiners and explorers reprice immediately.',
    symbols: ['XOM', 'CVX'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 4.2,
  },
  {
    headline: 'BREAKING: Consumer confidence miss hits retail',
    summary: 'Discretionary names fade as macro print disappoints.',
    symbols: ['AMZN', 'WMT', 'TSLA'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 4.8,
  },
  {
    headline: 'BREAKING: Payment network outage sparks volatility',
    summary: 'Financial infrastructure names whipsaw on operational headlines.',
    symbols: ['V', 'JPM'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 3.4,
  },
  {
    headline: 'BREAKING: FDA fast-track approval lifts pharma',
    summary: 'Healthcare leaders spike on breakthrough therapy headlines.',
    symbols: ['UNH', 'JNJ'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 3.8,
  },
  {
    headline: 'BREAKING: Airline safety review hits industrials',
    summary: 'Aerospace suppliers plunge as regulators announce expanded inspections.',
    symbols: ['BA', 'CAT'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 6.2,
  },
  {
    headline: 'BREAKING: Infrastructure bill boosts heavy equipment',
    summary: 'Industrial names surge on multi-year capex guidance from Washington.',
    symbols: ['CAT', 'BA'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 3.6,
  },
  {
    headline: 'BREAKING: EV battery recall whipsaws Tesla complex',
    summary: 'Electric vehicle names gap lower on supplier quality concerns.',
    symbols: ['TSLA', 'AMD'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 7.1,
  },
  {
    headline: 'BREAKING: Hyperscaler capex guide lifts AI basket',
    summary: 'Data-center spend outlook sends chip and cloud names sharply higher.',
    symbols: ['NVDA', 'AMD', 'MSFT'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 6.4,
  },
  {
    headline: 'BREAKING: Streaming subscriber miss hits media',
    summary: 'Communication services sell off as churn metrics disappoint.',
    symbols: ['NFLX', 'DIS', 'META'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 5.2,
  },
  {
    headline: 'BREAKING: Ad-market rebound lifts social platforms',
    summary: 'Digital ad spend data sparks short-covering in mega-cap social.',
    symbols: ['META', 'GOOGL', 'NFLX'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 4.9,
  },
  {
    headline: 'BREAKING: Credit card delinquencies rise — banks fade',
    summary: 'Consumer credit stress hits card networks and money-center banks.',
    symbols: ['JPM', 'V'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 4.4,
  },
  {
    headline: 'BREAKING: Dividend hike surprises energy majors',
    summary: 'Shareholder yield headlines lift integrated oil names in minutes.',
    symbols: ['XOM', 'CVX'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 3.2,
  },
  {
    headline: 'BREAKING: Antitrust headline hits big tech',
    summary: 'Regulatory overhang triggers fast money exit across platform names.',
    symbols: ['AAPL', 'GOOGL', 'META', 'AMZN'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 5.5,
  },
  {
    headline: 'BREAKING: Retail inventory build spooks consumer',
    summary: 'Big-box and e-commerce names gap down on margin warning.',
    symbols: ['WMT', 'AMZN'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 4.1,
  },
  {
    headline: 'BREAKING: Intel foundry win sparks sector rotation',
    summary: 'Legacy chip name rips higher; peers reprice on contract chatter.',
    symbols: ['INTC', 'AMD', 'NVDA'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 5.0,
  },
  {
    headline: 'BREAKING: Visa transaction volume beats — fintech bid',
    summary: 'Payments network prints strong spend data; financials follow.',
    symbols: ['V', 'JPM'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 3.5,
  },
  {
    headline: 'BREAKING: Boeing order cancellation hits aerospace',
    summary: 'Industrial aerospace complex sells off on fleet deferral headlines.',
    symbols: ['BA'],
    sentiment: 'bearish',
    flash: true,
    impactPct: 6.8,
  },
  {
    headline: 'BREAKING: Walmart raises guidance — consumer relief rally',
    summary: 'Defensive retail leads a broad bounce in consumer staples and discretionary.',
    symbols: ['WMT', 'DIS', 'AMZN'],
    sentiment: 'bullish',
    flash: true,
    impactPct: 4.0,
  },
]

let newsId = 0

export function generateNews(): MarketNews {
  const template = HEADLINES[Math.floor(Math.random() * HEADLINES.length)]
  return {
    ...template,
    id: `news-${++newsId}`,
    timestamp: Date.now(),
  }
}

export function generateFlashNews(): MarketNews {
  const template = FLASH_HEADLINES[Math.floor(Math.random() * FLASH_HEADLINES.length)]
  return {
    ...template,
    id: `flash-${++newsId}`,
    timestamp: Date.now(),
  }
}

export function getInitialNews(count = 6): MarketNews[] {
  return Array.from({ length: count }, () => generateNews()).sort(
    (a, b) => b.timestamp - a.timestamp
  )
}

/** Unpredictable flash interval: 2–10 minutes (ms). */
export function randomFlashDelayMs(): number {
  const min = 2 * 60 * 1000
  const max = 10 * 60 * 1000
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Centralized symbol mapping — backend (yfinance) symbols only

export const SYMBOL_MAP = {
  'RELIANCE.NS':   { display: 'Reliance Industries',   short: 'RELIANCE'    },
  'INFY.NS':       { display: 'Infosys',                short: 'INFY'        },
  'HDFCBANK.NS':   { display: 'HDFC Bank',              short: 'HDFCBANK'    },
  'MARUTI.NS':     { display: 'Maruti Suzuki',          short: 'MARUTI'      },
  'HINDUNILVR.NS': { display: 'Hindustan Unilever',     short: 'HINDUNILVR'  },
  '^NSEI':         { display: 'NIFTY 50',               short: 'NIFTY'       },
  '^BSESN':        { display: 'SENSEX',                 short: 'SENSEX'      },
}

export const ALL_SYMBOLS = Object.keys(SYMBOL_MAP)

export function getDisplayName(symbol) {
  return SYMBOL_MAP[symbol]?.display || symbol
}

export function getShortName(symbol) {
  return SYMBOL_MAP[symbol]?.short || symbol.replace('.NS', '').replace('^', '')
}

export function isValidSymbol(symbol) {
  return symbol in SYMBOL_MAP
}

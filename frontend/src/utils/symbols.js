// Centralized symbol mapping — all 27 supported symbols

export const SYMBOL_MAP = {
  // ── Indices ──────────────────────────────────────────────────────────────
  '^NSEI':         { display: 'NIFTY 50',               short: 'NIFTY',      sector: 'Index'         },
  '^BSESN':        { display: 'SENSEX',                  short: 'SENSEX',     sector: 'Index'         },
  // ── IT ───────────────────────────────────────────────────────────────────
  'TCS.NS':        { display: 'Tata Consultancy',        short: 'TCS',        sector: 'IT'            },
  'INFY.NS':       { display: 'Infosys',                 short: 'INFY',       sector: 'IT'            },
  'WIPRO.NS':      { display: 'Wipro',                   short: 'WIPRO',      sector: 'IT'            },
  'HCLTECH.NS':    { display: 'HCL Technologies',        short: 'HCLTECH',    sector: 'IT'            },
  'TECHM.NS':      { display: 'Tech Mahindra',           short: 'TECHM',      sector: 'IT'            },
  // ── Banking & Finance ─────────────────────────────────────────────────────
  'HDFCBANK.NS':   { display: 'HDFC Bank',               short: 'HDFCBANK',   sector: 'Banking'       },
  'ICICIBANK.NS':  { display: 'ICICI Bank',              short: 'ICICIBANK',  sector: 'Banking'       },
  'SBIN.NS':       { display: 'State Bank of India',     short: 'SBIN',       sector: 'Banking'       },
  'KOTAKBANK.NS':  { display: 'Kotak Mahindra Bank',     short: 'KOTAK',      sector: 'Banking'       },
  'AXISBANK.NS':   { display: 'Axis Bank',               short: 'AXISBANK',   sector: 'Banking'       },
  'BAJFINANCE.NS': { display: 'Bajaj Finance',           short: 'BAJFIN',     sector: 'Finance'       },
  // ── Energy & Utilities ────────────────────────────────────────────────────
  'RELIANCE.NS':   { display: 'Reliance Industries',     short: 'RELIANCE',   sector: 'Energy'        },
  'ONGC.NS':       { display: 'ONGC',                    short: 'ONGC',       sector: 'Energy'        },
  'NTPC.NS':       { display: 'NTPC',                    short: 'NTPC',       sector: 'Utilities'     },
  'POWERGRID.NS':  { display: 'Power Grid Corp',         short: 'POWERGRID',  sector: 'Utilities'     },
  // ── Auto ─────────────────────────────────────────────────────────────────
  'MARUTI.NS':     { display: 'Maruti Suzuki',           short: 'MARUTI',     sector: 'Auto'          },
  'BAJAJFINSV.NS': { display: 'Bajaj Finserv',           short: 'BAJAJFINSV', sector: 'Finance'       },
  'M&M.NS':        { display: 'Mahindra & Mahindra',     short: 'M&M',        sector: 'Auto'          },
  // ── FMCG ─────────────────────────────────────────────────────────────────
  'HINDUNILVR.NS': { display: 'Hindustan Unilever',      short: 'HUL',        sector: 'FMCG'          },
  'ITC.NS':        { display: 'ITC',                     short: 'ITC',        sector: 'FMCG'          },
  'NESTLEIND.NS':  { display: 'Nestle India',            short: 'NESTLE',     sector: 'FMCG'          },
  // ── Pharma ───────────────────────────────────────────────────────────────
  'SUNPHARMA.NS':  { display: 'Sun Pharmaceutical',      short: 'SUNPHARMA',  sector: 'Pharma'        },
  // ── Consumer ─────────────────────────────────────────────────────────────
  'TITAN.NS':      { display: 'Titan Company',           short: 'TITAN',      sector: 'Consumer'      },
  // ── Conglomerate ─────────────────────────────────────────────────────────
  'ADANIPORTS.NS': { display: 'Adani Ports',             short: 'ADANIPORTS', sector: 'Infrastructure'},
  'ADANIENT.NS':   { display: 'Adani Enterprises',       short: 'ADANIENT',   sector: 'Conglomerate'  },
}

export const ALL_SYMBOLS    = Object.keys(SYMBOL_MAP)
export const INDEX_SYMBOLS  = ALL_SYMBOLS.filter(s => s.startsWith('^'))
export const STOCK_SYMBOLS  = ALL_SYMBOLS.filter(s => !s.startsWith('^'))

// Sector groupings
export const SECTORS = [...new Set(Object.values(SYMBOL_MAP).map(v => v.sector))]

export function getSymbolsBySector(sector) {
  return ALL_SYMBOLS.filter(s => SYMBOL_MAP[s].sector === sector)
}

export function getDisplayName(symbol) {
  return SYMBOL_MAP[symbol]?.display || symbol
}

export function getShortName(symbol) {
  return SYMBOL_MAP[symbol]?.short || symbol.replace('.NS', '').replace('^', '')
}

export function getSector(symbol) {
  return SYMBOL_MAP[symbol]?.sector || 'Other'
}

export function isValidSymbol(symbol) {
  return symbol in SYMBOL_MAP
}

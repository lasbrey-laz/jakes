// Cryptocurrency conversion service using CoinGecko API
export interface CryptoRates {
  bitcoin: {
    usd: number;
    eur: number;
    gbp: number;
    cad: number;
    aud: number;
    jpy: number;
    cny: number;
    inr: number;
    brl: number;
    mxn: number;
    ngn: number;
    ghs: number;
    kes: number;
    zar: number;
    rub: number;
    try: number;
  };
  monero: {
    usd: number;
    eur: number;
    gbp: number;
    cad: number;
    aud: number;
    jpy: number;
    cny: number;
    inr: number;
    brl: number;
    mxn: number;
    ngn: number;
    ghs: number;
    kes: number;
    zar: number;
    rub: number;
    try: number;
  };
}

class CryptoConverter {
  private rates: CryptoRates | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getRates(): Promise<CryptoRates> {
    const now = Date.now();
    
    // Return cached rates if they're still valid
    if (this.rates && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.rates;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,monero&vs_currencies=usd,eur,gbp,cad,aud,jpy,cny,inr,brl,mxn,ngn,ghs,kes,zar,rub,try'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to match our interface
      this.rates = {
        bitcoin: {
          usd: data.bitcoin.usd || 0,
          eur: data.bitcoin.eur || 0,
          gbp: data.bitcoin.gbp || 0,
          cad: data.bitcoin.cad || 0,
          aud: data.bitcoin.aud || 0,
          jpy: data.bitcoin.jpy || 0,
          cny: data.bitcoin.cny || 0,
          inr: data.bitcoin.inr || 0,
          brl: data.bitcoin.brl || 0,
          mxn: data.bitcoin.mxn || 0,
          ngn: data.bitcoin.ngn || 0,
          ghs: data.bitcoin.ghs || 0,
          kes: data.bitcoin.kes || 0,
          zar: data.bitcoin.zar || 0,
          rub: data.bitcoin.rub || 0,
          try: data.bitcoin.try || 0,
        },
        monero: {
          usd: data.monero.usd || 0,
          eur: data.monero.eur || 0,
          gbp: data.monero.gbp || 0,
          cad: data.monero.cad || 0,
          aud: data.monero.aud || 0,
          jpy: data.monero.jpy || 0,
          cny: data.monero.cny || 0,
          inr: data.monero.inr || 0,
          brl: data.monero.brl || 0,
          mxn: data.monero.mxn || 0,
          ngn: data.monero.ngn || 0,
          ghs: data.monero.ghs || 0,
          kes: data.monero.kes || 0,
          zar: data.monero.zar || 0,
          rub: data.monero.rub || 0,
          try: data.monero.try || 0,
        }
      };

      this.lastFetch = now;
      return this.rates;
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      
      // Return fallback rates if API fails
      if (this.rates) {
        return this.rates;
      }
      
      // Return default rates as last resort
      return {
        bitcoin: {
          usd: 50000, eur: 45000, gbp: 40000, cad: 65000, aud: 75000,
          jpy: 7000000, cny: 350000, inr: 4000000, brl: 250000, mxn: 800000,
          ngn: 40000000, ghs: 600000, kes: 8000000, zar: 900000, rub: 4500000, try: 1500000
        },
        monero: {
          usd: 150, eur: 135, gbp: 120, cad: 195, aud: 225,
          jpy: 21000, cny: 1050, inr: 12000, brl: 750, mxn: 2400,
          ngn: 120000, ghs: 1800, kes: 24000, zar: 2700, rub: 13500, try: 4500
        }
      };
    }
  }

  // Convert currency amount to BTC
  async convertToBTC(amount: number, currency: keyof CryptoRates['bitcoin']): Promise<number> {
    const rates = await this.getRates();
    const rate = rates.bitcoin[currency];
    if (!rate || rate === 0) return 0;
    return amount / rate;
  }

  // Convert currency amount to XMR
  async convertToXMR(amount: number, currency: keyof CryptoRates['monero']): Promise<number> {
    const rates = await this.getRates();
    const rate = rates.monero[currency];
    if (!rate || rate === 0) return 0;
    return amount / rate;
  }

  // Convert BTC to currency
  async convertFromBTC(btcAmount: number, currency: keyof CryptoRates['bitcoin']): Promise<number> {
    const rates = await this.getRates();
    const rate = rates.bitcoin[currency];
    if (!rate || rate === 0) return 0;
    return btcAmount * rate;
  }

  // Convert XMR to currency
  async convertFromXMR(xmrAmount: number, currency: keyof CryptoRates['monero']): Promise<number> {
    const rates = await this.getRates();
    const rate = rates.monero[currency];
    if (!rate || rate === 0) return 0;
    return xmrAmount * rate;
  }

  // Get current rate for a specific currency pair
  async getRate(fromCrypto: 'bitcoin' | 'monero', toCurrency: string): Promise<number> {
    const rates = await this.getRates();
    const cryptoRates = rates[fromCrypto] as any;
    return cryptoRates[toCurrency.toLowerCase()] || 0;
  }

  // Format crypto amount with appropriate decimal places
  formatCryptoAmount(amount: number, crypto: 'BTC' | 'XMR'): string {
    if (crypto === 'BTC') {
      return amount.toFixed(8);
    } else if (crypto === 'XMR') {
      return amount.toFixed(12);
    }
    return amount.toString();
  }

  // Format currency amount
  formatCurrencyAmount(amount: number, currency: string): string {
    const currenciesWithDecimals: { [key: string]: number } = {
      'JPY': 0,
      'CNY': 2,
      'INR': 2,
      'BRL': 2,
      'MXN': 2,
      'NGN': 2,
      'GHS': 2,
      'KES': 2,
      'ZAR': 2,
      'RUB': 2,
      'TRY': 2,
      'USD': 2,
      'EUR': 2,
      'GBP': 2,
      'CAD': 2,
      'AUD': 2
    };

    const decimals = currenciesWithDecimals[currency.toUpperCase()] || 2;
    return amount.toFixed(decimals);
  }
}

export const cryptoConverter = new CryptoConverter();
export default cryptoConverter;

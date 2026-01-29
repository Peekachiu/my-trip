import https from 'https';

interface ExchangeRates {
    [currency: string]: number;
}

let ratesCache: { rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_TTL = 3600 * 1000; // 1 hour

export const fetchExchangeRates = async (base: string = 'USD'): Promise<ExchangeRates> => {
    // Check cache
    if (ratesCache && (Date.now() - ratesCache.timestamp < CACHE_TTL)) {
        return ratesCache.rates;
    }

    return new Promise((resolve, reject) => {
        const url = `https://api.exchangerate-api.com/v4/latest/${base}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    ratesCache = {
                        rates: parsed.rates,
                        timestamp: Date.now()
                    };
                    resolve(parsed.rates);
                } catch (e) {
                    reject(e);
                }
            });

        }).on('error', (err) => {
            reject(err);
        });
    });
};

export const convertCurrency = async (amount: number, from: string, to: string): Promise<{ convertedAmount: number; rate: number }> => {
    if (from === to) return { convertedAmount: amount, rate: 1.0 };

    // API is based on a specific base, usually USD or EUR. api.exchangerate-api.com/v4/latest/USD default.
    // However, if we fetch "latest/USD", we get rates relative to USD.
    // If we want from -> to, and we have rates vs USD:
    // rate(from->to) = rate(USD->to) / rate(USD->from)

    try {
        const rates = await fetchExchangeRates('USD');
        const rateTo = rates[to]; // USD -> TO
        const rateFrom = rates[from]; // USD -> FROM

        if (!rateTo || !rateFrom) throw new Error(`Currency not found: ${from} or ${to}`);

        const rate = rateTo / rateFrom;
        return {
            convertedAmount: amount * rate,
            rate: rate
        };

    } catch (error) {
        console.error('Currency conversion failed:', error);
        // Fallback or re-throw? For now fallback to 1:1 to prevent save failure, but log it.
        return { convertedAmount: amount, rate: 1.0 };
    }
};

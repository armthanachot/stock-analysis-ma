import { HistoricalOptionsEventsHistory } from "yahoo-finance2/dist/esm/src/modules/historical";
import { getStockPrice } from "./financial";
import { EMA, MACD, RSI } from "technicalindicators";
import { Tool } from 'openai/resources/responses/responses';

// Interface สำหรับ Support/Resistance levels
interface SupportResistanceLevel {
    level: number;
    strength: number; // 1-10 (จำนวนครั้งที่ทดสอบ level นี้)
    type: 'support' | 'resistance';
    lastTested: number; // index ของ candle ที่ทดสอบล่าสุด
}

interface TechnicalAnalysisResult {
    rsi: {
        current: number;
        signal: 'oversold' | 'overbought' | 'neutral';
    };
    ema: {
        ema20: number;
        ema50: number;
        ema100: number;
        ema200: number;
        trend: 'bullish' | 'bearish' | 'neutral';
    };
    macd: {
        macd: number;
        signal: number;
        histogram: number;
        trend: 'bullish' | 'bearish' | 'neutral';
    };
    supportResistance: {
        support: SupportResistanceLevel[];
        resistance: SupportResistanceLevel[];
        nearestSupport: number | null;
        nearestResistance: number | null;
    };
    currentPrice: number;
    trend: {
        shortTerm: 'bullish' | 'bearish' | 'neutral';
        mediumTerm: 'bullish' | 'bearish' | 'neutral';
        longTerm: 'bullish' | 'bearish' | 'neutral';
    };
}

const calculateSupportResistance = (
    highs: number[], 
    lows: number[], 
    closes: number[], 
    lookback: number = 20,
    minTouchCount: number = 2
): { support: SupportResistanceLevel[], resistance: SupportResistanceLevel[], nearestSupport: number | null, nearestResistance: number | null } => {
    
    const currentPrice = closes[closes.length - 1];
    const supportLevels: SupportResistanceLevel[] = [];
    const resistanceLevels: SupportResistanceLevel[] = [];
    
    // หา Local Highs และ Local Lows
    const localHighs: { index: number, value: number }[] = [];
    const localLows: { index: number, value: number }[] = [];
    
    for (let i = lookback; i < highs.length - lookback; i++) {
        // Local High: ราคาสูงกว่าทั้งซ้ายและขวา
        let isLocalHigh = true;
        for (let j = i - lookback; j <= i + lookback; j++) {
            if (j !== i && highs[j] >= highs[i]) {
                isLocalHigh = false;
                break;
            }
        }
        if (isLocalHigh) {
            localHighs.push({ index: i, value: highs[i] });
        }
        
        // Local Low: ราคาต่ำกว่าทั้งซ้ายและขวา
        let isLocalLow = true;
        for (let j = i - lookback; j <= i + lookback; j++) {
            if (j !== i && lows[j] <= lows[i]) {
                isLocalLow = false;
                break;
            }
        }
        if (isLocalLow) {
            localLows.push({ index: i, value: lows[i] });
        }
    }
    
    // Group ระดับราคาที่ใกล้เคียงกัน (ภายใน 2% ของราคา)
    const tolerance = currentPrice * 0.02; // 2% tolerance
    
    // สร้าง Resistance levels จาก Local Highs
    const resistanceGroups: { level: number, indices: number[], strength: number }[] = [];
    
    for (const high of localHighs) {
        let foundGroup = false;
        for (const group of resistanceGroups) {
            if (Math.abs(high.value - group.level) <= tolerance) {
                group.indices.push(high.index);
                group.strength++;
                group.level = (group.level * (group.strength - 1) + high.value) / group.strength; // Average price
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            resistanceGroups.push({
                level: high.value,
                indices: [high.index],
                strength: 1
            });
        }
    }
    
    // สร้าง Support levels จาก Local Lows
    const supportGroups: { level: number, indices: number[], strength: number }[] = [];
    
    for (const low of localLows) {
        let foundGroup = false;
        for (const group of supportGroups) {
            if (Math.abs(low.value - group.level) <= tolerance) {
                group.indices.push(low.index);
                group.strength++;
                group.level = (group.level * (group.strength - 1) + low.value) / group.strength; // Average price
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            supportGroups.push({
                level: low.value,
                indices: [low.index],
                strength: 1
            });
        }
    }
    
    // Filter และ Sort resistance levels
    resistanceGroups
        .filter(group => group.strength >= minTouchCount && group.level > currentPrice)
        .sort((a, b) => Math.abs(a.level - currentPrice) - Math.abs(b.level - currentPrice))
        .forEach(group => {
            resistanceLevels.push({
                level: group.level,
                strength: Math.min(group.strength, 10),
                type: 'resistance',
                lastTested: Math.max(...group.indices)
            });
        });
    
    // Filter และ Sort support levels  
    supportGroups
        .filter(group => group.strength >= minTouchCount && group.level < currentPrice)
        .sort((a, b) => Math.abs(a.level - currentPrice) - Math.abs(b.level - currentPrice))
        .forEach(group => {
            supportLevels.push({
                level: group.level,
                strength: Math.min(group.strength, 10),
                type: 'support',
                lastTested: Math.max(...group.indices)
            });
        });
    
    // หา nearest support และ resistance
    const nearestSupport = supportLevels.length > 0 ? supportLevels[0].level : null;
    const nearestResistance = resistanceLevels.length > 0 ? resistanceLevels[0].level : null;
    
    return {
        support: supportLevels.slice(0, 5), // เอาแค่ 5 levels ที่ใกล้ที่สุด
        resistance: resistanceLevels.slice(0, 5),
        nearestSupport,
        nearestResistance
    };
};

const determineTrend = (closes: number[], ema20: number[], ema50: number[], ema200: number[]): {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    mediumTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
} => {
    const currentClose = closes[closes.length - 1];
    const currentEMA20 = ema20[ema20.length - 1];
    const currentEMA50 = ema50[ema50.length - 1];
    const currentEMA200 = ema200[ema200.length - 1];
    
    // Check if we have valid data
    if (!currentClose || !currentEMA20 || !currentEMA50 || !currentEMA200) {
        return { shortTerm: 'neutral', mediumTerm: 'neutral', longTerm: 'neutral' };
    }
    
    // Short-term trend (price vs EMA20)
    const shortTerm: 'bullish' | 'bearish' | 'neutral' = currentClose > currentEMA20 ? 'bullish' : 'bearish';
    
    // Medium-term trend (EMA20 vs EMA50)
    const mediumTerm: 'bullish' | 'bearish' | 'neutral' = currentEMA20 > currentEMA50 ? 'bullish' : 'bearish';
    
    // Long-term trend (price vs EMA200)
    const longTerm: 'bullish' | 'bearish' | 'neutral' = currentClose > currentEMA200 ? 'bullish' : 'bearish';
    
    return { shortTerm, mediumTerm, longTerm };
};

export const getStockTechnical = async (symbol: string, option: HistoricalOptionsEventsHistory): Promise<TechnicalAnalysisResult> => {
    const price = await getStockPrice(symbol, option);

    const closePrices = price.quotes.map((quote) => quote.close).filter(Boolean) as number[];
    const highPrices = price.quotes.map((quote) => quote.high).filter(Boolean) as number[];
    const lowPrices = price.quotes.map((quote) => quote.low).filter(Boolean) as number[];

    if (closePrices.length === 0) {
        throw new Error('No price data available');
    }

    const rsi = RSI.calculate({ period: 14, values: closePrices });
    const EMA20 = EMA.calculate({ period: 20, values: closePrices });
    const EMA50 = EMA.calculate({ period: 50, values: closePrices });
    const EMA100 = EMA.calculate({ period: 100, values: closePrices });
    const EMA200 = EMA.calculate({ period: 200, values: closePrices });

    const MACD26_9 = MACD.calculate({
        values: closePrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    });

    // คำนวณ Support/Resistance
    const supportResistance = calculateSupportResistance(
        highPrices, 
        lowPrices, 
        closePrices, 
        10, // lookback period
        2   // minimum touch count
    );

    // วิเคราะห์ trend
    const trend = determineTrend(closePrices, EMA20, EMA50, EMA200);

    // Current values
    const currentRSI = rsi[rsi.length - 1];
    const currentMACD = MACD26_9[MACD26_9.length - 1];
    const currentPrice = closePrices[closePrices.length - 1];

    // Validate required data
    if (!currentRSI || !currentMACD || !currentPrice) {
        throw new Error('Insufficient data for technical analysis');
    }

    // RSI signals
    const getRSISignal = (rsiValue: number) => {
        if (rsiValue > 70) return 'overbought';
        if (rsiValue < 30) return 'oversold';
        return 'neutral';
    };

    // EMA trend analysis
    const getEMATrend = () => {
        const current20 = EMA20[EMA20.length - 1];
        const current50 = EMA50[EMA50.length - 1];
        const current200 = EMA200[EMA200.length - 1];
        
        if (!current20 || !current50 || !current200) return 'neutral';
        
        if (current20 > current50 && current50 > current200 && currentPrice > current20) {
            return 'bullish';
        } else if (current20 < current50 && current50 < current200 && currentPrice < current20) {
            return 'bearish';
        }
        return 'neutral';
    };

    // MACD trend analysis
    const getMACDTrend = () => {
        if (!currentMACD || 
            typeof currentMACD.MACD !== 'number' || 
            typeof currentMACD.signal !== 'number' || 
            typeof currentMACD.histogram !== 'number') {
            return 'neutral';
        }
        
        if (currentMACD.MACD > currentMACD.signal && currentMACD.histogram > 0) {
            return 'bullish';
        } else if (currentMACD.MACD < currentMACD.signal && currentMACD.histogram < 0) {
            return 'bearish';
        }
        return 'neutral';
    };

    return {
        rsi: {
            current: currentRSI,
            signal: getRSISignal(currentRSI)
        },
        ema: {
            ema20: EMA20[EMA20.length - 1] || 0,
            ema50: EMA50[EMA50.length - 1] || 0,
            ema100: EMA100[EMA100.length - 1] || 0,
            ema200: EMA200[EMA200.length - 1] || 0,
            trend: getEMATrend()
        },
        macd: {
            macd: currentMACD?.MACD || 0,
            signal: currentMACD?.signal || 0,
            histogram: currentMACD?.histogram || 0,
            trend: getMACDTrend()
        },
        supportResistance,
        currentPrice,
        trend
    };
};

export const technicalTools: Array<Tool> = [
    {
        strict: true,
        type: "function",
        name: "getStockTechnical",
        description: "Calculate comprehensive technical analysis including RSI, EMA, MACD, support/resistance levels, and trend analysis for a given stock symbol",
        parameters: {
            type: "object",
            properties: {
                symbol: {
                    type: "string",
                    description: "The symbol of the stock to analyze (e.g., AAPL, NVDA)",
                },
                option: {
                    type: "object",
                    description: "Historical data options for technical analysis",
                    properties: {
                        period1: {
                            type: "string",
                            description: "Start date for historical data (ISO string or Date)",
                        },
                        period2: {
                            type: "string", 
                            description: "End date for historical data (ISO string or Date)",
                        },
                        interval: {
                            type: "string",
                            description: "Data interval: 1d for short-term, 1wk for medium-term, 1mo for long-term analysis",
                            enum: ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
                        },
                    },
                    required: ["period1", "period2", "interval"],
                    additionalProperties: false,
                },
            },
            required: ["symbol", "option"],
            additionalProperties: false,
        },
    },
];

console.log(await getStockTechnical("NVDA",{
    period1: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString(),
    period2: new Date().toISOString(),
    interval: "1wk"
}));

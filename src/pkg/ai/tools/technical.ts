import { HistoricalOptionsEventsHistory } from "yahoo-finance2/dist/esm/src/modules/historical";
import { getStockPrice } from "./financial";
import { EMA, MACD, RSI } from "technicalindicators";

export const getStockTechinical = async (symbol: string, option: HistoricalOptionsEventsHistory) =>{
    const price = await getStockPrice(symbol, option)

    const closePrices = price.quotes.map((quote) => quote.close).filter(Boolean) as number[];
    const highPrices = price.quotes.map((quote) => quote.high).filter(Boolean) as number[];
    const lowPrices = price.quotes.map((quote) => quote.low).filter(Boolean) as number[];

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
}
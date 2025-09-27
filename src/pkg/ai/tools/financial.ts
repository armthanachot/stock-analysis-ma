import { Tool } from 'openai/resources/responses/responses';
import yahooFinance from 'yahoo-finance2';
import { HistoricalOptionsEventsHistory } from 'yahoo-finance2/dist/esm/src/modules/historical';
import { SearchOptions } from 'yahoo-finance2/dist/esm/src/modules/search';

export const getStockPrice = async (symbol: string, option: HistoricalOptionsEventsHistory) => {
    option.period1 = option.period1 || new Date(new Date().setFullYear(new Date().getFullYear() - 5))
    option.period2 = option.period2 || new Date().toISOString()
    option.interval = option.interval || '1wk'
    const price = await yahooFinance.chart(symbol, option);
    return price
}

export const getStockNews = async (symbol: string, option: SearchOptions) => {
    const { news } = await yahooFinance.search(symbol, option)
    return news
}

export const getStockInsight = async (symbol: string) => {
    const period1 = new Date(new Date().setFullYear(new Date().getFullYear() - 5))
    const period2 = new Date().toISOString()
    const allQuarterlyData = await yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: period1,
        period2: period2,
        type: "quarterly",
        module: "all" //balance-sheet, financials, income-statement, cash-flow
    })

    const allAnnualData = await yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: period1,
        period2: period2,
        type: "annual",
        module: "all"
    })

    const analysis = await yahooFinance.insights(symbol)
    return {
        instrumentInfo: analysis.instrumentInfo,
        recommendation: analysis.recommendation,
        upsell: analysis.upsell,
        reports: analysis.reports,
        sigDevs: analysis.sigDevs,
        secReports: analysis.secReports,
        allQuarterlyData: allQuarterlyData,
        allAnnualData: allAnnualData
    }
}

export const financialTools: Array<Tool> = [
    {
        strict: true,
        type: "function",
        name: "getStockPrice",
        description: "Get stock price data for a given symbol based on options (period1, period2, interval) from yahoo finance. For short-term analysis use 1d interval, for medium to long-term analysis use 1wk or higher",
        parameters: {
            type: "object",
            properties: {
                symbol: {
                    type: "string",
                    description: "The symbol of the stock to get the price for",
                },
                option: {
                    type: "object",
                    description: "The options for the price",
                    properties: {
                        period1: {
                            type: "string",
                            description: "The start date for the price",
                        },
                        period2: {
                            type: "string",
                            description: "The end date for the price",
                        },
                        interval: {
                            type: "string",
                            description: "The interval for the price",
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
    {
        strict: true,
        type: "function",
        name: "getStockNews",
        description: "Get stock news for a given symbol based on options (newsCount) from yahoo finance data source",
        parameters: {
            type: "object",
            properties: {
                symbol: {
                    type: "string",
                    description: "The symbol of the stock to get the news for",
                },
                option: {
                    type: "object",
                    description: "The options for the news",
                    properties: {
                        newsCount: {
                            type: "number",
                            description: "The number of news to get",
                        },
                    },
                    required: ["newsCount"],
                    additionalProperties: false,
                },
            },
            required: ["symbol", "option"],
            additionalProperties: false,
        },
    },
    {
        strict: true,
        type: "function",
        name: "getStockInsight",
        description: "Get comprehensive stock insights and financial data for a given symbol from yahoo finance covering 5 years of historical data up to present",
        parameters: {
            type: "object",
            properties: {
                symbol: {
                    type: "string",
                    description: "The symbol of the stock to get the insight for",
                },
            },
            required: ["symbol"],
            additionalProperties: false,
        },
    },
]
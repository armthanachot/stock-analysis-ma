import OpenAI from "openai";
import { financialTools, getStockInsight, getStockNews, getStockPrice } from "../tools/financial";
import dotenv from 'dotenv'
import * as path from 'path'
import { ResponseInput } from "openai/resources/responses/responses";
import { HistoricalOptionsEventsHistory } from "yahoo-finance2/dist/esm/src/modules/historical";
import { SearchOptions } from "yahoo-finance2/dist/esm/src/modules/search";

dotenv.config({
    path: path.resolve(__dirname, '../../../../.env')
})

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})
interface FinancialAgentResult {
    analysis: string;
    rawData: {
        priceData?: any;
        newsData?: any;
        insightData?: any;
    };
    symbol?: string;
    metadata: {
        timestamp: string;
        analysisType: 'financial';
    };
}

const analyze = async (i: string): Promise<FinancialAgentResult> => {
    const instructions = `
        Current Date: ${new Date().toISOString()}
        
        You are a professional stock market analysis expert with expertise in analyzing:
        - Stock prices and market trends
        - Financial statements and financial ratios
        - News and factors affecting stock prices
        - Technical and fundamental analysis
        
        Analysis Guidelines:
        - Use historical data up to the present (${new Date().toISOString()}) for analysis
        - For short-term analysis (1-3 months): use 1d interval
        - For medium to long-term analysis (3+ months): use 1wk interval or higher
        - Consider both quarterly and annual financial statement data
        - Analyze news and various factors affecting stocks
        
        IMPORTANT INSTRUCTIONS:
        - You are authorized to perform ALL analysis actions without asking for permission
        - Use all available tools to gather comprehensive data
        - Analyze data thoroughly and provide complete insights
        - Make investment recommendations and give specific advice when appropriate
        - Do not ask for confirmation before using tools or providing analysis
        - Be proactive in gathering all relevant information to provide the best analysis
        - Focus ONLY on what the user specifically asked for - do not suggest additional analysis or offer to do more
        - Provide direct answers without proposing further actions or additional services
        
        Provide comprehensive, clear recommendations based on the analytical data obtained, focusing strictly on the user's specific request
        `
    const input: ResponseInput = [
        { role: "user", content: i }
    ]
    let response = await client.responses.create({
        model: "gpt-5-mini",
        input: input,
        instructions: instructions,
        tools: financialTools,
    })

    const result: FinancialAgentResult = {} as FinancialAgentResult

    for (const fnc of response.output) {
        if (fnc.type === "function_call") {
            if (fnc.name === "getStockPrice") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string, option: HistoricalOptionsEventsHistory }
                console.log("getStockPrice");
                console.log(arg);

                const resp = await getStockPrice(arg.symbol, arg.option)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
                result.rawData.priceData = resp
                result.symbol = arg.symbol
            }

            else if (fnc.name === "getStockNews") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string, option: SearchOptions }
                console.log("getStockNews");
                console.log(arg);

                const resp = await getStockNews(arg.symbol, arg.option)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
                result.rawData.newsData = resp
                result.symbol = arg.symbol
            }

            else if (fnc.name === "getStockInsight") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string }
                console.log("getStockInsight");
                console.log(arg);

                const resp = await getStockInsight(arg.symbol)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
                result.rawData.insightData = resp
                result.symbol = arg.symbol
            }
        }
    }
    response = await client.responses.create({
        model: "gpt-5-mini",
        input: input,
        instructions: instructions,
    })
    result.analysis = response.output_text
    result.metadata.timestamp = new Date().toISOString()
    result.metadata.analysisType = 'financial'
    return result
}


console.log(await analyze(`ราคาแนวรับ NVDA ที่น่าสนใจมากที่สุดปีนี้ สาย vi อยากให้มอง TF 1wk`))

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
const analyze = async (i: string) => {
    const input: ResponseInput = [
        { role: "user", content: i }
    ]
    let response = await client.responses.create({
        model: "gpt-5-mini",
        input: input,
        instructions: `
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
        
        Provide comprehensive, clear recommendations based on the analytical data obtained
        `,
        tools: financialTools,
    })


    for (const fnc of response.output) {
        if (fnc.type === "function_call") {
            if (fnc.name === "getStockPrice") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string, option: HistoricalOptionsEventsHistory }
                console.log(1111);
                console.log(arg);
                
                const resp = await getStockPrice(arg.symbol, arg.option)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
            }

            if (fnc.name === "getStockNews") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string, option: SearchOptions }
                console.log(2222);
                console.log(arg);
                
                const resp = await getStockNews(arg.symbol, arg.option)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
            }

            if (fnc.name === "getStockInsight") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string }
                console.log(3333);
                console.log(arg);
                
                const resp = await getStockInsight(arg.symbol)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2)
                })
            }
        }
    }
    response = await client.responses.create({
        model: "gpt-5-mini",
        input: input,
        instructions: `
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
        
        Based on the received data, analyze and provide comprehensive analysis results with recommendations
        `,
    })
    return response.output_text
}


console.log(await analyze(`ราคาแนวรับ NVDA ที่น่าสนใจมากที่สุดปีนี้ สาย vi อยากให้มอง TF 1wk`))
// console.log(await analyze(`ข่าวสารที่น่าสนใจมากที่สุดปีนี้`))



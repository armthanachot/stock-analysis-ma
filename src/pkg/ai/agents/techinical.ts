import OpenAI from "openai";
import dotenv from 'dotenv'
import * as path from 'path'
import { financialTools, getStockInsight, getStockNews, getStockPrice } from "../tools/financial";
import { HistoricalOptionsEventsHistory } from "yahoo-finance2/dist/esm/src/modules/historical";
import { SearchOptions } from "yahoo-finance2/dist/esm/src/modules/search";
import { getStockTechnical, technicalTools } from "../tools/technical";
import { ResponseInput } from "openai/resources/responses/responses";

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
    const resp = await client.responses.create({
        model: "gpt-5",
        instructions:`
            use get_stock_indicators to calculate the technical indicators.
            for support and resistance, the mcp may provide responses, but it's important to verify these prices to ensure accuracy.
        `,
        tools: [
            {
                type: "mcp",
                server_label:"stock-indicators",
                server_description:"A stock indicators server to assist with technical analysis.",
                server_url:`https://cfd08810db1e.ngrok-free.app/sse`,
                require_approval:"never",
            }
        ],
        input: input,
    });

    console.log(JSON.stringify(resp, null, 2));
    // console.log(JSON.stringify(resp.usage, null, 2));
    

    return resp.output_text
}


console.log(await analyze("ema 20, 50, 100, 200 | RSI | MACD | support and resistance (3 point each of them) of NVDA, TF: 1wk"));

// console.log(await analyze("Get History data of NVDA, TF: 1wk, on year 2024 - 2025"));

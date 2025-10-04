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
            use the provided getStockPrice to get history data.
            and use getStockTechnical to calculate the technical indicators.
            for support and resistance, the tools may provide responses, but it's important to verify these prices to ensure accuracy.
        `,
        tools: [
            ...financialTools,
            ...technicalTools,
        ],
        input: input,
    });

    const functionCalls: Array<{ name: string, arguments: string }> = [];
    for (const fnc of resp.output) {
        if (fnc.type === "function_call") {
            functionCalls.push({
                name: fnc.name,
                arguments: fnc.arguments
            });
        }
    }

    const promises = functionCalls.map(async (fnc) => {
        console.log(`Calling ${fnc.name}`);

        if (fnc.name === "getStockPrice") {
            const arg = JSON.parse(fnc.arguments) as { symbol: string, option: HistoricalOptionsEventsHistory }
            const resp = await getStockPrice(arg.symbol, arg.option);
            return { name: fnc.name, result: resp };
        }

        else if (fnc.name === "getStockTechnical") {
            const arg = JSON.parse(fnc.arguments) as { symbol: string, option: HistoricalOptionsEventsHistory }
            const resp = await getStockTechnical(arg.symbol, arg.option);
            return { name: fnc.name, result: resp };
        }

        return null;
    });

    const results = await Promise.all(promises.filter(Boolean));

    for (const result of results) {
        if (result) {
            input.push({
                role: "assistant",
                content: JSON.stringify(result.result, null, 2)
            });
        }
    }

    const finalResp = await client.responses.create({
        model: "gpt-5",
        input: input,
    });

    console.log(JSON.stringify(finalResp, null, 2));
    console.log();
    console.log();
    console.log();
    
    console.log(JSON.stringify(finalResp.usage, null, 2));
    

    return finalResp.output_text
}


console.log(await analyze("ema 20, 50, 100, 200 | RSI | MACD | support and resistance (3 point each of them) of NVDA, TF: 1wk"));

// console.log(await analyze("Get History data of NVDA, TF: 1wk, on year 2024 - 2025"));

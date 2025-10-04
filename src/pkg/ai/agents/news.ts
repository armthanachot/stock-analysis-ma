import OpenAI from "openai";
import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({
    path: path.resolve(__dirname, '../../../../.env')
})

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})


const analyze = async (i: string) => {
    const resp = await client.responses.create({
        model: "gpt-5",
        tools: [
            {
                type: "mcp",
                server_label: "alpha-vantage",
                server_description: "A Alpha Vantage MCP server to assist with stock news.",
                server_url: `https://mcp.alphavantage.co/mcp?apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
                require_approval: "never",
            },
        ],
        input: i,
    });

    // console.log(JSON.stringify(resp, null, 2));

    // console.log(resp.usage);

    return resp.output_text
}


// console.log(await analyze("สรุปข่าวเศรษฐกิจของสหรัฐทั้งหมดตอนนี้, แล้วรวมถึงสถานการตลาดหุ้น, แล้วช่วงนี้ หุ้นไหนที่เป็นกระแสดี และมีคุณภาพที่ดี บ้าง จากข่าวทั้งหมด"));
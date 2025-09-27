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

const responseSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        analysis: {
            type: "object",
            additionalProperties: false,
            properties: {
                summary: { type: "string" },
                recommendation: { type: "string", enum: ["BUY", "SELL", "HOLD", "STRONG_BUY", "STRONG_SELL"] },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                targetPrice: { type: ["number", "null"] },
                timeframe: { type: "string", enum: ["short_term", "medium_term", "long_term"] },
                keyInsights: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "recommendation", "confidence", "targetPrice", "timeframe", "keyInsights", "risks", "opportunities"]
        },
        priceAnalysis: {
            type: "object",
            additionalProperties: false,
            properties: {
                currentPrice: { type: ["number", "null"] },
                priceChange: { type: ["number", "null"] },
                priceChangePercent: { type: ["number", "null"] },
                dayRange: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        low: { type: ["number", "null"] },
                        high: { type: ["number", "null"] }
                    },
                    required: ["low", "high"]
                },
                volume: { type: ["number", "null"] },
                avgVolume: { type: ["number", "null"] }
            },
            required: ["currentPrice", "priceChange", "priceChangePercent", "dayRange", "volume", "avgVolume"]
        },
        technicalAnalysis: {
            type: "object",
            additionalProperties: false,
            properties: {
                trend: { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
                shortTermOutlook: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        direction: { type: "string", enum: ["Bullish", "Bearish", "Neutral"] },
                        score: { type: "number" },
                        description: { type: "string" }
                    },
                    required: ["direction", "score", "description"]
                },
                intermediateTermOutlook: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        direction: { type: "string", enum: ["Bullish", "Bearish", "Neutral"] },
                        score: { type: "number" },
                        description: { type: "string" }
                    },
                    required: ["direction", "score", "description"]
                },
                longTermOutlook: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        direction: { type: "string", enum: ["Bullish", "Bearish", "Neutral"] },
                        score: { type: "number" },
                        description: { type: "string" }
                    },
                    required: ["direction", "score", "description"]
                },
                keyLevels: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        support: { type: ["number", "null"] },
                        resistance: { type: ["number", "null"] },
                        stopLoss: { type: ["number", "null"] }
                    },
                    required: ["support", "resistance", "stopLoss"]
                },
                valuation: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        description: { type: "string" },
                        discount: { type: "string" },
                        color: { type: "number" }
                    },
                    required: ["description", "discount", "color"]
                }
            },
            required: ["trend", "shortTermOutlook", "intermediateTermOutlook", "longTermOutlook", "keyLevels", "valuation"]
        },
        fundamentalAnalysis: {
            type: "object",
            additionalProperties: false,
            properties: {
                valuation: { type: "string", enum: ["OVERVALUED", "FAIRLY_VALUED", "UNDERVALUED", "UNKNOWN"] },
                financialStrength: { type: "string", enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "WEAK", "UNKNOWN"] },
                growthProspects: { type: "string", enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "WEAK", "UNKNOWN"] },
                keyMetrics: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        marketCap: { type: ["number", "null"] },
                        peRatio: { type: ["number", "null"] },
                        eps: { type: ["number", "null"] },
                        basicEPS: { type: ["number", "null"] },
                        dilutedEPS: { type: ["number", "null"] },
                        totalRevenue: { type: ["number", "null"] },
                        revenueGrowth: { type: ["number", "null"] },
                        operatingIncome: { type: ["number", "null"] },
                        netIncome: { type: ["number", "null"] },
                        grossProfit: { type: ["number", "null"] },
                        profitMargin: { type: ["number", "null"] },
                        operatingMargin: { type: ["number", "null"] },
                        totalDebt: { type: ["number", "null"] },
                        totalEquity: { type: ["number", "null"] },
                        debtToEquity: { type: ["number", "null"] },
                        currentRatio: { type: ["number", "null"] },
                        freeCashFlow: { type: ["number", "null"] },
                        ebitda: { type: ["number", "null"] }
                    },
                    required: ["marketCap", "peRatio", "eps", "basicEPS", "dilutedEPS", "totalRevenue", "revenueGrowth", "operatingIncome", "netIncome", "grossProfit", "profitMargin", "operatingMargin", "totalDebt", "totalEquity", "debtToEquity", "currentRatio", "freeCashFlow", "ebitda"]
                },
                recentQuarterlyData: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            date: { type: "string" },
                            totalRevenue: { type: ["number", "null"] },
                            operatingIncome: { type: ["number", "null"] },
                            netIncome: { type: ["number", "null"] },
                            basicEPS: { type: ["number", "null"] },
                            dilutedEPS: { type: ["number", "null"] },
                            grossProfit: { type: ["number", "null"] }
                        },
                        required: ["date", "totalRevenue", "operatingIncome", "netIncome", "basicEPS", "dilutedEPS", "grossProfit"]
                    }
                },
                balanceSheetHighlights: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        totalAssets: { type: ["number", "null"] },
                        totalLiabilities: { type: ["number", "null"] },
                        stockholdersEquity: { type: ["number", "null"] },
                        cashAndEquivalents: { type: ["number", "null"] },
                        inventory: { type: ["number", "null"] },
                        accountsReceivable: { type: ["number", "null"] }
                    },
                    required: ["totalAssets", "totalLiabilities", "stockholdersEquity", "cashAndEquivalents", "inventory", "accountsReceivable"]
                }
            },
            required: ["valuation", "financialStrength", "growthProspects", "keyMetrics", "recentQuarterlyData", "balanceSheetHighlights"]
        },
        analystInsights: {
            type: "object",
            additionalProperties: false,
            properties: {
                overallRecommendation: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        rating: { type: "string" },
                        targetPrice: { type: ["number", "null"] },
                        provider: { type: "string" }
                    },
                    required: ["rating", "targetPrice", "provider"]
                },
                reports: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            title: { type: "string" },
                            provider: { type: "string" },
                            reportDate: { type: "string" },
                            investmentRating: { type: "string" },
                            targetPrice: { type: ["number", "null"] }
                        },
                        required: ["title", "provider", "reportDate", "investmentRating", "targetPrice"]
                    }
                },
                bullishFactors: { type: "array", items: { type: "string" } },
                bearishFactors: { type: "array", items: { type: "string" } }
            },
            required: ["overallRecommendation", "reports", "bullishFactors", "bearishFactors"]
        },
        newsAnalysis: {
            type: "object",
            additionalProperties: false,
            properties: {
                sentiment: { type: "string", enum: ["VERY_POSITIVE", "POSITIVE", "NEUTRAL", "NEGATIVE", "VERY_NEGATIVE"] },
                keyNews: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            impact: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                            sentiment: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
                            publishedDate: { type: "string" }
                        },
                        required: ["title", "summary", "impact", "sentiment", "publishedDate"]
                    }
                },
                significantDevelopments: { type: "array", items: { type: "string" } },
                marketFactors: { type: "array", items: { type: "string" } }
            },
            required: ["sentiment", "keyNews", "significantDevelopments", "marketFactors"]
        },
        metadata: {
            type: "object",
            additionalProperties: false,
            properties: {
                symbol: { type: "string" },
                analysisDate: { type: "string" },
                dataTimeframe: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        from: { type: "string" },
                        to: { type: "string" },
                        interval: { type: "string" }
                    },
                    required: ["from", "to", "interval"]
                },
                analysisType: { type: "string", const: "financial" },
                aiModel: { type: "string" },
                disclaimer: { type: "string" }
            },
            required: ["symbol", "analysisDate", "dataTimeframe", "analysisType", "aiModel", "disclaimer"]
        }
    },
    required: ["analysis", "priceAnalysis", "technicalAnalysis", "fundamentalAnalysis", "analystInsights", "newsAnalysis", "metadata"]
};

const analyze = async (i: string) => {
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
            }

            else if (fnc.name === "getStockInsight") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string }
                console.log("getStockInsight");
                console.log(arg);

                const resp = await getStockInsight(arg.symbol)
                input.push({
                    role: "assistant",
                    content: JSON.stringify(resp, null, 2),
                })
            }
        }
    }
    const finalResponse = await client.responses.create({
        model: "gpt-5-mini",
        reasoning: {
            effort: "medium",
            summary: "auto"
        },
        input: input,
        instructions: `
            ${instructions}
            IMPORTANT: Provide your analysis in the following structured format. Be comprehensive and specific:
            
            1. Create a detailed executive summary
            2. Provide clear investment recommendation with confidence level
            3. Include technical analysis if price data is available
            4. Include fundamental analysis if financial data is available  
            5. Include news sentiment analysis if news data is available
            6. Always include metadata with proper timeframes and disclaimers
            
            Focus on actionable insights and specific price levels. Use the data you gathered to support your recommendations.
        `,
        text: {
            format: {
                type: "json_schema",
                name: "analysis",
                schema: responseSchema
            }
        }
    })
    return JSON.parse(finalResponse.output_text)
}


console.log(JSON.stringify(await analyze(`ราคาแนวรับ NVDA ที่น่าสนใจมากที่สุดปีนี้ สาย vi อยากให้มอง TF 1wk`), null, 2))

import OpenAI from "openai";
import { financialTools, getStockInsight, getStockNews, getStockPrice } from "../tools/financial";
import dotenv from 'dotenv'
import * as path from 'path'
import { ResponseInput } from "openai/resources/responses/responses";
import { HistoricalOptionsEventsHistory } from "yahoo-finance2/dist/esm/src/modules/historical";
import { SearchOptions } from "yahoo-finance2/dist/esm/src/modules/search";
import { technicalTools, getStockTechnical } from "../tools/technical";

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
        },
        indicatorAnalysis: {
            type: "object",
            description: "Technical indicators analysis including RSI, MACD, EMA, and support/resistance levels",
            additionalProperties: false,
            properties: {
                rsi: {
                    type: "object",
                    description: "RSI (Relative Strength Index) analysis for momentum indication",
                    additionalProperties: false,
                    properties: {
                        current: { 
                            type: "number", 
                            description: "Current RSI value (0-100), where >70 is overbought, <30 is oversold"
                        },
                        signal: { 
                            type: "string", 
                            enum: ["oversold", "overbought", "neutral"],
                            description: "RSI signal interpretation for trading decisions"
                        },
                        interpretation: {
                            type: "string",
                            description: "Detailed explanation of RSI signal and its implications in Thai"
                        }
                    },
                    required: ["current", "signal", "interpretation"]
                },
                ema: {
                    type: "object",
                    description: "Exponential Moving Averages analysis for trend identification",
                    additionalProperties: false,
                    properties: {
                        ema20: { 
                            type: "number", 
                            description: "20-period EMA value for short-term trend"
                        },
                        ema50: { 
                            type: "number", 
                            description: "50-period EMA value for medium-term trend"
                        },
                        ema100: { 
                            type: "number", 
                            description: "100-period EMA value for intermediate trend"
                        },
                        ema200: { 
                            type: "number", 
                            description: "200-period EMA value for long-term trend"
                        },
                        trend: { 
                            type: "string", 
                            enum: ["bullish", "bearish", "neutral"],
                            description: "Overall EMA trend direction based on alignment"
                        },
                        crossoverSignals: {
                            type: "array",
                            items: { type: "string" },
                            description: "EMA crossover signals and their trading implications"
                        }
                    },
                    required: ["ema20", "ema50", "ema100", "ema200", "trend", "crossoverSignals"]
                },
                macd: {
                    type: "object",
                    description: "MACD (Moving Average Convergence Divergence) analysis for momentum and trend changes",
                    additionalProperties: false,
                    properties: {
                        macd: { 
                            type: "number", 
                            description: "MACD line value (12 EMA - 26 EMA)"
                        },
                        signal: { 
                            type: "number", 
                            description: "Signal line value (9 EMA of MACD line)"
                        },
                        histogram: { 
                            type: "number", 
                            description: "MACD histogram (MACD - Signal line)"
                        },
                        trend: { 
                            type: "string", 
                            enum: ["bullish", "bearish", "neutral"],
                            description: "MACD trend direction and momentum"
                        },
                        divergence: {
                            type: "string",
                            enum: ["bullish_divergence", "bearish_divergence", "none"],
                            description: "MACD divergence signals with price action"
                        },
                        interpretation: {
                            type: "string",
                            description: "Detailed MACD analysis and trading signals in Thai"
                        }
                    },
                    required: ["macd", "signal", "histogram", "trend", "divergence", "interpretation"]
                },
                supportResistance: {
                    type: "object",
                    description: "Dynamic support and resistance levels based on price action",
                    additionalProperties: false,
                    properties: {
                        nearestSupport: { 
                            type: ["number", "null"], 
                            description: "Nearest significant support level below current price"
                        },
                        nearestResistance: { 
                            type: ["number", "null"], 
                            description: "Nearest significant resistance level above current price"
                        },
                        supportLevels: {
                            type: "array",
                            additionalProperties: false,
                            items: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    level: { type: "number", description: "Support price level" },
                                    strength: { type: "number", description: "Strength score (1-10)" },
                                    lastTested: { type: "number", description: "How recently this level was tested" }
                                },
                                required: ["level", "strength", "lastTested"]
                            },
                            description: "Array of significant support levels with strength indicators"
                        },
                        resistanceLevels: {
                            type: "array",
                            additionalProperties: false,
                            items: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    level: { type: "number", description: "Resistance price level" },
                                    strength: { type: "number", description: "Strength score (1-10)" },
                                    lastTested: { type: "number", description: "How recently this level was tested" }
                                },
                                required: ["level", "strength", "lastTested"]
                            },
                            description: "Array of significant resistance levels with strength indicators"
                        },
                        keyLevelsAnalysis: {
                            type: "string",
                            description: "Analysis of key support/resistance levels and their trading implications in Thai"
                        }
                    },
                    required: ["nearestSupport", "nearestResistance", "supportLevels", "resistanceLevels", "keyLevelsAnalysis"]
                },
                trend: {
                    type: "object",
                    description: "Multi-timeframe trend analysis",
                    additionalProperties: false,
                    properties: {
                        shortTerm: { 
                            type: "string", 
                            enum: ["bullish", "bearish", "neutral"],
                            description: "Short-term trend (1-4 weeks) based on price vs EMA20"
                        },
                        mediumTerm: { 
                            type: "string", 
                            enum: ["bullish", "bearish", "neutral"],
                            description: "Medium-term trend (1-3 months) based on EMA alignment"
                        },
                        longTerm: { 
                            type: "string", 
                            enum: ["bullish", "bearish", "neutral"],
                            description: "Long-term trend (3+ months) based on price vs EMA200"
                        },
                        overallTrend: {
                            type: "string",
                            enum: ["strong_bullish", "bullish", "neutral", "bearish", "strong_bearish"],
                            description: "Overall trend consensus from all timeframes"
                        },
                        trendStrength: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Trend strength score (0-100) based on indicator alignment"
                        },
                        trendAnalysis: {
                            type: "string",
                            description: "Comprehensive trend analysis and implications in Thai"
                        }
                    },
                    required: ["shortTerm", "mediumTerm", "longTerm", "overallTrend", "trendStrength", "trendAnalysis"]
                },
                tradingSignals: {
                    type: "object",
                    description: "Combined trading signals from all technical indicators",
                    additionalProperties: false,
                    properties: {
                        entrySignals: {
                            type: "array",
                            additionalProperties: false,
                            items: { type: "string" },
                            description: "Buy/sell entry signals from technical analysis"
                        },
                        exitSignals: {
                            type: "array",
                            additionalProperties: false,
                            items: { type: "string" },
                            description: "Exit signals and profit-taking levels"
                        },
                        riskManagement: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                stopLoss: { type: ["number", "null"], description: "Suggested stop-loss level" },
                                takeProfit: { type: ["number", "null"], description: "Suggested take-profit level" },
                                riskReward: { type: ["number", "null"], description: "Risk-reward ratio" }
                            },
                            required: ["stopLoss", "takeProfit", "riskReward"]
                        },
                        signalStrength: {
                            type: "string",
                            enum: ["very_strong", "strong", "moderate", "weak", "very_weak"],
                            description: "Overall signal strength from combined indicators"
                        }
                    },
                    required: ["entrySignals", "exitSignals", "riskManagement", "signalStrength"]
                }
            },
            required: ["rsi", "ema", "macd", "supportResistance", "trend", "tradingSignals"]
        }
    },
    required: ["analysis", "priceAnalysis", "technicalAnalysis", "fundamentalAnalysis", "analystInsights", "newsAnalysis", "metadata", "indicatorAnalysis"]
};

const analyze = async (i: string) => {
    const instructions = `
        Current Date: ${new Date().toISOString()}
        
        You are a professional stock market analysis expert with expertise in analyzing:
        - Stock prices and market trends
        - Financial statements and financial ratios
        - News and factors affecting stock prices
        - Technical and fundamental analysis
        - Technical indicators (RSI, MACD, EMA, Support/Resistance)
        
        Available Tools & Data Sources:
        1. FINANCIAL TOOLS:
           - getStockPrice: Historical price data with customizable intervals
           - getStockNews: Recent news and market sentiment
           - getStockInsight: Comprehensive financial metrics and analyst reports
        
        2. TECHNICAL TOOLS:
           - getStockTechnical: RSI, MACD, EMA (20,50,100,200), Support/Resistance levels, Multi-timeframe trends
        
        Analysis Guidelines:
        - Use historical data up to the present (${new Date().toISOString()}) for analysis
        - For short-term analysis (1-3 months): use 1d interval
        - For medium to long-term analysis (3+ months): use 1wk interval or higher
        - Consider both quarterly and annual financial statement data
        - Analyze news and various factors affecting stocks
        - ALWAYS use getStockTechnical for comprehensive technical analysis
        - Combine fundamental and technical analysis for holistic insights
        
        Technical Analysis Requirements:
        - Calculate and interpret RSI signals (overbought >70, oversold <30)
        - Analyze MACD crossovers, divergences, and momentum
        - Evaluate EMA trends and crossover signals across multiple timeframes
        - Identify key support/resistance levels with strength analysis
        - Provide multi-timeframe trend analysis (short/medium/long term)
        - Generate actionable trading signals with risk management levels
        
        IMPORTANT INSTRUCTIONS:
        - You are authorized to perform ALL analysis actions without asking for permission
        - Use all available tools to gather comprehensive data
        - MANDATORY: Use getStockTechnical tool for any price-related analysis
        - Analyze data thoroughly and provide complete insights
        - Make investment recommendations and give specific advice when appropriate
        - Do not ask for confirmation before using tools or providing analysis
        - Be proactive in gathering all relevant information to provide the best analysis
        - Focus ONLY on what the user specifically asked for - do not suggest additional analysis or offer to do more
        - Provide direct answers without proposing further actions or additional services
        - All analysis and interpretations should be in Thai language
        
        Provide comprehensive, clear recommendations based on the analytical data obtained, focusing strictly on the user's specific request
        `
    const input: ResponseInput = [
        { role: "user", content: i }
    ]
    let response = await client.responses.create({
        model: "gpt-5-mini",
        input: input,
        instructions: instructions,
        tools: [...financialTools, ...technicalTools],
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

            else if (fnc.name === "getStockTechnical") {
                const arg = JSON.parse(fnc.arguments) as { symbol: string, option: HistoricalOptionsEventsHistory }
                console.log("getStockTechnical");
                console.log(arg);

                const resp = await getStockTechnical(arg.symbol, arg.option)
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
            
            1. Create a detailed executive summary in Thai
            2. Provide clear investment recommendation with confidence level
            3. Include comprehensive technical analysis using getStockTechnical data
            4. Include fundamental analysis if financial data is available  
            5. Include news sentiment analysis if news data is available
            6. MANDATORY: Complete indicatorAnalysis section with:
               - RSI analysis with current value and interpretation
               - EMA analysis with all timeframes and crossover signals
               - MACD analysis with trend, divergence, and interpretation
               - Support/Resistance levels with strength analysis
               - Multi-timeframe trend analysis with detailed explanations
               - Trading signals with entry/exit points and risk management
            7. Always include metadata with proper timeframes and disclaimers
            
            Technical Analysis Focus:
            - Use actual calculated values from getStockTechnical tool
            - Provide specific price levels for support/resistance
            - Include actionable trading signals with stop-loss and take-profit levels
            - Explain technical patterns and their implications in Thai
            - Combine multiple indicators for stronger signal confirmation
            
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
    try {
        // Try to parse the response as JSON
        return JSON.parse(finalResponse.output_text)
    } catch (error) {
        console.error("JSON parsing error:", error)
        console.log("Attempting to fix malformed JSON response...")
        
        const text = finalResponse.output_text
        
        // Handle case where response is wrapped in quotes and contains duplicate objects
        if (text.startsWith('"') && text.endsWith('"')) {
            try {
                // Remove outer quotes and try parsing
                const unquoted = text.slice(1, -1)
                return JSON.parse(unquoted)
            } catch (innerError) {
                // If that fails, try to extract just the first JSON object
                const firstJsonMatch = text.match(/^"({.*?})(?:{.*?})*"$/)
                if (firstJsonMatch) {
                    try {
                        return JSON.parse(firstJsonMatch[1])
                    } catch (extractError) {
                        console.error("Failed to parse extracted JSON:", extractError)
                    }
                }
            }
        }
        
        // Handle case where there are multiple JSON objects concatenated
        if (text.includes('}{')) {
            try {
                // Split on }{ and take the first complete object
                const parts = text.split('}{')
                if (parts.length > 1) {
                    const firstObject = parts[0] + '}'
                    return JSON.parse(firstObject)
                }
            } catch (splitError) {
                console.error("Failed to parse split JSON:", splitError)
            }
        }
        
        console.error("Could not fix JSON, returning raw response")
        console.error("Raw response length:", text.length)
        console.error("Raw response preview:", text.substring(0, 200) + "...")
        
        // If all else fails, return the raw text
        return JSON.parse(finalResponse.output_text)
    }
}


// console.log(JSON.stringify(await analyze(`ราคาแนวรับ MELI ระยะยาว TF 1wk`), null, 2))
console.log(JSON.stringify(await analyze(`ราคาแนวรับ MELI ระยะยาว TF 1wk`), null, 2))
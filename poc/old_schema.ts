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

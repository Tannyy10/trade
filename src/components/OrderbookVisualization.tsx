"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderbookEntry {
  price: number;
  size: number;
  total: number;
  percentage: number;
}

interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  timestamp: number;
}

interface OrderbookVisualizationProps {
  data?: OrderbookData;
  maxDepth?: number;
}

const OrderbookVisualization = ({
  data = {
    bids: Array(10)
      .fill(0)
      .map((_, i) => ({
        price: 50000 - i * 10,
        size: Math.random() * 5 + 0.5,
        total: 0,
        percentage: 0,
      })),
    asks: Array(10)
      .fill(0)
      .map((_, i) => ({
        price: 50010 + i * 10,
        size: Math.random() * 5 + 0.5,
        total: 0,
        percentage: 0,
      })),
    timestamp: Date.now(),
  },
  maxDepth = 10,
}: OrderbookVisualizationProps) => {
  const [processedData, setProcessedData] = useState<OrderbookData>(data);
  const [activeTab, setActiveTab] = useState<string>("orderbook");

  // Process the orderbook data to calculate totals and percentages
  useEffect(() => {
    if (!data) return;

    const processData = (entries: OrderbookEntry[]) => {
      let runningTotal = 0;
      return entries.map((entry) => {
        runningTotal += entry.size;
        return {
          ...entry,
          total: runningTotal,
          percentage: 0, // Will be calculated after finding max total
        };
      });
    };

    const processedBids = processData(data.bids.slice(0, maxDepth));
    const processedAsks = processData(data.asks.slice(0, maxDepth));

    // Calculate percentages based on the maximum total value
    const maxTotal = Math.max(
      processedBids.length > 0
        ? processedBids[processedBids.length - 1].total
        : 0,
      processedAsks.length > 0
        ? processedAsks[processedAsks.length - 1].total
        : 0,
    );

    const calculatePercentages = (entries: OrderbookEntry[]) => {
      return entries.map((entry) => ({
        ...entry,
        percentage: maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0,
      }));
    };

    setProcessedData({
      bids: calculatePercentages(processedBids),
      asks: calculatePercentages(processedAsks),
      timestamp: data.timestamp,
    });
  }, [data, maxDepth]);

  return (
    <Card className="w-full h-full bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Orderbook Visualization</span>
          <span className="text-sm text-muted-foreground">
            Last updated:{" "}
            {new Date(processedData.timestamp).toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="orderbook">Orderbook</TabsTrigger>
            <TabsTrigger value="depth">Depth Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="orderbook" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 grid grid-cols-3 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Price (USDT)</div>
                <div className="text-center">Size (BTC)</div>
                <div className="text-right">Total</div>
              </div>

              {/* Asks (sell orders) - displayed in reverse order */}
              <div className="col-span-3">
                {processedData.asks
                  .slice()
                  .reverse()
                  .map((ask, index) => (
                    <div
                      key={`ask-${index}`}
                      className="grid grid-cols-3 text-sm py-1 relative"
                    >
                      <div className="text-red-500">{ask.price.toFixed(2)}</div>
                      <div className="text-center">{ask.size.toFixed(4)}</div>
                      <div className="text-right">{ask.total.toFixed(4)}</div>
                      <div
                        className="absolute right-0 top-0 h-full bg-red-500/10"
                        style={{ width: `${ask.percentage}%` }}
                      />
                    </div>
                  ))}
              </div>

              {/* Spread indicator */}
              <div className="col-span-3 text-center text-sm text-muted-foreground py-2 border-y">
                Spread:{" "}
                {processedData.asks[0] && processedData.bids[0]
                  ? (
                      processedData.asks[0].price - processedData.bids[0].price
                    ).toFixed(2)
                  : "--"}
                (
                {processedData.asks?.[0]?.price &&
                processedData.bids?.[0]?.price
                  ? (
                      ((processedData.asks[0].price -
                        processedData.bids[0].price) /
                        (processedData.bids[0].price || 1)) *
                      100
                    ).toFixed(3)
                  : "--"}
                %)
              </div>

              {/* Bids (buy orders) */}
              <div className="col-span-3">
                {processedData.bids.map((bid, index) => (
                  <div
                    key={`bid-${index}`}
                    className="grid grid-cols-3 text-sm py-1 relative"
                  >
                    <div className="text-green-500">
                      {bid?.price?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-center">
                      {bid?.size?.toFixed(4) || "0.0000"}
                    </div>
                    <div className="text-right">
                      {bid?.total?.toFixed(4) || "0.0000"}
                    </div>
                    <div
                      className="absolute right-0 top-0 h-full bg-green-500/10"
                      style={{ width: `${bid?.percentage || 0}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="depth" className="mt-4">
            <div className="h-[350px] relative">
              {/* SVG for depth chart */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 700 350"
                preserveAspectRatio="none"
              >
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={`grid-${percent}`}
                    x1="0"
                    y1={350 - (percent / 100) * 350}
                    x2="700"
                    y2={350 - (percent / 100) * 350}
                    stroke="#333"
                    strokeWidth="0.5"
                    strokeDasharray="5,5"
                  />
                ))}

                {/* Asks depth curve */}
                <path
                  d={`M${350},${350} ${processedData.asks
                    .map((ask, i) => {
                      const x = 350 + i * (350 / processedData.asks.length);
                      const y = 350 - (ask.percentage / 100) * 350;
                      return `L${x},${y}`;
                    })
                    .join(" ")} L700,350 Z`}
                  fill="rgba(239, 68, 68, 0.2)"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="1.5"
                />

                {/* Bids depth curve */}
                <path
                  d={`M${350},${350} ${processedData.bids
                    .map((bid, i) => {
                      const x =
                        350 - (i + 1) * (350 / processedData.bids.length);
                      const y = 350 - ((bid?.percentage || 0) / 100) * 350;
                      return `L${x},${y}`;
                    })
                    .join(" ")} L0,350 Z`}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="1.5"
                />

                {/* Center line */}
                <line
                  x1="350"
                  y1="0"
                  x2="350"
                  y2="350"
                  stroke="#666"
                  strokeWidth="1"
                />
              </svg>

              {/* Labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-muted-foreground px-4">
                <div>Bids</div>
                <div>Price</div>
                <div>Asks</div>
              </div>

              {/* Y-axis labels */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-2">
                <div>100%</div>
                <div>75%</div>
                <div>50%</div>
                <div>25%</div>
                <div>0%</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderbookVisualization;

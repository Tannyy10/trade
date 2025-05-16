import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Clock, TrendingDown, Coins, Activity, Percent } from "lucide-react";

interface MetricsDisplayProps {
  slippage?: number;
  fees?: number;
  marketImpact?: number;
  makerTakerProportion?: number;
  processingLatency?: number;
  uiUpdateSpeed?: number;
  endToEndTiming?: number;
}

const MetricsDisplay = ({
  slippage = 0.05,
  fees = 0.001,
  marketImpact = 0.12,
  makerTakerProportion = 0.75,
  processingLatency = 12,
  uiUpdateSpeed = 8,
  endToEndTiming = 45,
}: MetricsDisplayProps) => {
  return (
    <div className="w-full bg-background p-4 rounded-lg border border-border">
      <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Expected Slippage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
              Expected Slippage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(slippage * 100).toFixed(3)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Estimated price deviation from market price
            </p>
          </CardContent>
        </Card>

        {/* Expected Fees Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Coins className="mr-2 h-5 w-5 text-yellow-500" />
              Expected Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(fees * 100).toFixed(3)}%</div>
            <p className="text-sm text-muted-foreground">
              Trading fees based on selected tier
            </p>
          </CardContent>
        </Card>

        {/* Market Impact Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Activity className="mr-2 h-5 w-5 text-blue-500" />
              Market Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(marketImpact * 100).toFixed(3)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Almgren-Chriss model estimation
            </p>
          </CardContent>
        </Card>

        {/* Maker/Taker Proportion Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Percent className="mr-2 h-5 w-5 text-green-500" />
              Maker/Taker Proportion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(makerTakerProportion * 100).toFixed(1)}% /{" "}
              {((1 - makerTakerProportion) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Logistic regression model prediction
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      {/* Performance Metrics */}
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">
            Processing:
          </span>
          <Badge variant="outline" className="bg-slate-100">
            {processingLatency} ms
          </Badge>
        </div>

        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">UI Update:</span>
          <Badge variant="outline" className="bg-slate-100">
            {uiUpdateSpeed} ms
          </Badge>
        </div>

        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">
            End-to-End:
          </span>
          <Badge variant="outline" className="bg-slate-100">
            {endToEndTiming} ms
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default MetricsDisplay;

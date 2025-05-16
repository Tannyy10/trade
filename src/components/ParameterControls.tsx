"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParameterControlsProps {
  onSubmit: (parameters: SimulationParameters) => void;
  isLoading?: boolean;
}

export interface SimulationParameters {
  orderSize: number;
  volatility: number;
  feeTier: string;
}

const ParameterControls = ({
  onSubmit = () => {},
  isLoading = false,
}: ParameterControlsProps) => {
  const [orderSize, setOrderSize] = useState<string>("1");
  const [volatility, setVolatility] = useState<number>(50);
  const [feeTier, setFeeTier] = useState<string>("standard");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedOrderSize = parseFloat(orderSize);

    // Validation
    if (isNaN(parsedOrderSize) || parsedOrderSize <= 0) {
      setError("Order size must be a positive number");
      return;
    }

    if (volatility < 0 || volatility > 100) {
      setError("Volatility must be between 0 and 100");
      return;
    }

    if (!feeTier) {
      setError("Please select a fee tier");
      return;
    }

    // Submit parameters
    onSubmit({
      orderSize: parsedOrderSize,
      volatility: volatility,
      feeTier: feeTier,
    });
  };

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Simulation Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="orderSize">Order Size (BTC)</Label>
            <Input
              id="orderSize"
              type="number"
              step="0.001"
              min="0.001"
              value={orderSize}
              onChange={(e) => setOrderSize(e.target.value)}
              placeholder="Enter order size"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="volatility">Volatility</Label>
              <span className="text-sm text-muted-foreground">
                {volatility}%
              </span>
            </div>
            <Slider
              id="volatility"
              min={0}
              max={100}
              step={1}
              value={[volatility]}
              onValueChange={(values) => setVolatility(values[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeTier">Fee Tier</Label>
            <Select value={feeTier} onValueChange={setFeeTier}>
              <SelectTrigger id="feeTier" className="w-full">
                <SelectValue placeholder="Select fee tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vip">VIP (0.02%)</SelectItem>
                <SelectItem value="standard">Standard (0.05%)</SelectItem>
                <SelectItem value="basic">Basic (0.1%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Run Simulation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ParameterControls;

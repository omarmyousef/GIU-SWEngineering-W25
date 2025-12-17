// File: @/components/ui/timeSelectorSlider.tsx

import { useState, useMemo, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimeSelectorSliderProps {
  value: Date | null | undefined;
  onChange: (date: Date) => void;
  minMinutes?: number;
  maxMinutesFromMin?: number;
  orderCutoffHour?: number;
  label?: string;
  description?: string;
}

const DEFAULT_MIN_ORDER_TIME = 15; // minutes
const DEFAULT_MAX_ORDER_WINDOW = 180; // 3 hours in minutes
const DEFAULT_ORDER_CUTOFF_HOUR = 23; // Orders must be today

export function TimeSelectorSlider({
  value,
  onChange,
  minMinutes = DEFAULT_MIN_ORDER_TIME,
  maxMinutesFromMin = DEFAULT_MAX_ORDER_WINDOW,
  orderCutoffHour = DEFAULT_ORDER_CUTOFF_HOUR,
  label = "Delivery Time",
  description = "Select your preferred delivery time for today",
}: TimeSelectorSliderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(minMinutes);

  // Calculate the minimum possible order time
  const minOrderTime = useMemo(() => {
    const now = new Date();
    const minTime = new Date(now.getTime() + minMinutes * 60000);

    // If it's after cutoff hour, can't order today
    if (now.getHours() >= orderCutoffHour) {
      return null; // Can't order today
    }

    return minTime;
  }, [minMinutes, orderCutoffHour]);

  // Calculate max order time (min + window, but not past cutoff)
  const maxOrderTime = useMemo(() => {
    if (!minOrderTime) return null;
    const maxTime = new Date(
      minOrderTime.getTime() + (maxMinutesFromMin - minMinutes) * 60000
    );

    // Cap at order cutoff time today
    const cutoffTime = new Date();
    cutoffTime.setHours(orderCutoffHour, 0, 0, 0);

    return maxTime < cutoffTime ? maxTime : cutoffTime;
  }, [minOrderTime, maxMinutesFromMin, minMinutes, orderCutoffHour]);

  // Calculate the order time based on slider value
  const currentOrderTime = useMemo(() => {
    if (!minOrderTime) return null;
    return new Date(minOrderTime.getTime() + (sliderValue - minMinutes) * 60000);
  }, [sliderValue, minOrderTime, minMinutes]);

  const handleOpenDialog = () => {
    if (value && value instanceof Date && !isNaN(value.getTime()) && minOrderTime) {
      const diffMinutes = Math.round(
        (value.getTime() - minOrderTime.getTime()) / 60000
      );
      setSliderValue(Math.max(minMinutes, minMinutes + diffMinutes));
    } else {
      setSliderValue(minMinutes);
    }
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (currentOrderTime && currentOrderTime instanceof Date && !isNaN(currentOrderTime.getTime())) {
      onChange(currentOrderTime);
      setDialogOpen(false);
    }
  };

  const formatTime = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "Not available";
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeLabel = (minutes: number) => {
    const mins = minutes - minMinutes;
    if (mins === 0) return `ASAP (${formatTime(currentOrderTime)})`;
    if (mins < 60) return `In ${mins} min (${formatTime(currentOrderTime)})`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const timeStr =
      remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    return `${timeStr} (${formatTime(currentOrderTime)})`;
  };

  if (!minOrderTime) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-200">
        <p className="font-medium">Orders are closed for today</p>
        <p className="text-sm">Next orders available tomorrow</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={handleOpenDialog}
            variant="outline"
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatTime(value)}</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>When do you want your order?</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Time Display */}
            <div className="text-center">
              <div className="inline-block bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 w-full">
                <div className="text-sm text-muted-foreground mb-2">
                  Estimated arrival
                </div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(currentOrderTime)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Today</div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {getTimeLabel(sliderValue)}
                </label>
                <input
                  type="range"
                  min={minMinutes}
                  max={
                    maxOrderTime
                      ? Math.round(
                          (maxOrderTime.getTime() - minOrderTime.getTime()) /
                            60000
                        ) + minMinutes
                      : minMinutes
                  }
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Time Presets */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSliderValue(minMinutes)}
                  className="py-2 px-3 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ASAP
                </button>
                <button
                  onClick={() => setSliderValue(minMinutes + 30)}
                  className="py-2 px-3 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  30 min
                </button>
                <button
                  onClick={() => setSliderValue(minMinutes + 60)}
                  className="py-2 px-3 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  1 hour
                </button>
              </div>
            </div>

            {/* Info Text */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                ✓ Your order will be ready by{" "}
                <span className="font-semibold">{formatTime(currentOrderTime)}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Confirm Time
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Time Display */}
      {value && value instanceof Date && !isNaN(value.getTime()) && (
        <div className="mt-2 text-sm text-muted-foreground text-center">
          Ready for pickup at {formatTime(value)} today
        </div>
      )}
    </div>
  );
}
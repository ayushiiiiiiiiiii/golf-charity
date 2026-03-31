import React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'> {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      onValueChange?.([newValue])
    }

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value?.[0] ?? min}
        onChange={handleChange}
        className={cn(
          'h-2 w-full cursor-pointer rounded-lg appearance-none bg-secondary accent-primary',
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:              "flex flex-col",
        month:               "space-y-3",
        caption:             "flex justify-center relative items-center h-8",
        caption_label:       "text-sm font-semibold text-gray-900",
        caption_dropdowns:   "flex items-center gap-1",
        dropdown:            "cursor-pointer appearance-none bg-transparent px-1 py-0.5 text-sm font-semibold text-gray-900 outline-none hover:text-blue-600",
        dropdown_month:      "",
        dropdown_year:       "",
        vhidden:             "sr-only",
        nav:                 "flex items-center",
        nav_button:          "absolute flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors",
        nav_button_previous: "left-0",
        nav_button_next:     "right-0",
        table:               "w-full border-collapse",
        head_row:            "flex",
        head_cell:           "w-9 text-center text-xs font-medium text-gray-400 py-1",
        row:                 "flex w-full mt-1",
        cell:                cn(
          "relative h-9 w-9 p-0 text-center text-sm",
          "[&:has([aria-selected])]:bg-blue-50 [&:has([aria-selected])]:rounded-md"
        ),
        day:                 "h-9 w-9 rounded-md text-sm font-normal text-gray-700 hover:bg-gray-100 transition-colors",
        day_selected:        "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
        day_today:           "bg-gray-100 text-gray-900 font-semibold",
        day_outside:         "text-gray-300 opacity-50",
        day_disabled:        "text-gray-300 opacity-50 cursor-not-allowed",
        day_hidden:          "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

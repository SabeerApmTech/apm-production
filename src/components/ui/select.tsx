import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const Select         = SelectPrimitive.Root
const SelectGroup    = SelectPrimitive.Group
const SelectValue    = SelectPrimitive.Value

/** Flattens a SelectItem's children into plain text for search matching — children are usually a
 *  string, but a few call sites compose them from multiple parts (e.g. `{name} - {location}`). */
function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join("")
  if (React.isValidElement(node)) return getNodeText((node.props as { children?: React.ReactNode }).children)
  return ""
}

/** Walks a SelectContent's children, keeping only the SelectItems whose text matches `query`
 *  (recursing into SelectGroups) — everything else (labels, separators) passes through as-is. */
function filterSelectOptions(children: React.ReactNode, query: string): { filtered: React.ReactNode; matchCount: number } {
  let matchCount = 0
  function walk(nodes: React.ReactNode): React.ReactNode {
    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child
      if (child.type === SelectItem) {
        const matches = getNodeText((child.props as { children?: React.ReactNode }).children).toLowerCase().includes(query)
        if (matches) matchCount++
        return matches ? child : null
      }
      if (child.type === SelectGroup) {
        const groupProps = child.props as { children?: React.ReactNode }
        return React.cloneElement(child, undefined, walk(groupProps.children))
      }
      return child
    })
  }
  return { filtered: walk(children), matchCount }
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground outline-none",
        "focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const [search, setSearch] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)

  // Freshly mounted every time the dropdown opens (Radix unmounts Content on close), so this
  // always starts focused and empty without needing to reset it on close ourselves.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  const query = search.trim().toLowerCase()
  const { filtered, matchCount } = query
    ? filterSelectOptions(children, query)
    : { filtered: children, matchCount: -1 }

  function focusOption(fromEnd: boolean) {
    const options = viewportRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
    if (!options || options.length === 0) return
    options[fromEnd ? options.length - 1 : 0].focus()
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      focusOption(false)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      focusOption(true)
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const options = viewportRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
      if (options?.length === 1) options[0].click()
      return
    }
    if (e.key === "Escape" && search) {
      e.preventDefault()
      e.stopPropagation()
      setSearch("")
      return
    }
    // Stops Radix's own type-ahead handler (which otherwise moves focus to a matching item on
    // every keystroke) from stealing focus away from this input.
    e.stopPropagation()
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          ref={viewportRef}
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
          )}
        >
          {query && matchCount === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            filtered
          )}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-950/40 dark:focus:text-blue-200",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select, SelectGroup, SelectValue,
  SelectTrigger, SelectContent, SelectItem,
  SelectLabel, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
}

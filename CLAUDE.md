@AGENTS.md

# Styling conventions

- Always use CVA (`class-variance-authority`) for any component that has more than one visual state or variant. Never inline long className strings with manual conditionals when a `cva()` definition would be cleaner.
- Use Tailwind variants (`hover:`, `focus:`, `group-hover:`, `data-[...]`, etc.) instead of JavaScript-driven class toggling wherever possible.
- Reuse existing shadcn-style components in `components/ui/` (Button, Badge, Card, Tabs, Input, etc.) rather than building one-off inline styled elements. Extend them with new CVA variants if a new visual style is needed.

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { money } from '@/lib/tabletalk/menu';
import type { OrderSummary, OrderUpdate } from '@/lib/tabletalk/order';
import { cn } from '@/lib/utils';

type OrderPanelProps = {
  summary: OrderSummary;
  notice: string;
  onChange: (update: OrderUpdate) => void;
  onClear: () => void;
  className?: string;
};

const quantityButton = 'grid size-6.25 place-items-center rounded-md border border-border bg-white';

export function OrderPanel({ summary, notice, onChange, onClear, className }: OrderPanelProps) {
  return (
    <section
      className={cn('rounded-[15px] border border-border bg-white p-5.5', className)}
      aria-labelledby="order-title"
    >
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="order-title" className="flex items-center gap-2.25">
          <ShoppingBag size={19} /> Your draft order
          <span className="h-5.75 min-w-5.75 rounded-full bg-mint pt-1 text-center text-xs">
            {summary.count}
          </span>
        </h2>
        {summary.count > 0 && (
          <button
            className="p-1 text-muted-foreground"
            onClick={onClear}
            aria-label="Clear draft order"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {summary.items.length === 0 ? (
        <div className="flex flex-col items-center py-7.75 text-subtle-foreground">
          <ShoppingBag size={27} />
          <p className="mt-3.25 mb-1.25 text-sm text-muted-foreground">A good meal starts here.</p>
          <span className="text-xs">Add an item or ask the assistant.</span>
        </div>
      ) : (
        <ul className="my-4.5">
          {summary.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2.5 border-b border-border-muted py-3.25"
            >
              <div className="flex flex-col gap-1.25 text-sm">
                <strong>{item.name}</strong>
                <span className="text-xs text-muted-foreground">{money(item.subtotal)}</span>
              </div>
              <div className="flex items-center gap-2.25 text-sm">
                <button
                  className={quantityButton}
                  aria-label={`Decrease ${item.name}`}
                  onClick={() =>
                    onChange({ itemId: item.id, quantity: item.quantity - 1, action: 'set' })
                  }
                >
                  <Minus size={13} />
                </button>
                <span>{item.quantity}</span>
                <button
                  className={quantityButton}
                  aria-label={`Increase ${item.name}`}
                  onClick={() => onChange({ itemId: item.id, quantity: 1, action: 'add' })}
                >
                  <Plus size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex justify-between border-t border-border-muted pt-4.25">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <strong className="text-xl">{money(summary.total)}</strong>
      </div>
      <p className="mt-2.5 text-xs text-sage-foreground empty:hidden" role="status">
        {notice}
      </p>
      <p className="mt-3 text-xs text-subtle-foreground">
        Draft only. No payment or order will be placed.
      </p>
    </section>
  );
}

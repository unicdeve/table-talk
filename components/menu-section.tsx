import { Leaf, Plus, Sparkles, Utensils } from 'lucide-react';
import Image from 'next/image';

import { Checkbox } from '@/components/ui/checkbox';
import { type Category, type MenuItem, categories, money } from '@/lib/tabletalk/menu';
import { cn } from '@/lib/utils';

export type CategoryFilter = Category | 'All';

const categoryFilters: CategoryFilter[] = ['All', ...categories];

type MenuSectionProps = {
  items: MenuItem[];
  highlighted: string[];
  category: CategoryFilter;
  vegetarian: boolean;
  onCategoryChange: (category: CategoryFilter) => void;
  onVegetarianChange: (vegetarian: boolean) => void;
  onAdd: (item: MenuItem) => void;
};

export function MenuSection({
  items,
  highlighted,
  category,
  vegetarian,
  onCategoryChange,
  onVegetarianChange,
  onAdd,
}: MenuSectionProps) {
  return (
    <section aria-labelledby="menu-title">
      <div className="mb-6.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">THE MENU</p>
          <h1
            id="menu-title"
            className="mt-2.25 mb-3 text-[32px] font-bold tracking-[-0.04em] md:text-[38px]"
          >
            What sounds good?
          </h1>
          <p className="text-muted-foreground">
            Lagos favourites, made your way. Browse or ask our assistant.
          </p>
        </div>
        <Utensils className="hidden text-subtle-foreground md:block" size={30} />
      </div>

      <div className="flex min-h-52.5 justify-between overflow-hidden rounded-[18px] bg-primary text-white">
        <div className="p-5.75 lg:px-7 lg:py-6">
          <span className="text-[11px] font-bold tracking-[0.14em] text-accent">
            A LITTLE INSPIRATION
          </span>
          <h2 className="my-3 text-[23px] leading-[1.12] tracking-[-0.03em] md:text-[27px]">
            Smoky rice.
            <br />
            Golden plantain.
            <br />
            Your kind of lunch.
          </h2>
          <p className="text-xs text-banner-foreground md:text-sm">
            Ask: “Something vegetarian under ₦8,000.”
          </p>
        </div>
        <Image
          src="/jollof.jpg"
          alt="Illustrative bowl of jollof rice with grilled chicken"
          width={260}
          height={210}
          preload
          className="w-[32%] object-cover md:w-[30%] lg:w-[34%]"
        />
      </div>

      <div className="mt-6.25 mb-5 flex flex-wrap items-center justify-between gap-4 md:flex-col md:items-start lg:flex-row lg:items-center">
        <div className="flex gap-1.5" role="group" aria-label="Menu categories">
          {categoryFilters.map((value) => (
            <button
              key={value}
              className={cn(
                'rounded-lg px-3.75 py-2.25 text-sm',
                category === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
              aria-pressed={category === value}
              onClick={() => onCategoryChange(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox
            checked={vegetarian}
            onCheckedChange={(value) => onVegetarianChange(value === true)}
          />
          <Leaf size={15} /> Vegetarian
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2.75 md:gap-3.75">
        {items.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            recommended={highlighted.includes(item.id)}
            onAdd={() => onAdd(item)}
          />
        ))}
      </div>

      <p className="mt-4.5 text-xs text-muted-foreground">
        Allergen information is unverified. Please check with the restaurant before ordering.
      </p>
    </section>
  );
}

function MenuCard({
  item,
  recommended,
  onAdd,
}: {
  item: MenuItem;
  recommended: boolean;
  onAdd: () => void;
}) {
  return (
    <article
      className={cn(
        'flex min-h-45.75 flex-col rounded-[14px] border border-border bg-white p-4 md:p-5.25',
        recommended && 'border-leaf-bright ring-1 ring-leaf-bright',
      )}
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-1.25 text-xs text-muted-foreground md:flex-nowrap md:gap-2">
        <span>{item.category}</span>
        {recommended ? (
          <span className="flex items-center gap-1 font-bold text-leaf">
            <Sparkles size={12} /> Recommended
          </span>
        ) : (
          item.vegetarian && (
            <span className="flex items-center gap-1 text-leaf">
              <Leaf size={12} /> Vegetarian
            </span>
          )
        )}
      </div>
      <h3 className="text-base tracking-[-0.02em] md:text-lg">{item.name}</h3>
      <p className="mt-2.25 mb-4.75 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <strong className="text-[17px]">{money(item.price)}</strong>
        <button
          className="flex items-center gap-1.25 rounded-[7px] border border-border bg-background px-2.75 py-1.75 text-sm"
          disabled={!item.available}
          aria-label={`Add ${item.name}`}
          onClick={onAdd}
        >
          {item.available ? (
            <>
              <Plus size={16} /> Add
            </>
          ) : (
            'Sold out'
          )}
        </button>
      </div>
    </article>
  );
}

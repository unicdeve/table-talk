'use client';
import { useRef, useState } from 'react';
import { AudioLines, Leaf, Plus, Minus, ShoppingBag, Trash2, Utensils, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { menu, money, searchMenu } from '@/lib/tabletalk/menu';
import { DraftOrder, OrderUpdate, orderSummary, updateOrder } from '@/lib/tabletalk/order';

export default function TableTalk() {
  const [order, setOrder] = useState<DraftOrder>({});
  const orderRef = useRef(order);
  const [category, setCategory] = useState('All');
  const [vegetarian, setVegetarian] = useState(false);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  function changeOrder(update: OrderUpdate) {
    try {
      const next = updateOrder(orderRef.current, update);
      orderRef.current = next; setOrder(next);
      setNotice('Draft order updated.');
      return { success: true, ...orderSummary(next) };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update the order.';
      setNotice(message); return { success: false, error: message };
    }
  }
  const summary = orderSummary(order);
  const items = searchMenu({ category: category === 'All' ? undefined : category, vegetarian });
  return <div className="app-shell">
    <header className="topbar"><a href="/" className="brand"><span className="brand-mark"><AudioLines size={22}/></span>TableTalk</a><span className="demo-badge">Fictional restaurant demo</span><span className="location">Lagos Kitchen <span>•</span> NGN</span></header>
    <main className="workspace">
      <section className="menu-area" aria-labelledby="menu-title">
        <div className="menu-heading"><div><p className="eyebrow">THE MENU</p><h1 id="menu-title">What sounds good?</h1><p className="subtitle">Lagos favourites, made your way. Browse or ask our assistant.</p></div><Utensils className="heading-icon" size={30}/></div>
        <div className="menu-banner"><div><span className="small-label">A LITTLE INSPIRATION</span><h2>Smoky rice.<br/>Golden plantain.<br/>Your kind of lunch.</h2><p>Ask: “Something vegetarian under ₦8,000.”</p></div><img src="https://tb-static.uber.com/prod/image-proc/processed_images/0f42bec6b90d82f0c192c99be40ae9ab/c67fc65e9b4e16a553eb7574fba090f1.jpeg" alt="Illustrative bowl of jollof rice with grilled chicken" width="260" height="210"/></div>
        <div className="filter-row"><div className="category-filters" aria-label="Menu categories">{['All', 'Mains', 'Sides', 'Drinks'].map(value => <button key={value} className={category === value ? 'selected' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div><label className="vegetarian-filter"><Checkbox checked={vegetarian} onCheckedChange={value => setVegetarian(value === true)}/><Leaf size={15}/> Vegetarian</label></div>
        <div className="menu-grid">{items.map(item => <article key={item.id} className={`menu-card ${highlighted.includes(item.id) ? 'recommended' : ''}`}><div className="card-meta"><span>{item.category}</span>{highlighted.includes(item.id) ? <span className="recommendation"><Sparkles size={12}/> Recommended</span> : item.vegetarian ? <span className="diet-tag"><Leaf size={12}/> Vegetarian</span> : null}</div><h3>{item.name}</h3><p>{item.description}</p><div className="card-footer"><strong>{money(item.price)}</strong><button className="add-button" disabled={!item.available} aria-label={`Add ${item.name}`} onClick={() => changeOrder({ itemId: item.id, quantity: 1, action: 'add' })}>{item.available ? <><Plus size={16}/> Add</> : 'Sold out'}</button></div></article>)}</div>
        <p className="menu-note">Allergen information is unverified. Please check with the restaurant before ordering.</p>
      </section>
      <aside className="side-panel">
        <section className="voice-panel"><div className="panel-heading"><span className="eyebrow">YOUR TABLE ASSISTANT</span><span className="ready-label">Voice</span></div><div className="voice-orb"><AudioLines size={44}/></div><h2>Let’s talk food.</h2><p>Tell me what you’re craving.<br/>I’ll help you build your order.</p><button className="primary-button" disabled>Voice setup coming next</button><p className="voice-footnote">Powered by ElevenLabs</p></section>
        <section className="order-panel" aria-labelledby="order-title"><div className="panel-heading"><h2 id="order-title"><ShoppingBag size={19}/> Your draft order <span className="count">{summary.count}</span></h2>{summary.count > 0 && <button className="clear-button" onClick={() => { orderRef.current = {}; setOrder({}); setNotice('Draft order cleared.'); }} aria-label="Clear draft order"><Trash2 size={16}/></button>}</div>
          {summary.items.length === 0 ? <div className="empty-order"><ShoppingBag size={27}/><p>A good meal starts here.</p><span>Add an item or ask the assistant.</span></div> : <ul className="order-list">{summary.items.map(item => <li key={item.id}><div><strong>{item.name}</strong><span>{money(item.subtotal)}</span></div><div className="quantity"><button aria-label={`Decrease ${item.name}`} onClick={() => changeOrder({ itemId: item.id, quantity: item.quantity - 1, action: 'set' })}><Minus size={13}/></button><span>{item.quantity}</span><button aria-label={`Increase ${item.name}`} onClick={() => changeOrder({ itemId: item.id, quantity: 1, action: 'add' })}><Plus size={13}/></button></div></li>)}</ul>}
          <div className="order-total"><span>Subtotal</span><strong>{money(summary.total)}</strong></div><p className="order-footnote">Draft only. No payment or order will be placed.</p>
        </section>
      </aside>
    </main><div className="sr-only" role="status">{notice}</div><footer className="app-footer">TableTalk <span>A voice-powered menu experiment by Taiwo Ogunola</span></footer>
  </div>;
}

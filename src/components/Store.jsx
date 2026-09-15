import React, { memo, useCallback, useMemo, useState } from 'react';
import { BUILDINGS } from '../game/buildings.js';
import { UPGRADE_CATEGORIES } from '../game/upgrades.js';
import {
  buildingPurchaseInfo, buildingUnlocked, upgradeStoreItems, countAffordable,
  framesPerSecond,
} from '../game/selectors.js';
import { formatNumber, formatDuration, formatTimeToAfford } from '../game/format.js';
import Tooltip from './Tooltip.jsx';

const BUY_QUANTITIES = [1, 10, 100, 'max'];

export default function Store({ state, settings, setSettings, dispatch, recentBuys }) {
  const [tab, setTab] = useState('click');
  const [tip, setTip] = useState(null);

  const fmt = useCallback(
    (n) => formatNumber(n, settings.numberFormat),
    [settings.numberFormat]
  );

  const counts = useMemo(
    () => UPGRADE_CATEGORIES.reduce((acc, c) => {
      acc[c.id] = countAffordable(state, c);
      return acc;
    }, {}),
    [state]
  );

  const active = UPGRADE_CATEGORIES.find((c) => c.id === tab) ?? UPGRADE_CATEGORIES[0];
  const items = upgradeStoreItems(state, active);
  const nextLocked = BUILDINGS.findIndex((_, i) => !buildingUnlocked(state, i));

  return (
    <section className="store" aria-label="Store">
      <div className="store-scroll">
        <h2 className="store-title">Store</h2>

        <div className="section-label">GPUs</div>

        <div className="buy-qty" role="group" aria-label="Purchase quantity">
          <span className="buy-qty-label">Buy</span>
          {BUY_QUANTITIES.map((q) => (
            <button
              key={q}
              type="button"
              className="buy-qty-btn"
              aria-pressed={settings.buyQuantity === q}
              onClick={() => setSettings({ buyQuantity: q })}
            >
              {q === 'max' ? 'Max' : `x${q}`}
            </button>
          ))}
        </div>

        <div className="tier-list">
          {BUILDINGS.map((building, index) => (
            buildingUnlocked(state, index) && (
              <TierRow
                key={building.id}
                building={building}
                index={index}
                state={state}
                quantity={settings.buyQuantity}
                dispatch={dispatch}
                fmt={fmt}
                setTip={setTip}
                justBought={recentBuys.has(`b${index}`)}
              />
            )
          ))}

          {nextLocked >= 0 && (
            <div className="tier-locked">
              <span aria-hidden="true">🔒</span>
              <span>
                Purchase {BUILDINGS[Math.max(0, nextLocked - 1)].name} to
                unlock the next tier.
              </span>
            </div>
          )}
        </div>

        <div className="shop-tabs" role="tablist">
          {UPGRADE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              role="tab"
              className="shop-tab"
              aria-selected={tab === category.id}
              onClick={() => setTab(category.id)}
            >
              {category.label}
              {counts[category.id] > 0 && (
                <span className="tab-badge">{counts[category.id]}</span>
              )}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="store-empty">
            Nothing here yet.
            <br />
            Keep rendering — upgrades appear as you pass each milestone.
          </p>
        ) : (
          <div className="upgrade-list">
            {items.map(({ upgrade, available, affordable }) => (
              <UpgradeCard
                key={upgrade.key}
                upgrade={upgrade}
                categoryId={active.id}
                categoryLabel={active.label}
                available={available}
                affordable={affordable}
                dispatch={dispatch}
                fmt={fmt}
                justBought={recentBuys.has(upgrade.key)}
              />
            ))}
          </div>
        )}
      </div>

      {tip && (
        <Tooltip anchor={tip.anchor}>
          <TooltipContent tip={tip} state={state} settings={settings} fmt={fmt} />
        </Tooltip>
      )}
    </section>
  );
}

const TierRow = memo(function TierRow({
  building, index, state, quantity, dispatch, fmt, setTip, justBought,
}) {
  const info = buildingPurchaseInfo(state, index, quantity);
  const owned = state.buildings[index].owned;

  const showTip = (event) => setTip({ anchor: event.currentTarget, kind: 'building', index });

  return (
    <button
      type="button"
      className={`tier-row${justBought ? ' is-bought' : ''}`}
      data-affordable={info.affordable}
      data-owned={owned > 0}
      onClick={() => dispatch({ type: 'buyBuilding', index, quantity })}
      onMouseEnter={showTip}
      onFocus={showTip}
      onMouseLeave={() => setTip(null)}
      onBlur={() => setTip(null)}
      disabled={!info.affordable}
    >
      <span className="tier-body">
        <span className="tier-name">{building.name}</span>
        <span className="tier-fps">{fmt(info.perUnit)} frames/sec each</span>
      </span>

      <span className="tier-owned">{owned}</span>

      <span className="tier-price">
        {fmt(info.cost)}
        {info.count > 1 && <small>buy {info.count}</small>}
      </span>
    </button>
  );
});

const UpgradeCard = memo(function UpgradeCard({
  upgrade, categoryId, categoryLabel, available, affordable, dispatch, fmt, justBought,
}) {
  const stateName = !available ? 'locked' : affordable ? 'affordable' : 'unaffordable';

  return (
    <button
      type="button"
      className={`upgrade-card${justBought ? ' is-bought' : ''}`}
      data-state={stateName}
      onClick={() => dispatch({ type: 'buyUpgrade', key: upgrade.key })}
      disabled={!affordable}
    >
      <span className="upg-top">
        <span className="upg-name">{upgrade.name}</span>
        <span className={`upg-badge badge-${categoryId}`}>{categoryLabel}</span>
      </span>

      <span className="upg-desc">{upgrade.desc}</span>

      {!available && (
        <span className="upg-lock">
          {upgrade.kind === 'building'
            ? upgrade.unlockText
            : `Unlocks at ${fmt(upgrade.lifetimeReq)} lifetime frames`}
        </span>
      )}

      <span className="upg-price">{fmt(upgrade.cost)} frames</span>
    </button>
  );
});

function TooltipContent({ tip, state, settings, fmt }) {
  const building = BUILDINGS[tip.index];
  const info = buildingPurchaseInfo(state, tip.index, settings.buyQuantity);
  const owned = state.buildings[tip.index].owned;

  return (
    <>
      <div className="tooltip-title">{building.name}</div>
      <div className="tooltip-cost" data-affordable={info.affordable}>
        <span>{fmt(info.cost)} frames</span>
        {info.count > 1 && <span>· buying {info.count}</span>}
      </div>
      <p className="tooltip-desc">{building.tagline}</p>
      <div className="tooltip-meta">
        <span>Produces {fmt(info.perUnit)} frames/sec each</span>
        <span>You own {owned.toLocaleString('en-US')}</span>
        {owned > 0 && <span>This tier makes {fmt(owned * info.perUnit)}/sec</span>}
        <span>
          Pays for itself in{' '}
          {Number.isFinite(info.paybackS) ? formatDuration(info.paybackS) : '—'}
        </span>
        {!info.affordable && (
          <span>
            Affordable in{' '}
            {formatTimeToAfford(info.cost - state.frames, framesPerSecond(state)) ?? 'a moment'}
          </span>
        )}
      </div>
    </>
  );
}

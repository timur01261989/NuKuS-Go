import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './unigo-mobile.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const UnigoScreen = memo(function UnigoScreen({ children, dark = false, className = '' }) {
  return (
    <div className={cx(dark ? 'unigo-shell--dark' : 'unigo-shell', className)}>
      <div className="unigo-screen">{children}</div>
    </div>
  );
});

export const UnigoAvatar = memo(function UnigoAvatar({ label = 'U', dark = false }) {
  const safeLabel = useMemo(() => String(label || 'U').trim().slice(0, 2).toUpperCase(), [label]);
  return <div className={cx('unigo-avatar', dark && 'unigo-avatar--dark')}>{safeLabel}</div>;
});

export const UnigoIcon = memo(function UnigoIcon({ name, size = 22 }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size }} data-no-auto-translate="true">
      {name}
    </span>
  );
});

export const UnigoIconButton = memo(function UnigoIconButton({ icon, onClick, dark = false, label }) {
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') onClick();
  }, [onClick]);

  return (
    <button type="button" className={cx('unigo-icon-button', dark && 'unigo-icon-button--dark')} onClick={handleClick} aria-label={label || icon}>
      <UnigoIcon name={icon} />
    </button>
  );
});

export const UnigoHeader = memo(function UnigoHeader({
  title,
  subtitle,
  avatarLabel,
  onAvatarClick,
  rightActions = [],
  dark = false,
  back,
}) {
  const navigate = useNavigate();
  const handleBack = useCallback(() => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  }, [back, navigate]);

  return (
    <header className="unigo-header">
      <div className="unigo-header__left">
        {back ? (
          <UnigoIconButton icon="arrow_back" onClick={handleBack} dark={dark} label="Orqaga" />
        ) : (
          <button type="button" onClick={onAvatarClick} style={{ border: 'none', background: 'none', padding: 0 }}>
            <UnigoAvatar label={avatarLabel} dark={dark} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 className="unigo-heading" style={{ color: dark ? 'white' : undefined, fontSize: title?.length > 20 ? 24 : 28 }}>{title}</h1>
          {subtitle ? <p className={cx('unigo-subtext', dark && 'unigo-subtext--dark')}>{subtitle}</p> : null}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {rightActions.map((action) => (
          <UnigoIconButton key={`${action.icon}-${action.label}`} icon={action.icon} onClick={action.onClick} dark={dark} label={action.label} />
        ))}
      </div>
    </header>
  );
});

export const UnigoCard = memo(function UnigoCard({ children, dark = false, soft = '', compact = false, className = '' }) {
  return <section className={cx('unigo-card', dark && 'unigo-card--dark', soft && `unigo-card--${soft}`, compact && 'unigo-card--compact', className)}>{children}</section>;
});

export const UnigoButton = memo(function UnigoButton({ children, variant = 'primary', onClick, disabled = false, icon }) {
  const handleClick = useCallback(() => {
    if (!disabled && typeof onClick === 'function') onClick();
  }, [disabled, onClick]);
  return (
    <button type="button" className={cx('unigo-button', `unigo-button--${variant}`, disabled && 'unigo-button--disabled')} onClick={handleClick}>
      {icon ? <UnigoIcon name={icon} size={20} /> : null}
      <span>{children}</span>
    </button>
  );
});

export const UnigoSection = memo(function UnigoSection({ title, actionLabel, onAction, children }) {
  const handleAction = useCallback(() => {
    if (typeof onAction === 'function') onAction();
  }, [onAction]);
  return (
    <section className="unigo-section">
      {(title || actionLabel) ? (
        <div className="unigo-section__header">
          {title ? <h2 className="unigo-section-title">{title}</h2> : <span />}
          {actionLabel ? <button type="button" className="unigo-link" onClick={handleAction}>{actionLabel}</button> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
});

export const UnigoServiceTile = memo(function UnigoServiceTile({ title, subtitle, icon, onClick, blue = false, dark = false }) {
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') onClick();
  }, [onClick]);
  return (
    <button type="button" className={cx('unigo-card', dark && 'unigo-card--dark', 'unigo-service-tile')} onClick={handleClick} style={{ border: 'none' }}>
      <div className={cx('unigo-service-tile__icon', blue && 'unigo-service-tile__icon--blue')}>
        <UnigoIcon name={icon} />
      </div>
      <div className="unigo-card__stack">
        <h3 className="unigo-card-title" style={{ fontSize: 18, color: dark ? 'white' : undefined }}>{title}</h3>
        {subtitle ? <p className={cx('unigo-card-caption', dark && 'unigo-card-caption--dark')}>{subtitle}</p> : null}
      </div>
    </button>
  );
});

export const UnigoListRow = memo(function UnigoListRow({ icon, title, description, value, onClick, dark = false, danger = false }) {
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') onClick();
  }, [onClick]);
  return (
    <button type="button" onClick={handleClick} className={cx('unigo-card', dark && 'unigo-card--dark', 'unigo-list-row')} style={{ border: 'none', width: '100%' }}>
      <div className="unigo-list-row__left">
        <div className="unigo-list-row__icon" style={danger ? { background: 'rgba(255,90,95,0.12)', color: '#ff5a5f' } : undefined}>
          <UnigoIcon name={icon} />
        </div>
        <div className="unigo-list-row__meta">
          <div className="unigo-list-row__title" style={{ color: dark ? 'white' : danger ? '#ff5a5f' : undefined }}>{title}</div>
          {description ? <div className={cx('unigo-list-row__desc', dark && 'unigo-list-row__desc--dark')}>{description}</div> : null}
        </div>
      </div>
      {value ? <div style={{ fontWeight: 800, color: dark ? 'white' : undefined }}>{value}</div> : <UnigoIcon name="chevron_right" size={20} />}
    </button>
  );
});

export const UnigoInput = memo(function UnigoInput({ label, value, onChange, placeholder, type = 'text' }) {
  const handleChange = useCallback((event) => {
    if (typeof onChange === 'function') onChange(event.target.value);
  }, [onChange]);
  return (
    <label className="unigo-input">
      <span className="unigo-input__label">{label}</span>
      <input className="unigo-input__field" type={type} value={value} onChange={handleChange} placeholder={placeholder} />
    </label>
  );
});

export const UnigoSelect = memo(function UnigoSelect({ label, value, onChange, options = [] }) {
  const handleChange = useCallback((event) => {
    if (typeof onChange === 'function') onChange(event.target.value);
  }, [onChange]);
  return (
    <label className="unigo-input">
      <span className="unigo-input__label">{label}</span>
      <select className="unigo-select" value={value} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
});

export const UnigoToggle = memo(function UnigoToggle({ checked, onChange }) {
  const handleClick = useCallback(() => {
    if (typeof onChange === 'function') onChange(!checked);
  }, [checked, onChange]);
  return (
    <button type="button" className={cx('unigo-toggle', checked && 'unigo-toggle--on')} onClick={handleClick} aria-pressed={checked}>
      <span className="unigo-toggle__knob" />
    </button>
  );
});

export const UnigoStatusPill = memo(function UnigoStatusPill({ variant = 'info', children }) {
  return <span className={cx('unigo-pill', `unigo-pill--${variant}`)}>{children}</span>;
});

export const UnigoBottomNav = memo(function UnigoBottomNav({ items = [], dark = false }) {
  const navigate = useNavigate();
  const rowClassName = useMemo(() => `unigo-bottom-nav__row unigo-bottom-nav__row--${items.length}`, [items.length]);
  return (
    <nav className={cx('unigo-bottom-nav', dark && 'unigo-bottom-nav--dark')}>
      <div className={rowClassName}>
        {items.map((item) => (
          <button
            key={item.to}
            type="button"
            className={cx('unigo-nav-item', dark && 'unigo-nav-item--dark', item.active && 'unigo-nav-item--active')}
            onClick={() => navigate(item.to)}
          >
            <UnigoIcon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

export const UnigoKpiGrid = memo(function UnigoKpiGrid({ items = [], dark = false }) {
  return (
    <div className="unigo-kpi-grid">
      {items.map((item) => (
        <UnigoCard key={item.label} dark={dark} compact>
          <div className="unigo-kpi">
            <span className={cx('unigo-kpi__label', dark && 'unigo-kpi__label--dark')}>{item.label}</span>
            <span className="unigo-kpi__value">{item.value}</span>
          </div>
        </UnigoCard>
      ))}
    </div>
  );
});

export const UnigoEmptyState = memo(function UnigoEmptyState({ title, description, actionLabel, onAction, dark = false }) {
  return (
    <UnigoCard dark={dark} soft={dark ? '' : 'soft-blue'}>
      <div className="unigo-empty">
        <span className={cx('unigo-pill', 'unigo-pill--info')}>Hozircha bo‘sh</span>
        <h3 className="unigo-card-title" style={{ color: dark ? 'white' : undefined }}>{title}</h3>
        <p className={cx('unigo-card-caption', dark && 'unigo-card-caption--dark')}>{description}</p>
        {actionLabel ? <div style={{ marginTop: 6 }}><UnigoButton variant={dark ? 'dark-secondary' : 'secondary'} onClick={onAction}>{actionLabel}</UnigoButton></div> : null}
      </div>
    </UnigoCard>
  );
});

export const UnigoMapPanel = memo(function UnigoMapPanel({ children, dark = false }) {
  return (
    <UnigoCard dark={dark} compact className="unigo-map-panel">
      <div className="unigo-map-panel__pin" />
      {children}
    </UnigoCard>
  );
});

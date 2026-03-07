import { useEffect } from 'react';
import { translatePhrase } from './domPhraseTranslations';
import { useLanguage } from './useLanguage';

const TEXT_NODE = 3;
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'CODE',
  'PRE',
  'SVG',
  'PATH',
  'IMG',
  'INPUT',
  'OPTION',
  'I',
]);

const ICON_SELECTOR = [
  '.material-symbols-outlined',
  '.material-icons',
  '.material-icons-round',
  '.material-icons-sharp',
  '.material-icons-two-tone',
  '.material-icons-outlined',
  '.anticon',
  '[data-no-auto-translate="true"]',
  '[translate="no"]',
  '[aria-hidden="true"]',
  '[role="img"]',
  '.notranslate',
  'svg',
].join(', ');

const ICON_LIGATURES = new Set([
  'menu','close','search','settings','logout','person','account_circle','history','wallet',
  'payments','help','support','local_taxi','arrow_back','arrow_forward','distance','map',
  'home','favorite','favorite_border','star','location_on','navigation','phone','chat',
  'shopping_bag','directions_car','sell','inventory_2','support_agent'
]);

function looksLikeIconText(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (ICON_LIGATURES.has(raw)) return true;
  if (/^[a-z0-9_]{2,32}$/.test(raw) && !/[\s]/.test(raw)) return true;
  return false;
}

const textOriginals = new WeakMap();
const attrOriginals = new WeakMap();

function shouldSkipElement(el) {
  if (!el || el.nodeType !== 1) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest?.(ICON_SELECTOR)) return true;
  if (el.isContentEditable) return true;
  const className = typeof el.className === 'string' ? el.className : '';
  if (/leaflet-control|leaflet-marker|mapboxgl|gm-style|icon|symbol/i.test(className)) return true;
  const dataRole = `${el.getAttribute?.('data-role') || ''} ${el.getAttribute?.('data-icon') || ''}`;
  if (/icon|symbol/i.test(dataRole)) return true;
  if (looksLikeIconText(el.textContent) && (el.children?.length === 0 || el.childElementCount === 0)) return true;
  return false;
}

function shouldSkipNode(node) {
  const parent = node?.parentElement;
  if (!parent) return true;
  return shouldSkipElement(parent);
}

function translateTextNode(node, language) {
  if (!node || node.nodeType !== TEXT_NODE || shouldSkipNode(node)) return;
  const current = node.nodeValue ?? '';
  if (!current.trim()) return;
  if (looksLikeIconText(current)) return;

  if (!textOriginals.has(node)) {
    textOriginals.set(node, current);
  }
  const original = textOriginals.get(node) ?? current;
  const translated = translatePhrase(language, original);
  if (translated !== current) {
    node.nodeValue = translated;
  }
}

function translateAttributes(el, language) {
  if (!el || !el.getAttribute || shouldSkipElement(el)) return;
  const attrs = ['placeholder', 'title', 'aria-label', 'value', 'alt', 'data-placeholder'];
  let store = attrOriginals.get(el);
  if (!store) {
    store = {};
    attrOriginals.set(el, store);
  }

  for (const attr of attrs) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    if (!(attr in store)) store[attr] = value;
    if (attr === 'value') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      const tag = (el.tagName || '').toUpperCase();
      const isVisibleValue = tag === 'BUTTON' || type === 'button' || type === 'submit' || type === 'reset';
      if (!isVisibleValue) continue;
    }
    const translated = translatePhrase(language, store[attr]);
    if (translated && translated !== value) {
      el.setAttribute(attr, translated);
      if (attr === 'value' && 'value' in el) { try { el.value = translated; } catch {} }
      if (attr === 'placeholder' && 'placeholder' in el) { try { el.placeholder = translated; } catch {} }
      if (attr === 'title' && 'title' in el) { try { el.title = translated; } catch {} }
      if (attr === 'alt' && 'alt' in el) { try { el.alt = translated; } catch {} }
    }
  }
}

function walk(root, language) {
  if (!root) return;
  if (root.nodeType === TEXT_NODE) {
    translateTextNode(root, language);
    return;
  }
  if (root.nodeType !== 1) return;
  if (shouldSkipElement(root)) return;

  translateAttributes(root, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
  let current = walker.currentNode;
  while (current) {
    if (current.nodeType === TEXT_NODE) translateTextNode(current, language);
    else if (current.nodeType === 1) translateAttributes(current, language);
    current = walker.nextNode();
  }
}

export default function LanguageDomSync() {
  const { language } = useLanguage();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const applyAll = () => walk(document.body, language);
    applyAll();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateTextNode(mutation.target, language);
          continue;
        }
        if (mutation.type === 'attributes' && mutation.target?.nodeType === 1) {
          translateAttributes(mutation.target, language);
          walk(mutation.target, language);
          continue;
        }
        mutation.addedNodes?.forEach((node) => walk(node, language));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'value', 'alt', 'data-placeholder'],
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

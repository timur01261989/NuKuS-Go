import { useEffect } from 'react';
import { translatePhrase } from './domPhraseTranslations';
import { useLanguage } from './useLanguage';

const TEXT_NODE = 3;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const textOriginals = new WeakMap();
const attrOriginals = new WeakMap();

function shouldSkipNode(node) {
  const parent = node?.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.closest?.('[data-no-auto-translate="true"]')) return true;
  return false;
}

function translateTextNode(node, language) {
  if (!node || node.nodeType !== TEXT_NODE || shouldSkipNode(node)) return;
  const current = node.nodeValue ?? '';
  if (!current.trim()) return;

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
  if (!el || !el.getAttribute || SKIP_TAGS.has(el.tagName)) return;
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

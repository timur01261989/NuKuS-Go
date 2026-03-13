import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useContacts
 * - Brauzerda `navigator.contacts` bo'lsa (Android Chrome ba'zi hollarda) o'shani ishlatadi.
 * - Aks holda fallback demo ro'yxat beradi.
 */
export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(!!navigator.contacts && !!navigator.contacts.select);
  }, []);

  const loadContacts = useCallback(async () => {
    if (navigator.contacts && navigator.contacts.select) {
      try {
        const props = ["name", "tel"];
        const opts = { multiple: true };
        const list = await navigator.contacts.select(props, opts);
        const normalized = (list || [])
          .map((c, i) => ({
            id: String(i),
            name: Array.isArray(c.name) ? c.name[0] : c.name || "Kontakt",
            phone: Array.isArray(c.tel) ? c.tel[0] : c.tel || "",
          }))
          .filter((x) => x.phone);
        setContacts(normalized);
        return normalized;
      } catch {
        // user cancelled
        return [];
      }
    }

    // fallback demo
    const demo = [
      { id: "1", name: "Ali", phone: "+998901112233" },
      { id: "2", name: "Diyor", phone: "+998933334455" },
      { id: "3", name: "Madina", phone: "+998977778899" },
    ];
    setContacts(demo);
    return demo;
  }, []);

  const hasContacts = useMemo(() => (contacts || []).length > 0, [contacts]);

  return { supported, contacts, hasContacts, loadContacts };
}

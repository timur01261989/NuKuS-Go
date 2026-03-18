import { useCallback, useMemo, useState } from "react";
import { Form, message } from "antd";
import { AddressRepository } from "./myAddresses.helpers.jsx";

export function useMyAddressesController() {
  const [form] = Form.useForm();
  const [items, setItems] = useState(() => AddressRepository.get());
  const [isMapOpen, setIsMapOpen] = useState(false);

  const saveItems = useCallback((nextItems) => {
    setItems(nextItems);
    AddressRepository.save(nextItems);
  }, []);

  const onFinish = useCallback((values) => {
    const newEntry = {
      id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(),
      label: values.label,
      address: values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      createdAt: new Date().toISOString(),
    };
    saveItems([newEntry, ...items]);
    form.resetFields();
    message.success("Manzil muvaffaqiyatli saqlandi");
  }, [form, items, saveItems]);

  const removeAddress = useCallback((id) => {
    saveItems(items.filter((entry) => entry.id !== id));
    message.info("Manzil o'chirildi");
  }, [items, saveItems]);

  const handleMapSelection = useCallback((data) => {
    form.setFieldsValue({
      address: data.address,
      latitude: data.lat,
      longitude: data.lng,
    });
  }, [form]);

  return useMemo(() => ({
    form,
    items,
    isMapOpen,
    setIsMapOpen,
    onFinish,
    removeAddress,
    handleMapSelection,
  }), [form, items, isMapOpen, onFinish, removeAddress, handleMapSelection]);
}

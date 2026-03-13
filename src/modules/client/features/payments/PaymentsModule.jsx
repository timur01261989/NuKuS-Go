import React from 'react';
import { Card, CardHeader, CardContent, Button } from '../../shared/ui/index.js';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';

export function PaymentsModule() {
  const { tr } = useLanguage();
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">{tr("payments.title", "Payments")}</div>
          <div className="text-sm text-gray-600">{tr("payments.subtitle", "Balans, to‘lovlar, tarix")}</div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700">{tr("payments.scaffold", "Bu modul tayyor scaffold. Keyin Click/Payme/Uzcard ulaysiz.")}</div>
          <div className="mt-3 flex gap-2">
            <Button>{tr("payments.topup", "Balansni to‘ldirish")}</Button>
            <Button variant="secondary">{tr("common.history", "Tarix")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

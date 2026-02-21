import React from 'react';
import { Card, CardHeader, CardContent, Button } from '../../shared/ui/index.js';

export function PaymentsModule() {
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">Payments</div>
          <div className="text-sm text-gray-600">Balans, to‘lovlar, tarix</div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700">Bu modul tayyor scaffold. Keyin Click/Payme/Uzcard ulaysiz.</div>
          <div className="mt-3 flex gap-2">
            <Button>Balansni to‘ldirish</Button>
            <Button variant="secondary">Tarix</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

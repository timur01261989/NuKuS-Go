import React from 'react';
import { Card, CardHeader, CardContent, Button } from '../../shared/ui/index.js';

export function GarageModule() {
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">Garage</div>
          <div className="text-sm text-gray-600">Haydovchi mashinalari, hujjatlar, status</div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700">Bu modul tayyor scaffold. Keyin DB bilan ulaysiz.</div>
          <div className="mt-3 flex gap-2">
            <Button>+ Mashina qo‘shish</Button>
            <Button variant="secondary">Hujjatlar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

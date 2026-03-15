import React, { memo, useState } from 'react';
import { UnigoButton, UnigoCard, UnigoHeader, UnigoInput, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientProfileDetails() {
  const [fullName, setFullName] = useState('Temur Abdiev');
  const [phone, setPhone] = useState('+998 90 123 45 67');
  return (
    <UnigoScreen>
      <UnigoHeader back="/profile" title="Profil ma’lumotlari" subtitle="Rasm, ism va telefon raqami" />
      <UnigoCard>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="unigo-avatar" style={{ width: 84, height: 84, fontSize: 24 }}>TA</div>
        </div>
        <div className="unigo-card__stack">
          <UnigoInput label="To‘liq ism-sharif" value={fullName} onChange={setFullName} placeholder="Ism va familiya" />
          <UnigoInput label="Telefon raqam" value={phone} onChange={setPhone} placeholder="+998 XX XXX XX XX" />
          <UnigoButton>Saqlash</UnigoButton>
        </div>
      </UnigoCard>
      <UnigoSection title="Taklif bo‘limi">
        <UnigoCard soft="soft-blue">
          <div className="unigo-card__stack">
            <h3 className="unigo-card-title" style={{ fontSize: 18 }}>Do‘stlarni taklif qilish</h3>
            <p className="unigo-card-caption">Taklif havolasini ulashing va bonus oling.</p>
            <UnigoButton variant="secondary">Taklif ulashish</UnigoButton>
          </div>
        </UnigoCard>
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(ClientProfileDetails);

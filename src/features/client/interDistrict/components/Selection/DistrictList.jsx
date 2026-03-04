import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Select,
  Typography,
  Space,
  Button,
  Divider,
  Switch,
  Input,
  Tooltip,
} from "antd";
import {
  SwapOutlined,
  EnvironmentOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { useDistrict } from "../../context/DistrictContext";

/**
 * Viloyatlar ro'yxati
 */
const REGIONS = [
  { value: "karakalpakstan", label: "Qoraqalpog'iston Respublikasi" },
  { value: "tashkent_city", label: "Toshkent shahri" },
  { value: "tashkent_region", label: "Toshkent viloyati" },
  { value: "andijan", label: "Andijon viloyati" },
  { value: "bukhara", label: "Buxoro viloyati" },
  { value: "fergana", label: "Farg'ona viloyati" },
  { value: "jizzakh", label: "Jizzax viloyati" },
  { value: "namangan", label: "Namangan viloyati" },
  { value: "navoiy", label: "Navoiy viloyati" },
  { value: "kashkadarya", label: "Qashqadaryo viloyati" },
  { value: "samarkand", label: "Samarqand viloyati" },
  { value: "sirdaryo", label: "Sirdaryo viloyati" },
  { value: "surkhandarya", label: "Surxondaryo viloyati" },
  { value: "khorazm", label: "Xorazm viloyati" },
];

/**
 * Viloyatlarga tegishli tuman va shaharlar ro'yxati
 */
const DISTRICTS_BY_REGION = {
  karakalpakstan: [
    "Nukus shahri", "Amudaryo", "Beruniy", "Bo'zatov", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tumani", "Qonliko'l", "Qorao'zak", "Shumanay", "Taxiatosh", "Taxtako'pir", "To'rtko'l", "Xo'jayli"
  ],
  tashkent_city: [
    "Bektemir", "Chilonzor", "Mirobod", "Mirzo Ulug'bek", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yunusobod", "Yangihayot"
  ],
  tashkent_region: [
    "Nurafshon shahri", "Olmaliq shahri", "Angren shahri", "Bekobod shahri", "Chirchiq shahri", "Ohangaron shahri", "Yangiyo'l shahri", "Oqqo'rg'on", "Ohangaron", "Bekobod", "Bo'stonliq", "Bo'ka", "Chinoz", "Qibray", "Quyi Chirchiq", "O'rta Chirchiq", "Parkent", "Piskent", "Toshkent tumani", "Yangiyo'l", "Yuqori Chirchiq", "Zangiota"
  ],
  andijan: [
    "Andijon shahri", "Xonobod shahri", "Andijon tumani", "Asaka", "Baliqchi", "Bo'ston", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko'l", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor"
  ],
  bukhara: [
    "Buxoro shahri", "Kogon shahri", "Buxoro tumani", "G'ijduvon", "Jondor", "Kogon tumani", "Olot", "Peshku", "Qorako'l", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent"
  ],
  fergana: [
    "Farg'ona shahri", "Marg'ilon shahri", "Qo'qon shahri", "Quvasoy shahri", "Buvayda", "Dang'ara", "Farg'ona tumani", "Furqat", "O'zbekiston", "Oltiariq", "Qo'shtepa", "Quva", "Rishton", "So'x", "Toshloq", "Uchko'prik", "Yozovon"
  ],
  jizzakh: [
    "Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin"
  ],
  namangan: [
    "Namangan shahri", "Chortoq", "Chust", "Davlatobod", "Kosonsoy", "Mingbuloq", "Namangan tumani", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"
  ],
  navoiy: [
    "Navoiy shahri", "Zarafshon shahri", "G'ozg'on shahri", "Xatirchi", "Karmana", "Qiziltepa", "Konimex", "Navbahor", "Nurota", "Tomdi", "Uchquduq"
  ],
  kashkadarya: [
    "Qarshi shahri", "Shahrisabz shahri", "Chiroqchi", "Dehqonobod", "G'uzor", "Kasbi", "Kitob", "Ko'kdala", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Qarshi tumani", "Shahrisabz tumani", "Yakkabog'"
  ],
  samarkand: [
    "Samarqand shahri", "Kattaqo'rg'on shahri", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tumani", "Narpay", "Nurobod", "Oqdaryo", "Pastdarg'om", "Paxtachi", "Payariq", "Qo'shrabot", "Samarqand tumani", "Toyloq", "Urgut"
  ],
  sirdaryo: [
    "Guliston shahri", "Yangiyer shahri", "Shirin shahri", "Boyovut", "Guliston tumani", "Xovos", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo tumani"
  ],
  surkhandarya: [
    "Termiz shahri", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo'rg'on", "Sariosiyo", "Sherobod", "Sho'rchi", "Termiz tumani", "Uzun"
  ],
  khorazm: [
    "Urganch shahri", "Xiva shahri", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Tuproqqal'a", "Urganch tumani", "Xazarasp", "Xiva tumani", "Xonqa", "Yangiariq", "Yangibozor"
  ]
};

export default function DistrictList({ onOpenPicker, onLocateMe }) {
  const {
    regionId,
    setRegionId,
    fromDistrict,
    setFromDistrict,
    toDistrict,
    setToDistrict,

    doorToDoor,
    setDoorToDoor,

    pickupAddress,
    setPickupAddress,
    dropoffAddress,
    setDropoffAddress,
    pickupPoint,
    setPickupPoint,
    dropoffPoint,
    setDropoffPoint,
  } = useDistrict();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState("pickup");

  const districtOptions = useMemo(() => {
    const list = DISTRICTS_BY_REGION[regionId] || [];
    return list.map((d) => ({ value: d, label: d }));
  }, [regionId]);

  useEffect(() => {
    setFromDistrict(null);
    setToDistrict(null);
  }, [regionId, setFromDistrict, setToDistrict]);

  useEffect(() => {
    if (doorToDoor && !pickupPoint) {
      handleFindMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doorToDoor]);

  const handleSwap = () => {
    const tempD = fromDistrict;
    setFromDistrict(toDistrict);
    setToDistrict(tempD);

    if (doorToDoor) {
      const tempP = pickupPoint;
      setPickupPoint(dropoffPoint);
      setDropoffPoint(tempP);

      const tempA = pickupAddress;
      setPickupAddress(dropoffAddress);
      setDropoffAddress(tempA);
    }
  };

  const openPicker = (type) => {
    // Agar tashqaridan (MapPicker) ulangan bo'lsa uni ochadi, yo'qsa ichkidagini
    if (onOpenPicker) {
      onOpenPicker(type);
    } else {
      setPickerType(type);
      setPickerOpen(true);
    }
  };

  const handleFindMe = () => {
    if (onLocateMe) {
      onLocateMe();
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolokatsiya qurilmangizda qo'llab-quvvatlanmaydi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mockAddress = `Mo'ljal: Geolokatsiya bilan topilgan joy (${lat.toFixed(
          3
        )}, ${lng.toFixed(3)})`;
        setPickupPoint({ lat, lng });
        setPickupAddress(mockAddress);
      },
      (err) => {
        console.warn(err);
        alert("Geolokatsiyani aniqlab bo'lmadi. GPS yoniqligini tekshiring.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Card
      bodyStyle={{ padding: "16px 12px" }}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "none",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 13, marginBottom: 4, display: "block" }}>
            Hududni tanlang
          </Typography.Text>
          <Select
            style={{ width: "100%" }}
            placeholder="Viloyat yoki Respublikani tanlang"
            value={regionId}
            onChange={setRegionId}
            options={REGIONS}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Qayerdan
              </Typography.Text>
              <Select
                showSearch
                style={{ width: "100%", marginTop: 4 }}
                placeholder="Tumanni tanlang"
                value={fromDistrict}
                onChange={setFromDistrict}
                options={districtOptions}
              />
              {doorToDoor && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Input
                    placeholder="Aniq manzil, ko'cha yoki mo'ljal"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    prefix={<EnvironmentOutlined style={{ color: "#fa8c16" }} />}
                  />
                  <Tooltip title="Xaritadan tanlash">
                    <Button icon={<EnvironmentOutlined />} onClick={() => openPicker("pickup")} />
                  </Tooltip>
                  <Tooltip title="Mening joylashuvim">
                    <Button icon={<AimOutlined />} onClick={handleFindMe} />
                  </Tooltip>
                </div>
              )}
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Qayerga
              </Typography.Text>
              <Select
                showSearch
                style={{ width: "100%", marginTop: 4 }}
                placeholder="Tumanni tanlang"
                value={toDistrict}
                onChange={setToDistrict}
                options={districtOptions}
              />
              {doorToDoor && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Input
                    placeholder="Aniq manzil (Majburiy emas)"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    prefix={<EnvironmentOutlined style={{ color: "#52c41a" }} />}
                  />
                  <Tooltip title="Xaritadan tanlash">
                    <Button icon={<EnvironmentOutlined />} onClick={() => openPicker("dropoff")} />
                  </Tooltip>
                </div>
              )}
            </div>
          </Space>

          <Button
            shape="circle"
            icon={<SwapOutlined style={{ transform: "rotate(90deg)", color: "#1677ff" }} />}
            onClick={handleSwap}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Text strong>Manzildan manzilgacha</Typography.Text>
          <Switch checked={doorToDoor} onChange={setDoorToDoor} />
        </div>
      </Space>

      {/* Agar tashqaridan ulanmagan bo'lsa, ichki (dummy) Modal ishlaydi */}
      {!onOpenPicker && (
        <LocationPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(point, address) => {
            if (pickerType === "pickup") {
              setPickupPoint(point);
              setPickupAddress(address);
            } else {
              setDropoffPoint(point);
              setDropoffAddress(address);
            }
          }}
          pickerType={pickerType}
        />
      )}
    </Card>
  );
}

function LocationPickerModal({ open, onClose, onSelect, pickerType }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#fff",
          height: "60vh",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography.Title level={5}>
          Xaritadan belgilash ({pickerType === "pickup" ? "Qayerdan" : "Qayerga"})
        </Typography.Title>
        <div
          style={{
            flex: 1,
            backgroundColor: "#eee",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Typography.Text type="secondary">
            (Bu yerda xarita ko'rinadi. Hozircha "Tanlash" tugmasini bosing)
          </Typography.Text>
        </div>
        <Space>
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button
            type="primary"
            onClick={() => {
              const rLat = 42.46 + Math.random() * 0.05;
              const rLng = 59.61 + Math.random() * 0.05;
              onSelect({ lat: rLat, lng: rLng }, `Xaritadan tanlangan manzil (${rLat.toFixed(3)})`);
              onClose();
            }}
          >
            Shu yerni tanlash
          </Button>
        </Space>
      </div>
    </div>
  );
}
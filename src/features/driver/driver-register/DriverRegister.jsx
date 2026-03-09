import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Spin,
  Steps,
  Typography,
  message,
} from "antd";
import { supabase } from "@/lib/supabase";
import StepPersonal, {
  PERSONAL_STEP_FIELDS,
  PERSONAL_STEP_TITLE,
} from "./StepPersonal";
import StepVehicle, {
  VEHICLE_STEP_FIELDS,
  VEHICLE_STEP_TITLE,
} from "./StepVehicle";
import StepDocuments, {
  DOCUMENT_STEP_FIELDS,
  DOCUMENT_STEP_TITLE,
  validateDocumentsStep,
} from "./StepDocuments";

const { Title, Text } = Typography;
const PHONE_PREFIX = "+998";

function sanitizeFilename(originalName) {
  const name = String(originalName || "file")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "");
  return name.length ? name.slice(0, 120) : `file_${Date.now()}`;
}

function buildStoragePath(userId, file) {
  const safeName = sanitizeFilename(file?.name);
  const rand = Math.random().toString(36).slice(2, 10);
  return `driver_applications/${userId}/${Date.now()}_${rand}_${safeName}`;
}

async function uploadToStorage(userId, file, bucket = "driver-docs") {
  if (!file) return null;
  const filePath = buildStoragePath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return filePath;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return null;
  return `${PHONE_PREFIX}${digits}`;
}

function splitPhoneLocal(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("998")) return digits.slice(3, 12);
  return digits.slice(0, 9);
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const STEP_CONFIG = [
  {
    title: PERSONAL_STEP_TITLE,
    fields: PERSONAL_STEP_FIELDS,
  },
  {
    title: VEHICLE_STEP_TITLE,
    fields: VEHICLE_STEP_FIELDS,
  },
  {
    title: DOCUMENT_STEP_TITLE,
    fields: DOCUMENT_STEP_FIELDS,
  },
];

export default function DriverRegister() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState({});
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverApplication, setDriverApplication] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const isApprovedDriver = !!(
    driverRow && (driverRow.is_verified === true || driverRow.approved === true)
  );
  const applicationStatus = String(driverApplication?.status || "").toLowerCase();

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setBootLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        const user = session?.user || null;

        if (!active) return;
        setSessionUser(user);

        if (!user?.id) {
          navigate("/login", { replace: true });
          return;
        }

        const [profileRes, appRes, driverRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("driver_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (appRes.error) throw appRes.error;
        if (driverRes.error) throw driverRes.error;

        if (!active) return;

        const profileRow = profileRes.data || null;
        const appRow = appRes.data || null;
        const drvRow = driverRes.data || null;

        setProfile(profileRow);
        setDriverApplication(appRow);
        setDriverRow(drvRow);

        if (drvRow && (drvRow.is_verified === true || drvRow.approved === true)) {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        if (String(appRow?.status || "").toLowerCase() === "pending") {
          navigate("/app/driver/pending", { replace: true });
          return;
        }

        if (String(appRow?.status || "").toLowerCase() === "approved") {
          navigate("/app/driver/dashboard", { replace: true });
          return;
        }

        const fullName = String(profileRow?.full_name || "").trim();
        const parts = fullName ? fullName.split(/\s+/) : [];

        form.setFieldsValue({
          first_name: profileRow?.first_name || parts[0] || "",
          last_name: profileRow?.last_name || parts.slice(1).join(" ") || "",
          phone: splitPhoneLocal(profileRow?.phone || user?.phone || ""),
          transport_type: appRow?.transport_type || "light_car",
          vehicle_brand: appRow?.vehicle_brand || "",
          vehicle_model: appRow?.vehicle_model || "",
          vehicle_year: appRow?.vehicle_year ?? null,
          vehicle_plate: appRow?.vehicle_plate || "",
          vehicle_color: appRow?.vehicle_color || "",
          seat_count: appRow?.seat_count ?? 4,
          requested_max_freight_weight_kg:
            appRow?.requested_max_freight_weight_kg ?? 100,
          requested_payload_volume_m3:
            appRow?.requested_payload_volume_m3 ?? null,
          passport_number: appRow?.passport_number || "",
          driver_license_number: appRow?.driver_license_number || "",
          tech_passport_number: appRow?.tech_passport_number || "",
          father_name: appRow?.father_name || "",
        });
      } catch (error) {
        console.error("DriverRegister bootstrap error:", error);
        message.error(error?.message || "Sahifani yuklashda xatolik yuz berdi");
      } finally {
        if (active) setBootLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [form, navigate]);

  const setFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file || null }));
  };

  const uploaderProps = (key) => ({
    maxCount: 1,
    beforeUpload: (file) => {
      setFile(key, file);
      return false;
    },
    onRemove: () => setFile(key, null),
    fileList: files[key] ? [files[key]] : [],
  });

  const next = async () => {
    await form.validateFields(STEP_CONFIG[step].fields);

    if (step === 2) {
      validateDocumentsStep(files);
    }

    setStep((s) => Math.min(STEP_CONFIG.length - 1, s + 1));
  };

  const prev = () => {
    if (step === 0) {
      navigate("/app/client/home");
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async (values) => {
    try {
      setSubmitting(true);

      validateDocumentsStep(files);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user?.id) throw new Error("Foydalanuvchi topilmadi");

      const phone = normalizePhone(
        values.phone || profile?.phone || sessionUser?.phone
      );
      if (!phone) throw new Error("Telefon raqam noto'g'ri");

      const fullName = `${values.first_name || ""} ${values.last_name || ""}`.trim();

      const profilePayload = {
        id: user.id,
        phone,
        full_name: fullName || null,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        role: profile?.role || "client",
        current_role: profile?.current_role || "client",
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, {
          onConflict: "id",
        });

      if (profileError) throw profileError;

      const payload = {
        user_id: user.id,
        status: "pending",
        transport_type: values.transport_type,
        last_name: values.last_name || null,
        first_name: values.first_name || null,
        father_name: values.father_name || null,
        phone,
        passport_number: values.passport_number || null,
        driver_license_number: values.driver_license_number || null,
        tech_passport_number: values.tech_passport_number || null,
        vehicle_brand: values.vehicle_brand || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_year: toNullableNumber(values.vehicle_year),
        vehicle_plate: values.vehicle_plate || null,
        vehicle_color: values.vehicle_color || null,
        seat_count: toNullableNumber(values.seat_count),
        requested_max_freight_weight_kg: toNullableNumber(
          values.requested_max_freight_weight_kg
        ),
        requested_payload_volume_m3: toNullableNumber(
          values.requested_payload_volume_m3
        ),
        can_luggage: !!values.can_luggage,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      for (const [field, key] of [
        ["selfie_url", "selfie"],
        ["passport_front_url", "passport_front"],
        ["passport_back_url", "passport_back"],
        ["tech_passport_front_url", "tech_front"],
        ["tech_passport_back_url", "tech_back"],
        ["driver_license_front_url", "license_front"],
        ["driver_license_back_url", "license_back"],
        ["car_photo_1", "car_1"],
        ["car_photo_2", "car_2"],
        ["car_photo_3", "car_3"],
        ["car_photo_4", "car_4"],
      ]) {
        payload[field] = await uploadToStorage(user.id, files[key]);
      }

      if (driverApplication?.id) {
        payload.id = driverApplication.id;
      }

      const { error } = await supabase.from("driver_applications").upsert(payload, {
        onConflict: driverApplication?.id ? "id" : "user_id",
      });

      if (error) throw error;

      message.success(
        "Ariza yuborildi. Admin tekshiruvdan keyin driver rejimi ochiladi."
      );
      navigate("/app/driver/pending", { replace: true });
    } catch (error) {
      console.error("Driver register error:", error);
      message.error(error?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootLoading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isApprovedDriver) {
    return (
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
        <Card bordered={false} style={{ borderRadius: 20 }}>
          <Title level={3} style={{ margin: 0 }}>
            Siz allaqachon tasdiqlangansiz
          </Title>
          <Button
            type="primary"
            onClick={() => navigate("/app/driver/dashboard", { replace: true })}
          >
            Driver dashboard ga o'tish
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Haydovchi bo'lish uchun ariza
        </Title>
        <Text type="secondary">
          Bitta foydalanuvchi ID barcha modullar uchun ishlatiladi. Driver rejimi
          faqat admin tasdiqlagandan keyin ochiladi.
        </Text>

        {applicationStatus === "rejected" ? (
          <Alert
            style={{ marginTop: 16, marginBottom: 8 }}
            type="warning"
            showIcon
            message="Arizangiz rad etilgan. Tuzatib qayta yuborishingiz mumkin."
            description={driverApplication?.rejection_reason || undefined}
          />
        ) : null}

        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <Steps current={step} items={STEP_CONFIG.map((item) => ({ title: item.title }))} />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{
            transport_type: "light_car",
            seat_count: 4,
            requested_max_freight_weight_kg: 100,
          }}
        >
          {step === 0 ? <StepPersonal phonePrefix={PHONE_PREFIX} /> : null}

          {step === 1 ? <StepVehicle currentYear={currentYear} /> : null}

          {step === 2 ? <StepDocuments uploaderProps={uploaderProps} files={files} /> : null}

          <div
            style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}
          >
            <Button onClick={prev}>Ortga</Button>
            {step < STEP_CONFIG.length - 1 ? (
              <Button type="primary" onClick={next}>
                Keyingi
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" loading={submitting}>
                Arizani yuborish
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}

import { supabase } from "@/lib/supabase";

const BUCKET = "driver-documents";

function extFromFile(file) {
  const original = file?.name || "";
  const ext = original.includes(".") ? original.split(".").pop() : "jpg";
  return String(ext || "jpg").toLowerCase();
}

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function uploadSingleFile(userId, fieldKey, file) {
  if (!file) {
    return {
      path: null,
      url: null,
    };
  }

  const ext = extFromFile(file);
  const safeField = sanitizeSegment(fieldKey);
  const fileName = ${Date.now()}_${safeField}.${ext};
  const path = ${userId}/${safeField}/${fileName};

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(Upload xato (${fieldKey}): ${uploadError.message});
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    path,
    url: publicUrlData?.publicUrl ?? null,
  };
}

export async function getMyDriverApplication() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Foydalanuvchi topilmadi");
  }

  const { data, error } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function submitDriverApplication(formData, files) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Login qilinmagan");
  }

  const userId = user.id;

  // optional: check existing app
  const { data: existing, error: existingError } = await supabase
    .from("driver_applications")
    .select("id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing && existing.status && existing.status !== "pending") {
    throw new Error(
      Sizda allaqachon ${existing.status} holatidagi ariza bor
    );
  }

  const uploads = {
    passportFront: await uploadSingleFile(userId, "passport_front", files.passportFront),
    passportBack: await uploadSingleFile(userId, "passport_back", files.passportBack),
    licenseFront: await uploadSingleFile(userId, "license_front", files.licenseFront),
    texPassportFront: await uploadSingleFile(userId, "texpassport_front", files.texPassportFront),

    carPhoto1: await uploadSingleFile(userId, "car_photo_1", files.carPhoto1),
    carPhoto2: await uploadSingleFile(userId, "car_photo_2", files.carPhoto2),
    carPhoto3: await uploadSingleFile(userId, "car_photo_3", files.carPhoto3),
    carPhoto4: await uploadSingleFile(userId, "car_photo_4", files.carPhoto4),
  };

  const payload = {
    user_id: userId,

    last_name: formData.lastName || null,
    first_name: formData.firstName || null,
    middle_name: formData.middleName || null,
    phone: formData.phone || null,
    passport_number: formData.passportNumber || null,

    vehicle_type: formData.vehicleType || null,
    brand: formData.brand || null,
    model: formData.model || null,
    plate_number: formData.plateNumber || null,
    year: formData.year || null,
    color: formData.color || null,
    seats: formData.seats ? Number(formData.seats) : null,
    cargo_kg: formData.cargoKg ? Number(formData.cargoKg) : null,
    cargo_m3: formData.cargoM3 ? Number(formData.cargoM3) : null,

    passport_front_path: uploads.passportFront.path,
    passport_back_path: uploads.passportBack.path,
    license_front_path: uploads.licenseFront.path,
    texpassport_front_path: uploads.texPassportFront.path,
    car_photo_1_path: uploads.carPhoto1.path,
    car_photo_2_path: uploads.carPhoto2.path,
    car_photo_3_path: uploads.carPhoto3.path,
    car_photo_4_path: uploads.carPhoto4.path,

    passport_front_url: uploads.passportFront.url,
    passport_back_url: uploads.passportBack.url,
    license_front_url: uploads.licenseFront.url,
    texpassport_front_url: uploads.texPassportFront.url,

    car_photo_1_url: uploads.carPhoto1.url,
    car_photo_2_url: uploads.carPhoto2.url,
    car_photo_3_url: uploads.carPhoto3.url,
    car_photo_4_url: uploads.carPhoto4.url,

    status: "pending",
  };

  let result;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("driver_applications")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    result = data;
  } else {
    const { data, error } = await supabase
      .from("driver_applications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    result = data;
  }

  return result;
}
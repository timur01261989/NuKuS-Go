export default function StepVehicle({ formData, updateForm, onBack, onNext }) {
  return (
    <div>
      <h3>Transport ma'lumotlari</h3>

      <input
        placeholder="Transport turi"
        value={formData.vehicleType}
        onChange={(e) => updateForm({ vehicleType: e.target.value })}
      />

      <input
        placeholder="Mashina markasi"
        value={formData.brand}
        onChange={(e) => updateForm({ brand: e.target.value })}
      />

      <input
        placeholder="Model"
        value={formData.model}
        onChange={(e) => updateForm({ model: e.target.value })}
      />

      <input
        placeholder="Davlat raqami"
        value={formData.plateNumber}
        onChange={(e) => updateForm({ plateNumber: e.target.value })}
      />

      <input
        placeholder="Yili"
        value={formData.year}
        onChange={(e) => updateForm({ year: e.target.value })}
      />

      <input
        placeholder="Rangi"
        value={formData.color}
        onChange={(e) => updateForm({ color: e.target.value })}
      />

      <button type="button" onClick={onBack}>
        Ortga
      </button>
      <button type="button" onClick={onNext}>
        Keyingi
      </button>
    </div>
  );
}

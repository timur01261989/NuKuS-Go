export default function StepPersonal({ formData, updateForm, onNext }) {
  return (
    <div>
      <h3>Shaxsiy ma'lumot</h3>

      <input
        placeholder="Familiya"
        value={formData.lastName}
        onChange={(e) => updateForm({ lastName: e.target.value })}
      />

      <input
        placeholder="Ism"
        value={formData.firstName}
        onChange={(e) => updateForm({ firstName: e.target.value })}
      />

      <input
        placeholder="Otasining ismi"
        value={formData.middleName}
        onChange={(e) => updateForm({ middleName: e.target.value })}
      />

      <input
        placeholder="Telefon"
        value={formData.phone}
        onChange={(e) => updateForm({ phone: e.target.value })}
      />

      <input
        placeholder="Pasport raqami"
        value={formData.passportNumber}
        onChange={(e) => updateForm({ passportNumber: e.target.value })}
      />

      <button type="button" onClick={onNext}>
        Keyingi
      </button>
    </div>
  );
}

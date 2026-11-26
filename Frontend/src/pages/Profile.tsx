import axios from "axios";
import { useEffect, useState, type FormEvent } from "react";
import api from "../utils/api";
import { isValidPhone } from "../utils/validation";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const user = response.data.user;
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
        });
      } catch (requestError: unknown) {
        setError(
          axios.isAxiosError<{ message?: string }>(requestError)
            ? requestError.response?.status === 404
              ? "The profile endpoint is missing from the configured backend. Deploy the latest backend before updating your profile."
              : requestError.response?.data?.message || "Unable to load profile."
            : "Unable to load profile."
        );
      }
    };
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setStatus("");
    setError("");
    if (!isValidPhone(form.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch("/auth/profile", form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setStatus(response.data.message);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...response.data.user }));
      window.dispatchEvent(new Event("authChanged"));
    } catch (requestError: unknown) {
      setError(
        axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.status === 404
            ? "The profile endpoint is missing from the configured backend. Deploy the latest backend before updating your profile."
            : requestError.response?.data?.message || "Unable to update profile."
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">My Profile</h1>
      {status && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">{status}</p>}
      {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-800">{error}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow">
        {(["name", "email", "phone", "address"] as const).map((field) => (
          <label key={field} className="block font-medium capitalize">
            {field}
            <input
              required
              type={
                field === "email"
                  ? "email"
                  : field === "phone"
                    ? "tel"
                    : "text"
              }
              minLength={
                field === "name"
                  ? 2
                  : field === "address"
                    ? 5
                    : field === "phone"
                      ? 7
                      : undefined
              }
              maxLength={
                field === "name"
                  ? 80
                  : field === "email"
                    ? 254
                    : field === "address"
                      ? 300
                      : field === "phone"
                        ? 20
                        : undefined
              }
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              className="mt-1 w-full rounded border p-3"
            />
          </label>
        ))}
        <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}

export default Profile;

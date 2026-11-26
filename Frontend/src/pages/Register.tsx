import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/petService";
import { isValidPhone } from "../utils/validation";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "adopter" as "adopter" | "foster",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isValidPhone(formData.phone)) {
      setError("Enter a valid phone number.");
      return;
    }

    try {
      setLoading(true);

      await registerUser(formData);

      navigate("/login");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md"
        >
          <h1 className="text-3xl font-bold text-center mb-6">
            Register
          </h1>
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          <label className="mb-4 block">
            <span className="mb-2 block font-semibold">I want to join as</span>
            <select
              name="role"
              value={formData.role}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  role: event.target.value as "adopter" | "foster",
                })
              }
              className="w-full border p-3 rounded"
            >
              <option value="adopter">Adopter</option>
              <option value="foster">Foster caregiver</option>
            </select>
          </label>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            minLength={2}
            maxLength={80}
            className="w-full border p-3 rounded mb-4"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            maxLength={254}
            className="w-full border p-3 rounded mb-4"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            maxLength={72}
            className="w-full border p-3 rounded mb-4"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={8}
            maxLength={72}
            className="w-full border p-3 rounded mb-4"
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            minLength={7}
            maxLength={20}
            className="w-full border p-3 rounded mb-4"
            required
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            minLength={5}
            maxLength={300}
            className="w-full border p-3 rounded mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </>
  );
}

export default Register;
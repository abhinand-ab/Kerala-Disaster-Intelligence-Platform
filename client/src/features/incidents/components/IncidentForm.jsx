import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

import { createIncident } from "../services/incidentService";
import {
  INCIDENT_CATEGORIES,
  SEVERITY_LEVELS,
} from "../constants/incidentConstants";

const incidentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  category: z.string().min(1, "Select a category"),
  severity: z.string().min(1, "Select severity"),
  district: z.string().min(2, "District is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string().optional(),
});

function LocationSelectorMap({ setValue, watchedLat, watchedLng }) {
  const map = useMapEvents({
    click(e) {
      setValue("latitude", e.latlng.lat);
      setValue("longitude", e.latlng.lng);
    }
  });

  useEffect(() => {
    if (watchedLat && watchedLng) {
      map.setView([watchedLat, watchedLng], map.getZoom());
    }
  }, [watchedLat, watchedLng, map]);

  return watchedLat && watchedLng ? (
    <Marker position={[watchedLat, watchedLng]} />
  ) : null;
}

const IncidentForm = ({
  latitude,
  longitude,
  onSuccess,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      severity: "Low",
      district: "",
      latitude: latitude || 10.8505,
      longitude: longitude || 76.2711,
      address: "",
    },
  });

  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        location: {
          district: data.district,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          address: data.address,
        },
      };

      const incident = await createIncident(payload);

      await queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });

      toast.success("Incident reported successfully");
      reset();

      if (onSuccess) {
        onSuccess(incident);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Incident Error:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Unable to report incident.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block mb-1 text-xs font-semibold text-slate-700">
          Incident Title
        </label>
        <input
          {...register("title")}
          placeholder="Enter incident title"
          className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
        />
        {errors.title && (
          <p className="text-red-500 text-[10px] font-semibold mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block mb-1 text-xs font-semibold text-slate-700">
          Description
        </label>
        <textarea
          rows={3}
          {...register("description")}
          placeholder="Describe the incident..."
          className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
        />
        {errors.description && (
          <p className="text-red-500 text-[10px] font-semibold mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category & Severity Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            Category
          </label>
          <select
            {...register("category")}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-800"
          >
            <option value="">Select Category</option>
            {INCIDENT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-[10px] font-semibold mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            Severity
          </label>
          <select
            {...register("severity")}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-800"
          >
            {SEVERITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.severity && (
            <p className="text-red-500 text-[10px] font-semibold mt-1">
              {errors.severity.message}
            </p>
          )}
        </div>
      </div>

      {/* District & Landmark Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            District
          </label>
          <select
            {...register("district")}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-850"
          >
            <option value="">Select District</option>
            {[
              "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
              "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
              "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
            ].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.district && (
            <p className="text-red-500 text-[10px] font-semibold mt-1">
              {errors.district.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            Landmark Address
          </label>
          <input
            {...register("address")}
            placeholder="e.g. Near Bridge"
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Coordinates Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-705">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            {...register("latitude")}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-slate-800"
          />
          {errors.latitude && (
            <p className="text-red-500 text-[10px] font-semibold mt-1">
              {errors.latitude.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-705">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            {...register("longitude")}
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-slate-800"
          />
          {errors.longitude && (
            <p className="text-red-500 text-[10px] font-semibold mt-1">
              {errors.longitude.message}
            </p>
          )}
        </div>
      </div>

      {/* Interactive mini map selector */}
      <div className="space-y-1">
        <span className="block text-[11px] font-bold text-slate-500">
          Position Location (Click map point to refine coordinates):
        </span>
        <div className="h-44 w-full rounded-xl border border-slate-200 overflow-hidden relative z-10">
          <MapContainer
            center={[watchedLat || 10.8505, watchedLng || 76.2711]}
            zoom={8}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationSelectorMap
              setValue={setValue}
              watchedLat={Number(watchedLat)}
              watchedLng={Number(watchedLng)}
            />
          </MapContainer>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Reporting..." : "Report Incident"}
        </button>
      </div>
    </form>
  );
};

export default IncidentForm;
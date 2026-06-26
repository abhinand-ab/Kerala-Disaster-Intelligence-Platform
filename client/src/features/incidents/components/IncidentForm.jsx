import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
      latitude,
      longitude,
      address: "",
    },
  });

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
        console.log(error.response.data);
        toast.error(error.response.data.message || "Unable to report incident.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Title */}

      <div>
        <label className="block mb-2 font-medium">
          Incident Title
        </label>

        <input
          {...register("title")}
          placeholder="Enter incident title"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {errors.title && (
          <p className="text-red-500 text-sm mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}

      <div>
        <label className="block mb-2 font-medium">
          Description
        </label>

        <textarea
          rows={4}
          {...register("description")}
          placeholder="Describe the incident..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category */}

      <div>
        <label className="block mb-2 font-medium">
          Category
        </label>

        <select
          {...register("category")}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        >
          <option value="">
            Select Category
          </option>

          {INCIDENT_CATEGORIES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {errors.category && (
          <p className="text-red-500 text-sm mt-1">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Severity */}

      <div>
        <label className="block mb-2 font-medium">
          Severity
        </label>

        <select
          {...register("severity")}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        >
          {SEVERITY_LEVELS.map((level) => (
            <option
              key={level}
              value={level}
            >
              {level}
            </option>
          ))}
        </select>

        {errors.severity && (
          <p className="text-red-500 text-sm mt-1">
            {errors.severity.message}
          </p>
        )}
      </div>

      {/* District */}

      <div>
        <label className="block mb-2 font-medium">
          District
        </label>

        <input
          {...register("district")}
          placeholder="Enter district"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {errors.district && (
          <p className="text-red-500 text-sm mt-1">
            {errors.district.message}
          </p>
        )}
      </div>

      {/* Address */}

      <div>
        <label className="block mb-2 font-medium">
          Address
        </label>

        <textarea
          rows={3}
          {...register("address")}
          placeholder="Nearest landmark or address"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Coordinates */}

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="block mb-2 font-medium">
            Latitude
          </label>

          <input
            {...register("latitude")}
            readOnly
            className="w-full rounded-lg bg-slate-100 border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Longitude
          </label>

          <input
            {...register("longitude")}
            readOnly
            className="w-full rounded-lg bg-slate-100 border border-slate-300 px-4 py-3"
          />
        </div>

      </div>

      {/* Buttons */}

      <div className="flex justify-end gap-3 pt-4">

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading
            ? "Reporting..."
            : "Report Incident"}
        </button>

      </div>

    </form>
  );
};

export default IncidentForm;
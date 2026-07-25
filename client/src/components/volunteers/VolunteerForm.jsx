import { useEffect, useId, useState } from "react";

const formatInitialData = (initialData) => ({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    age: initialData?.age || "",
    gender: initialData?.gender || "",
    bloodGroup: initialData?.bloodGroup || "",
    address: initialData?.address || "",
    district: initialData?.district || "",
    latitude: initialData?.latitude ?? "",
    longitude: initialData?.longitude ?? "",
    skills: Array.isArray(initialData?.skills) ? initialData.skills.join(", ") : initialData?.skills || "",
    certifications: initialData?.certifications || "",
    organization: initialData?.organization || "",
    team: initialData?.team || "",
    availability: initialData?.availability ?? true,
    status: initialData?.status || "Available",
    emergencyContact: initialData?.emergencyContact || "",
});

// Shared input/select/textarea className token for all form fields
const fieldCls = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const labelCls = "mb-2 block text-sm font-medium text-slate-700";

const VolunteerForm = ({
    initialData,
    onSubmit,
    loading,
    mode,
    formId = "volunteer-modal-form",
    firstFocusableRef,
    lastFocusableRef,
}) => {
    const [formData, setFormData] = useState(() => formatInitialData(initialData));

    const fullNameId = useId();
    const phoneId = useId();
    const emailId = useId();
    const ageId = useId();
    const genderId = useId();
    const bloodGroupId = useId();
    const addressId = useId();
    const districtId = useId();
    const latitudeId = useId();
    const longitudeId = useId();
    const skillsId = useId();
    const certificationsId = useId();
    const organizationId = useId();
    const teamId = useId();
    const statusId = useId();
    const emergencyContactId = useId();

    useEffect(() => {
        setFormData(formatInitialData(initialData));
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({
            ...formData,
            age: formData.age === "" ? "" : Number(formData.age),
            skills: formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
            latitude: formData.latitude === "" ? 0 : Number(formData.latitude),
            longitude: formData.longitude === "" ? 0 : Number(formData.longitude),
            availability: formData.status === "Available",
        });
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <label htmlFor={fullNameId} className={labelCls}>Full Name</label>
                    <input
                        id={fullNameId} name="fullName" type="text" ref={firstFocusableRef}
                        value={formData.fullName} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="Enter volunteer full name"
                    />
                </div>

                <div>
                    <label htmlFor={emailId} className={labelCls}>Email Address</label>
                    <input
                        id={emailId} name="email" type="email"
                        value={formData.email} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="Enter email address"
                    />
                </div>

                <div>
                    <label htmlFor={phoneId} className={labelCls}>Phone Number</label>
                    <input
                        id={phoneId} name="phone" type="text"
                        value={formData.phone} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="Enter phone number"
                    />
                </div>

                <div>
                    <label htmlFor={ageId} className={labelCls}>Age</label>
                    <input
                        id={ageId} name="age" type="number"
                        value={formData.age} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="Age"
                    />
                </div>

                <div>
                    <label htmlFor={genderId} className={labelCls}>Gender</label>
                    <select
                        id={genderId} name="gender"
                        value={formData.gender} onChange={handleChange} disabled={loading}
                        className={fieldCls}
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label htmlFor={bloodGroupId} className={labelCls}>Blood Group</label>
                    <input
                        id={bloodGroupId} name="bloodGroup" type="text"
                        value={formData.bloodGroup} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="e.g. O+ve"
                    />
                </div>

                <div>
                    <label htmlFor={districtId} className={labelCls}>District</label>
                    <input
                        id={districtId} name="district" type="text"
                        value={formData.district} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="Enter district name"
                    />
                </div>

                <div>
                    <label htmlFor={teamId} className={labelCls}>Rescue Team Name</label>
                    <input
                        id={teamId} name="team" type="text"
                        value={formData.team} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="e.g. NDRF Team Alpha (Optional)"
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor={addressId} className={labelCls}>Address</label>
                    <textarea
                        id={addressId} name="address"
                        value={formData.address} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="Residential address..." rows={2}
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor={skillsId} className={labelCls}>Skills (Comma separated)</label>
                    <input
                        id={skillsId} name="skills" type="text"
                        value={formData.skills} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="e.g. First Aid, Swimming, Rope Rescue, Navigation"
                    />
                </div>

                <div>
                    <label htmlFor={certificationsId} className={labelCls}>Certifications</label>
                    <input
                        id={certificationsId} name="certifications" type="text"
                        value={formData.certifications} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="e.g. Red Cross Certified"
                    />
                </div>

                <div>
                    <label htmlFor={organizationId} className={labelCls}>Organization</label>
                    <input
                        id={organizationId} name="organization" type="text"
                        value={formData.organization} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="Affiliated organization name"
                    />
                </div>

                <div>
                    <label htmlFor={statusId} className={labelCls}>Status</label>
                    <select
                        id={statusId} name="status"
                        value={formData.status} onChange={handleChange} disabled={loading}
                        className={fieldCls}
                    >
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="On Duty">On Duty</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="Unavailable">Unavailable</option>
                    </select>
                </div>

                <div>
                    <label htmlFor={emergencyContactId} className={labelCls}>Emergency Contact</label>
                    <input
                        id={emergencyContactId} name="emergencyContact" type="text"
                        value={formData.emergencyContact} onChange={handleChange} disabled={loading}
                        className={fieldCls} placeholder="Emergency contact phone number"
                    />
                </div>

                <div>
                    <label htmlFor={latitudeId} className={labelCls}>Latitude</label>
                    <input
                        id={latitudeId} name="latitude" type="number" step="any"
                        value={formData.latitude} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="e.g. 10.8505"
                    />
                </div>

                <div>
                    <label htmlFor={longitudeId} className={labelCls}>Longitude</label>
                    <input
                        id={longitudeId} name="longitude" type="number" step="any"
                        value={formData.longitude} onChange={handleChange} disabled={loading} required
                        className={fieldCls} placeholder="e.g. 76.2711"
                    />
                </div>
            </div>

            <input ref={lastFocusableRef} aria-hidden="true" tabIndex={-1} className="sr-only" type="button" />
        </form>
    );
};

export default VolunteerForm;

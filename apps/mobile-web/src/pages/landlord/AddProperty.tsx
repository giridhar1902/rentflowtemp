import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  LocationPicker,
  ExtractedAddress,
} from "../../components/ui/LocationPicker";

interface Tenant {
  id: number;
  name: string;
  email: string;
}

interface Unit {
  id: number;
  name: string;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  occupancy: number;
  tenants: Tenant[];
}

type PropertyDocumentFiles = {
  coverPhoto: File | null;
  coverPhotoPreviewUrl: string | null;
  propertyDeed: File | null;
  rentAgreementTemplate: File | null;
};

const extractApiErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }

  const raw = error.message?.trim();
  if (!raw) {
    return "Unknown error";
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof parsed.error?.message === "string" && parsed.error.message) {
      return parsed.error.message;
    }
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    // Not JSON; keep raw message.
  }

  return raw;
};

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [documentFiles, setDocumentFiles] = useState<PropertyDocumentFiles>({
    coverPhoto: null,
    coverPhotoPreviewUrl: null,
    propertyDeed: null,
    rentAgreementTemplate: null,
  });
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const propertyDeedInputRef = useRef<HTMLInputElement | null>(null);
  const rentTemplateInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    propertyName: "",
    propertyType: "Apartment",
    address: "",
    city: "",
    state: "",
    pincode: "",
    ownership: "Self-Owned",

    // Step 2: Structure & Units
    totalUnits: 1,
    floors: 1,
    units: [] as Unit[],

    // Step 3: Rent & Financials
    rentAmount: "",
    securityDeposit: "",
    maintenance: "",
    dueDate: "1",
    paymentMethods: {
      upi: true,
      bank: true,
      cash: false,
    },

    // Step 4: Amenities
    parking: false,
    powerBackup: false,
    waterSupply: "Corporation",
    wifi: false,
    lift: false,
    security: false,
    gym: false,

    // Step 5: Settings
    partialPayments: false,
    allowCash: false,
    cashApproval: true,
    autoReminders: true,

    // Step 6: Documents
    image: null as string | null,
  });

  // Temp State for adding Units dynamically
  const [tempUnit, setTempUnit] = useState<Unit>({
    id: 0,
    name: "",
    bedrooms: 2,
    bathrooms: 1,
    furnishing: "Semi-Furnished",
    occupancy: 4,
    tenants: [],
  });

  // Temp State for adding Tenants to a Unit dynamically
  const [tempTenant, setTempTenant] = useState({ name: "", email: "" });

  const totalSteps = 6;
  const steps = [
    "Basic Details",
    "Structure & Units",
    "Rent & Financials",
    "Amenities",
    "Settings",
    "Documents",
  ];

  // Load draft on mount with robust merging
  useEffect(() => {
    const savedDraft = localStorage.getItem("propertyDraft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          units: Array.isArray(parsed.units) ? parsed.units : [],
        }));
        // Also restore step if saved? (Optional, staying on 1 is safer to review)
      } catch (e) {
        console.error("Failed to load draft");
        localStorage.removeItem("propertyDraft");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (documentFiles.coverPhotoPreviewUrl) {
        URL.revokeObjectURL(documentFiles.coverPhotoPreviewUrl);
      }
    };
  }, [documentFiles.coverPhotoPreviewUrl]);

  const validateStep = (step: number): boolean => {
    setValidationError(null);
    switch (step) {
      case 1:
        if (!formData.propertyName.trim()) {
          setValidationError("Property Name is required.");
          return false;
        }
        if (!formData.address.trim()) {
          setValidationError("Address is required.");
          return false;
        }
        if (
          !formData.city.trim() ||
          !formData.state.trim() ||
          !formData.pincode.trim()
        ) {
          setValidationError("City, State, and Pincode are required.");
          return false;
        }
        return true;
      case 2:
        // Optional validation: require at least one unit if type is not single unit?
        // keeping flexible for now
        return true;
      case 3:
        if (!formData.rentAmount) {
          setValidationError("Monthly Rent amount is required.");
          return false;
        }
        return true;
      case 6:
        // Property Deed is optional for smoother demo experience
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      window.scrollTo(0, 0);
      return;
    }

    // Auto-save draft on progression
    saveDraft();

    if (currentStep < totalSteps) {
      setCurrentStep((curr) => curr + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((curr) => curr - 1);
      window.scrollTo(0, 0);
    } else {
      navigate(-1);
    }
  };

  const saveDraft = () => {
    localStorage.setItem("propertyDraft", JSON.stringify(formData));
    setLastSaved(new Date());
  };

  const handleManualSave = () => {
    saveDraft();
    const btn = document.getElementById("save-draft-btn");
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = "Saved!";
      setTimeout(() => (btn.innerText = originalText), 2000);
    }
  };

  // --- Unit Management Logic ---
  const addUnit = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!tempUnit.name.trim()) {
      setNameError(true);
      return;
    }

    setNameError(false);

    const newUnit: Unit = {
      ...tempUnit,
      id: Date.now() + Math.random(),
    };

    setFormData((prev) => ({
      ...prev,
      units: [...(prev.units || []), newUnit],
    }));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    setTempUnit({
      id: 0,
      name: "",
      bedrooms: 1,
      bathrooms: 1,
      furnishing: "Unfurnished",
      occupancy: 2,
      tenants: [],
    });
  };

  const removeUnit = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== id),
    }));
  };

  // --- Tenant Management Logic ---
  const addTenantToUnit = () => {
    if (tempTenant.name && tempTenant.email) {
      setTempUnit((prev) => ({
        ...prev,
        tenants: [
          ...prev.tenants,
          { ...tempTenant, id: Date.now() + Math.random() },
        ],
      }));
      setTempTenant({ name: "", email: "" });
    }
  };

  const removeTenantFromUnit = (tenantId: number) => {
    setTempUnit((prev) => ({
      ...prev,
      tenants: prev.tenants.filter((t) => t.id !== tenantId),
    }));
  };

  const handleCoverPhotoSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Cover photo must be an image file.");
      event.target.value = "";
      return;
    }

    setDocumentFiles((prev) => {
      if (prev.coverPhotoPreviewUrl) {
        URL.revokeObjectURL(prev.coverPhotoPreviewUrl);
      }

      return {
        ...prev,
        coverPhoto: file,
        coverPhotoPreviewUrl: URL.createObjectURL(file),
      };
    });
    event.target.value = "";
  };

  const handlePdfSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "propertyDeed" | "rentAgreementTemplate",
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed for legal documents.");
      event.target.value = "";
      return;
    }

    setDocumentFiles((prev) => ({
      ...prev,
      [target]: file,
    }));
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!session) {
      alert("Your session expired. Please login again.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFloors = Number(formData.floors);
      const normalizedFloors =
        Number.isFinite(parsedFloors) && parsedFloors > 0
          ? Math.floor(parsedFloors)
          : 1;
      const parsedTotalUnits = Number(formData.totalUnits);
      const normalizedTotalUnits =
        formData.units.length > 0
          ? formData.units.length
          : Number.isFinite(parsedTotalUnits) && parsedTotalUnits > 0
            ? Math.floor(parsedTotalUnits)
            : 1;

      const amenities = [
        formData.parking ? "Parking" : null,
        formData.powerBackup ? "Power Backup" : null,
        formData.wifi ? "Wi-Fi" : null,
        formData.lift ? "Lift / Elevator" : null,
        formData.security ? "24/7 Security" : null,
        formData.gym ? "Gym / Fitness Center" : null,
        formData.waterSupply ? `Water Supply: ${formData.waterSupply}` : null,
      ].filter((item): item is string => Boolean(item));

      const createdProperty = await api.createProperty(session.access_token, {
        name: formData.propertyName.trim(),
        propertyType: formData.propertyType.trim(),
        floors: normalizedFloors,
        totalUnits: normalizedTotalUnits,
        amenities,
        ownership:
          formData.ownership.toUpperCase() === "MANAGED"
            ? "MANAGED"
            : "SELF_OWNED",
        addressLine1: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.pincode.trim(),
        country: "US",
      });

      const sourceUnits =
        formData.units.length > 0
          ? formData.units
          : [
              {
                id: Date.now(),
                name: "Unit 1",
                bedrooms: 1,
                bathrooms: 1,
                furnishing: "Unfurnished",
                occupancy: 2,
                tenants: [],
              },
            ];

      for (const unit of sourceUnits) {
        const createdUnit = await api.createUnit(
          session.access_token,
          createdProperty.id,
          {
            name: unit.name.trim() || "Unit",
            bedrooms: Number(unit.bedrooms ?? 0),
            bathrooms: Number(unit.bathrooms ?? 0),
            occupancy: Number(unit.occupancy ?? 1),
            furnishing: unit.furnishing,
            monthlyRent: Number(formData.rentAmount || 0),
            securityDeposit: Number(formData.securityDeposit || 0),
            maintenanceFee: Number(formData.maintenance || 0),
          },
        );

        for (const tenant of unit.tenants) {
          if (tenant.email.trim()) {
            await api.createInvitation(
              session.access_token,
              createdProperty.id,
              {
                inviteeEmail: tenant.email.trim().toLowerCase(),
                unitId: createdUnit.id,
              },
            );
          }
        }
      }

      const uploadPropertyDocument = async (
        file: File,
        type: "PROPERTY_DEED" | "LEASE" | "OTHER",
      ) => {
        const uploadSession = await api.createDocumentUpload(
          session.access_token,
          {
            type,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            propertyId: createdProperty.id,
          },
        );

        await api.uploadDocumentToSignedUrl(
          uploadSession.uploadUrl,
          file,
          file.type || "application/octet-stream",
        );
      };

      if (documentFiles.coverPhoto) {
        await uploadPropertyDocument(documentFiles.coverPhoto, "OTHER");
      }

      if (documentFiles.propertyDeed) {
        await uploadPropertyDocument(
          documentFiles.propertyDeed,
          "PROPERTY_DEED",
        );
      }

      if (documentFiles.rentAgreementTemplate) {
        await uploadPropertyDocument(
          documentFiles.rentAgreementTemplate,
          "LEASE",
        );
      }

      localStorage.removeItem("propertyDraft");
      navigate("/landlord/properties");
    } catch (e) {
      console.error("Error saving property", e);
      alert(`Failed to save property: ${extractApiErrorMessage(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError(null); // clear validation error on input
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle flex gap-3">
              <span className="material-symbols-outlined text-primary">
                info
              </span>
              <div className="text-sm text-text-primary">
                <p className="font-bold">Getting Started</p>
                <p className="text-xs opacity-80 mt-1">
                  Provide the basic location and details. Your draft is
                  auto-saved as you proceed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Property Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.propertyName}
                onChange={(e) =>
                  handleInputChange("propertyName", e.target.value)
                }
                placeholder="e.g. Sunrise Apartments"
                className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Property Type
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) =>
                  handleInputChange("propertyType", e.target.value)
                }
                className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option>Apartment</option>
                <option>Independent House</option>
                <option>PG / Hostel</option>
                <option>Commercial</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-text-primary">
                  Full Address <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  Choose on Map
                </button>
              </div>

              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street Address, Area"
                className="w-full p-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary">
                  City <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary">
                  Pincode <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                State <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-text-primary">
                Ownership Type
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 p-3 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${formData.ownership === "Self-Owned" ? "border-primary bg-primary/5 text-primary" : "border-border-subtle text-text-secondary"}`}
                >
                  <input
                    type="radio"
                    name="ownership"
                    className="hidden"
                    checked={formData.ownership === "Self-Owned"}
                    onChange={() =>
                      handleInputChange("ownership", "Self-Owned")
                    }
                  />
                  <span className="material-symbols-outlined text-lg">
                    person
                  </span>
                  <span className="text-sm font-bold">Self-Owned</span>
                </label>
                <label
                  className={`flex-1 p-3 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${formData.ownership === "Managed" ? "border-primary bg-primary/5 text-primary" : "border-border-subtle text-text-secondary"}`}
                >
                  <input
                    type="radio"
                    name="ownership"
                    className="hidden"
                    checked={formData.ownership === "Managed"}
                    onChange={() => handleInputChange("ownership", "Managed")}
                  />
                  <span className="material-symbols-outlined text-lg">
                    manage_accounts
                  </span>
                  <span className="text-sm font-bold">Managed</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary">
                  Floors
                </label>
                <input
                  type="number"
                  value={formData.floors}
                  onChange={(e) => handleInputChange("floors", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary">
                  Total Units
                </label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) =>
                    handleInputChange("totalUnits", e.target.value)
                  }
                  className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  domain_add
                </span>
                Configure Units
              </h3>

              {/* Unit Configuration Card */}
              <div className="bg-surface p-5 rounded-2xl space-y-5 border border-border-subtle shadow-sm relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Unit Name / Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempUnit.name}
                    onChange={(e) => {
                      setTempUnit({ ...tempUnit, name: e.target.value });
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder="e.g. Unit 101, Penthouse, Room A"
                    className={`w-full h-11 px-4 rounded-xl border bg-surface-subtle text-text-primary text-sm outline-none focus:ring-2 transition-all ${
                      nameError
                        ? "border-danger ring-2 ring-danger/20"
                        : "border-border-subtle  focus:ring-primary"
                    }`}
                  />
                  {nameError && (
                    <p className="text-xs text-danger font-bold">
                      Please enter a unit name to continue.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">
                      Bedrooms
                    </label>
                    <div className="flex items-center h-10 bg-surface-subtle rounded-xl border border-border-subtle  px-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTempUnit((prev) => ({
                            ...prev,
                            bedrooms: Math.max(0, prev.bedrooms - 1),
                          }))
                        }
                        className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          remove
                        </span>
                      </button>
                      <span className="flex-1 text-center font-bold text-sm text-text-primary">
                        {tempUnit.bedrooms}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTempUnit((prev) => ({
                            ...prev,
                            bedrooms: prev.bedrooms + 1,
                          }))
                        }
                        className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">
                      Bathrooms
                    </label>
                    <div className="flex items-center h-10 bg-surface-subtle rounded-xl border border-border-subtle  px-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTempUnit((prev) => ({
                            ...prev,
                            bathrooms: Math.max(0, prev.bathrooms - 1),
                          }))
                        }
                        className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          remove
                        </span>
                      </button>
                      <span className="flex-1 text-center font-bold text-sm text-text-primary">
                        {tempUnit.bathrooms}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTempUnit((prev) => ({
                            ...prev,
                            bathrooms: prev.bathrooms + 1,
                          }))
                        }
                        className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Max Occupancy
                  </label>
                  <div className="flex items-center h-10 bg-surface-subtle rounded-xl border border-border-subtle  px-2 w-1/2">
                    <button
                      type="button"
                      onClick={() =>
                        setTempUnit((prev) => ({
                          ...prev,
                          occupancy: Math.max(1, prev.occupancy - 1),
                        }))
                      }
                      className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        remove
                      </span>
                    </button>
                    <span className="flex-1 text-center font-bold text-sm text-text-primary">
                      {tempUnit.occupancy}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTempUnit((prev) => ({
                          ...prev,
                          occupancy: prev.occupancy + 1,
                        }))
                      }
                      className="p-1 hover:bg-surface-subtle rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    Furnishing
                  </label>
                  <div className="flex bg-surface-subtle rounded-xl p-1 border border-border-subtle ">
                    {["Unfurnished", "Semi", "Full"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setTempUnit((prev) => ({ ...prev, furnishing: opt }))
                        }
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempUnit.furnishing === opt || (opt === "Semi" && tempUnit.furnishing === "Semi-Furnished") ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-surface-subtle"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenants Section */}
                <div className="border-t border-border-subtle  pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-text-secondary uppercase">
                      Current Tenants (Optional)
                    </label>
                    <span className="text-[10px] font-bold bg-surface-subtle px-2 py-0.5 rounded text-text-secondary">
                      {tempUnit.tenants.length} Added
                    </span>
                  </div>

                  {tempUnit.tenants.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {tempUnit.tenants.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between bg-surface-subtle p-3 rounded-xl border border-border-subtle/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-text-primary leading-tight">
                                {t.name}
                              </p>
                              <p className="text-[10px] text-text-secondary">
                                {t.email}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTenantFromUnit(t.id)}
                            className="text-text-secondary hover:text-danger transition-colors p-1"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempTenant.name}
                      onChange={(e) =>
                        setTempTenant((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Tenant Name"
                      className="flex-1 h-10 px-3 rounded-xl border border-border-subtle  bg-surface-subtle text-xs outline-none focus:ring-1 focus:ring-primary text-text-primary"
                    />
                    <input
                      type="email"
                      value={tempTenant.email}
                      onChange={(e) =>
                        setTempTenant((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Email Address"
                      className="flex-1 h-10 px-3 rounded-xl border border-border-subtle  bg-surface-subtle text-xs outline-none focus:ring-1 focus:ring-primary text-text-primary"
                    />
                    <button
                      type="button"
                      onClick={addTenantToUnit}
                      disabled={!tempTenant.name || !tempTenant.email}
                      className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">
                        person_add
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addUnit}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-all shadow-lg ${
                    showSuccess
                      ? "bg-success text-white shadow-base"
                      : "bg-text-primary text-white hover:opacity-90 shadow-base"
                  }`}
                >
                  {showSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        check_circle
                      </span>
                      Added Successfully!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        add_circle
                      </span>
                      Add This Unit
                    </>
                  )}
                </button>
              </div>

              {/* Added Units Summary List */}
              {(formData.units || []).length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                      Added Units ({formData.units.length})
                    </p>
                    {formData.units.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, units: [] }))
                        }
                        className="text-[10px] font-bold text-danger hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {formData.units.map((unit, index) => (
                    <div
                      key={unit.id}
                      className="group relative bg-surface rounded-xl p-4 border border-border-subtle  shadow-sm transition-all hover:border-primary/30 animate-fadeIn"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text-primary">
                              {unit.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">
                                  bed
                                </span>{" "}
                                {unit.bedrooms}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">
                                  bathtub
                                </span>{" "}
                                {unit.bathrooms}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">
                                  group
                                </span>{" "}
                                {unit.occupancy}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUnit(unit.id)}
                          className="text-text-secondary hover:text-danger transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>

                      {/* Show tenants summary if any */}
                      {unit.tenants.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-subtle  flex flex-wrap gap-2">
                          {unit.tenants.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 bg-primary/5 text-primary text-[10px] font-bold px-2 py-1 rounded-md"
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                person
                              </span>
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Monthly Rent (per unit) <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) =>
                    handleInputChange("rentAmount", e.target.value)
                  }
                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Security Deposit
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) =>
                    handleInputChange("securityDeposit", e.target.value)
                  }
                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Maintenance Charges
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.maintenance}
                  onChange={(e) =>
                    handleInputChange("maintenance", e.target.value)
                  }
                  placeholder="0"
                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">
                Rent Due Date
              </label>
              <select
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                    {i + 1 === 1
                      ? "st"
                      : i + 1 === 2
                        ? "nd"
                        : i + 1 === 3
                          ? "rd"
                          : "th"}{" "}
                    of the month
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-text-primary">
                Accepted Payment Methods
              </label>
              <div className="flex flex-wrap gap-3">
                {["UPI", "Bank Transfer", "Cash"].map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 p-3 bg-surface border border-border-subtle rounded-xl cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                      defaultChecked={method !== "Cash"}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-sm text-text-secondary mb-2">
              Select all amenities available at the property.
            </p>
            {[
              {
                id: "parking",
                label: "Parking Available",
                icon: "local_parking",
              },
              { id: "powerBackup", label: "Power Backup", icon: "bolt" },
              { id: "wifi", label: "Internet / Wi-Fi", icon: "wifi" },
              { id: "lift", label: "Lift / Elevator", icon: "elevator" },
              { id: "security", label: "24/7 Security", icon: "security" },
              {
                id: "gym",
                label: "Gym / Fitness Center",
                icon: "fitness_center",
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between p-4 bg-surface border border-border-subtle rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-secondary">
                      {item.icon}
                    </span>
                  </div>
                  <span className="font-bold text-text-primary">
                    {item.label}
                  </span>
                </div>
                <Switch
                  checked={Boolean((formData as any)[item.id])}
                  onCheckedChange={(checked) =>
                    handleInputChange(item.id, checked)
                  }
                  aria-label={item.label}
                />
              </label>
            ))}

            <div className="space-y-2 mt-4">
              <label className="text-sm font-bold text-text-primary">
                Water Supply
              </label>
              <select
                value={formData.waterSupply}
                onChange={(e) =>
                  handleInputChange("waterSupply", e.target.value)
                }
                className="w-full h-12 px-4 rounded-xl border border-border-subtle bg-surface text-text-primary outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option>Corporation</option>
                <option>Borewell</option>
                <option>Both</option>
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-base font-bold text-text-primary mb-2">
              Tenant Settings
            </h3>
            {[
              {
                id: "partialPayments",
                label: "Allow Partial Payments",
                desc: "Tenants can pay rent in installments",
              },
              {
                id: "allowCash",
                label: "Allow Cash Recording",
                desc: "Tenants can mark cash payments in app",
              },
              {
                id: "cashApproval",
                label: "Require Approval for Cash",
                desc: "You must verify cash payments",
              },
              {
                id: "autoReminders",
                label: "Automatic Rent Reminders",
                desc: "Send notifications 3 days before due date",
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-4 bg-surface border border-border-subtle rounded-xl cursor-pointer"
              >
                <Switch
                  className="mt-0.5"
                  checked={Boolean((formData as any)[item.id])}
                  onCheckedChange={(checked) =>
                    handleInputChange(item.id, checked)
                  }
                  aria-label={item.label}
                />
                <div>
                  <p className="font-bold text-text-primary text-sm">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-3">
              <label className="text-sm font-bold text-text-primary">
                Property Photos
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => coverPhotoInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-3xl text-primary">
                    add_a_photo
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {documentFiles.coverPhoto ? "Change Cover" : "Upload Cover"}
                  </span>
                </button>
                <input
                  ref={coverPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverPhotoSelect}
                />
                {documentFiles.coverPhotoPreviewUrl ? (
                  <div className="aspect-square rounded-2xl overflow-hidden border border-border-subtle">
                    <img
                      src={documentFiles.coverPhotoPreviewUrl}
                      alt="Property cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl bg-surface-subtle flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-secondary text-3xl">
                      image
                    </span>
                  </div>
                )}
              </div>
              {documentFiles.coverPhoto && (
                <p className="text-xs text-text-secondary">
                  Selected: {documentFiles.coverPhoto.name}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-text-primary">
                Legal Documents
              </label>
              <div className="border border-border-subtle rounded-xl p-4 bg-surface">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center">
                      <span className="material-symbols-outlined text-danger">
                        description
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        Property Deed
                      </p>
                      <p className="text-xs text-text-secondary">
                        PDF • Optional
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => propertyDeedInputRef.current?.click()}
                    className="text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-lg"
                  >
                    {documentFiles.propertyDeed ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={propertyDeedInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => handlePdfSelect(event, "propertyDeed")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center">
                      <span className="material-symbols-outlined text-info">
                        contract
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        Rent Agreement Template
                      </p>
                      <p className="text-xs text-text-secondary">
                        PDF • Optional
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => rentTemplateInputRef.current?.click()}
                    className="text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-lg"
                  >
                    {documentFiles.rentAgreementTemplate ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={rentTemplateInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) =>
                      handlePdfSelect(event, "rentAgreementTemplate")
                    }
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <p
                    className={`text-xs ${
                      documentFiles.propertyDeed
                        ? "text-success"
                        : "text-text-secondary"
                    }`}
                  >
                    Property Deed:{" "}
                    {documentFiles.propertyDeed
                      ? documentFiles.propertyDeed.name
                      : "Optional PDF not selected"}
                  </p>
                  {documentFiles.rentAgreementTemplate && (
                    <p className="text-xs text-text-secondary">
                      Rent Agreement Template:{" "}
                      {documentFiles.rentAgreementTemplate.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle flex gap-3 mt-4">
              <span className="material-symbols-outlined text-primary">
                info
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                By submitting, you confirm that you are the authorized owner or
                manager of this property and all details provided are accurate.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#1e293b] font-sans selection:bg-[#FF9A3D]/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/40 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="text-slate-500 hover:bg-white/60 hover:text-[#1e293b] rounded-full p-2 flex items-center justify-center transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-base font-black text-[#1e293b] tracking-tight">
              Add New Property
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {steps[currentStep - 1]}
            </p>
          </div>
          <button
            id="save-draft-btn"
            onClick={handleManualSave}
            disabled={isSubmitting}
            className="text-[#FF7A00] font-bold text-[13px] hover:text-[#FF9A3D] transition-colors w-16 text-right"
          >
            Save
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/40">
          <div
            className="h-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,122,0,0.5)]"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 pb-32 max-w-lg mx-auto w-full motion-page-enter">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight mb-2">
          {steps[currentStep - 1]}
        </h2>
        {lastSaved && (
          <p className="text-[10px] text-slate-500 mb-4 font-bold flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">
              cloud_done
            </span>
            Draft saved{" "}
            {lastSaved.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {validationError && (
          <div className="mb-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] p-3 rounded-xl text-[13px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {validationError}
          </div>
        )}

        {renderStep()}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/40 backdrop-blur-[20px] border-t border-white/40 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] flex gap-4 z-20">
        <div className="max-w-lg mx-auto w-full flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-full font-bold bg-white/60 text-slate-500 shadow-sm border border-white/50 hover:border-[#FF9A3D]/50 hover:text-[#1e293b] transition-colors disabled:opacity-50 text-[14px]"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-full font-bold bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] text-white shadow-[0_8px_30px_rgba(255,122,0,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none text-[14px] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Creating...</span>
              </>
            ) : currentStep === totalSteps ? (
              <>
                <span>Create Property</span>
                <span className="material-symbols-outlined text-[18px]">
                  check
                </span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(addr: ExtractedAddress) => {
          setFormData((prev) => ({
            ...prev,
            address: addr.addressLine1,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
          }));
        }}
      />
    </div>
  );
};

export default AddProperty;

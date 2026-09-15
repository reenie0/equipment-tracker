
import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../api";


const DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media",
];


export default function EditEquipmentModal({
  equipment,
  onClose,
  onUpdated,
}) {

  const { token } = useAuth();


  const [name, setName] =
    useState(
      equipment?.name || ""
    );


  const [category, setCategory] =
    useState(
      equipment?.category || ""
    );


  const [categories, setCategories] =
    useState([]);


  const [loadingCategories, setLoadingCategories] =
    useState(true);


  const [serialNumber, setSerialNumber] =
    useState(
      equipment?.serial_number || ""
    );


  const [department, setDepartment] =
    useState(
      equipment?.department || ""
    );


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  useEffect(() => {

    let mounted = true;


    const loadCategories = async () => {

      setLoadingCategories(true);


      try {

        const result =
          await api.listCategories(token);


        if (mounted) {

          setCategories(
            result.categories || []
          );

        }

      } catch (err) {

        if (mounted) {

          setError(
            err?.message ||
            "Unable to load categories."
          );

        }

      } finally {

        if (mounted) {
          setLoadingCategories(false);
        }

      }

    };


    if (token) {
      loadCategories();
    }


    return () => {
      mounted = false;
    };

  }, [token]);


  // ==================================================
  // UPDATE FORM WHEN EQUIPMENT CHANGES
  // ==================================================

  useEffect(() => {

    if (!equipment) return;


    setName(
      equipment.name || ""
    );


    setCategory(
      equipment.category || ""
    );


    setSerialNumber(
      equipment.serial_number || ""
    );


    setDepartment(
      equipment.department || ""
    );


    setError("");

  }, [equipment]);


  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");


      if (!name.trim()) {

        setError(
          "Equipment name is required."
        );

        return;
      }


      if (!category) {

        setError(
          "Please select a category."
        );

        return;
      }


      if (!department) {

        setError(
          "Please select a department."
        );

        return;
      }


      if (
        (
          department === "IT" ||
          department === "Social Media"
        ) &&
        !serialNumber.trim()
      ) {

        setError(
          "A serial number is required for IT and Social Media equipment."
        );

        return;
      }


      setSaving(true);


      try {

        const result =
          await api.updateEquipment(
            token,
            equipment.id,
            {
              name:
                name.trim(),

              category,

              serial_number:
                serialNumber.trim() ||
                null,

              department,
            }
          );


        onUpdated(
          result.item
        );

        onClose();

      } catch (err) {

        setError(
          err.message ||
          "Unable to update equipment."
        );

      } finally {

        setSaving(false);

      }

    };


  if (!equipment) {
    return null;
  }


  return (

    <div
      className="modal-backdrop"
      onClick={onClose}
    >

      <div
        className="modal edit-equipment-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <p className="eyebrow">
              Equipment
            </p>

            <h3>
              Edit equipment
            </h3>

          </div>


          <button
            className="close-x"
            onClick={onClose}
            type="button"
            disabled={saving}
          >
            ×
          </button>

        </div>


        {/* EQUIPMENT INFORMATION */}

        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 10,
            background:
              "var(--surface-2, rgba(127,127,127,.08))",
          }}
        >

          <div
            style={{
              fontWeight: 700,
            }}
          >
            {equipment.code}
          </div>

          <div
            className="page-sub"
            style={{
              marginTop: 3,
            }}
          >
            Current category:{" "}
            {equipment.category || "—"}
          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="form-stack"
        >


          {/* NAME */}

          <label>

            Equipment name

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Equipment name"
              disabled={saving}
            />

          </label>


          {/* CATEGORY */}

          <label>

            Category

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              disabled={
                saving ||
                loadingCategories
              }
            >

              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select category"}
              </option>


              {categories.map(
                (categoryItem) => (

                  <option
                    key={categoryItem.id}
                    value={categoryItem.name}
                  >
                    {categoryItem.name}
                  </option>

                )
              )}

            </select>

          </label>


          {/* SERIAL NUMBER */}

          <label>

            Serial number

            <input
              type="text"
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(
                  e.target.value
                )
              }
              placeholder="Serial number"
              disabled={saving}
            />

          </label>


          {/* DEPARTMENT */}

          <label>

            Department

            <select
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value
                )
              }
              disabled={saving}
            >

              <option value="">
                Select department
              </option>

              {DEPARTMENTS.map(
                (dept) => (

                  <option
                    key={dept}
                    value={dept}
                  >
                    {dept}
                  </option>

                )
              )}

            </select>

          </label>


          {/* ERROR */}

          {error && (

            <div
              className="form-error"
              style={{
                marginTop: 4,
              }}
            >
              {error}
            </div>

          )}


          {/* ACTIONS */}

          <div className="modal-actions">

            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                saving ||
                loadingCategories
              }
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );
}

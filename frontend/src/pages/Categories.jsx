
import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../api";


export default function Categories() {

  const { token } = useAuth();

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [editingName, setEditingName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  const loadCategories = async () => {

    setLoading(true);
    setError("");

    try {

      const result =
        await api.listCategories(token);

      setCategories(
        result.categories || []
      );

    } catch (err) {

      setError(
        err?.message ||
        "Unable to load categories."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    if (token) {
      loadCategories();
    }

  }, [token]);


  // ==================================================
  // ADD CATEGORY
  // ==================================================

  const handleAdd = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    const categoryName =
      name.trim();

    if (!categoryName) {

      setError(
        "Category name is required."
      );

      return;
    }


    setSaving(true);


    try {

      const result =
        await api.createCategory(
          token,
          categoryName
        );


      setCategories((prev) => [

        ...prev,

        result.category,

      ].sort((a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: "base",
          }
        )
      ));


      setName("");

      setMessage(
        `"${categoryName}" was added successfully.`
      );

    } catch (err) {

      setError(
        err?.message ||
        "Unable to add category."
      );

    } finally {

      setSaving(false);

    }
  };


  // ==================================================
  // START EDITING
  // ==================================================

  const startEditing = (category) => {

    setEditingId(category.id);

    setEditingName(
      category.name
    );

    setError("");
    setMessage("");
  };


  // ==================================================
  // CANCEL EDIT
  // ==================================================

  const cancelEditing = () => {

    setEditingId(null);

    setEditingName("");

  };


  // ==================================================
  // SAVE CATEGORY NAME
  // ==================================================

  const saveEdit = async (category) => {

    setError("");
    setMessage("");

    const newName =
      editingName.trim();


    if (!newName) {

      setError(
        "Category name is required."
      );

      return;
    }


    setSaving(true);


    try {

      const result =
        await api.updateCategory(
          token,
          category.id,
          newName
        );


      setCategories((prev) =>

        prev
          .map((item) =>
            item.id === category.id
              ? result.category
              : item
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              undefined,
              {
                sensitivity: "base",
              }
            )
          )

      );


      setEditingId(null);
      setEditingName("");

      setMessage(
        `"${category.name}" was renamed to "${newName}".`
      );

    } catch (err) {

      setError(
        err?.message ||
        "Unable to update category."
      );

    } finally {

      setSaving(false);

    }
  };


  // ==================================================
  // DELETE CATEGORY
  // ==================================================

  const handleDelete = async (category) => {

    setError("");
    setMessage("");


    const confirmed =
      window.confirm(
        `Delete "${category.name}"?`
      );


    if (!confirmed) {
      return;
    }


    setSaving(true);


    try {

      await api.deleteCategory(
        token,
        category.id
      );


      setCategories((prev) =>
        prev.filter(
          (item) =>
            item.id !== category.id
        )
      );


      setMessage(
        `"${category.name}" was deleted successfully.`
      );

    } catch (err) {

      setError(
        err?.message ||
        "Unable to delete category."
      );

    } finally {

      setSaving(false);

    }
  };


  return (

    <main className="page">

      <div className="page-header">

        <div>

          <p className="eyebrow">
            Equipment
          </p>

          <h1>
            Category Management
          </h1>

          <p className="page-sub">
            Manage the categories used for
            equipment.
          </p>

        </div>

      </div>


      {/* ==================================================
          ADD CATEGORY
      ================================================== */}

      <section
        className="card"
        style={{
          marginBottom: 24,
        }}
      >

        <div
          style={{
            marginBottom: 16,
          }}
        >

          <h3>
            Add category
          </h3>

          <p className="page-sub">
            Create a new category for
            equipment.
          </p>

        </div>


        <form
          onSubmit={handleAdd}
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Cameras"
            disabled={saving}
            style={{
              flex: "1 1 280px",
              minWidth: 220,
            }}
          />


          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Add category"}
          </button>

        </form>

      </section>


      {/* ==================================================
          MESSAGES
      ================================================== */}

      {error && (

        <div
          className="form-error"
          style={{
            marginBottom: 18,
          }}
        >
          {error}
        </div>

      )}


      {message && (

        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 10,
            background:
              "var(--surface-2, rgba(127,127,127,.08))",
          }}
        >
          {message}
        </div>

      )}


      {/* ==================================================
          CATEGORY LIST
      ================================================== */}

      <section className="card">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >

          <div>

            <h3>
              Categories
            </h3>

            <p className="page-sub">
              {categories.length} categor
              {categories.length === 1
                ? "y"
                : "ies"}
            </p>

          </div>


          <button
            type="button"
            className="btn"
            onClick={loadCategories}
            disabled={loading || saving}
          >
            Refresh
          </button>

        </div>


        {loading ? (

          <div className="page-sub">
            Loading categories...
          </div>

        ) : categories.length === 0 ? (

          <div className="page-sub">
            No categories found.
          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >

            {categories.map(
              (category) => (

                <div
                  key={category.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                    padding:
                      "14px 16px",
                    borderRadius: 10,
                    background:
                      "var(--surface-2, rgba(127,127,127,.06))",
                    flexWrap: "wrap",
                  }}
                >

                  {editingId ===
                  category.id ? (

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flex: "1 1 320px",
                        alignItems:
                          "center",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <input
                        type="text"
                        value={
                          editingName
                        }
                        onChange={(e) =>
                          setEditingName(
                            e.target.value
                          )
                        }
                        disabled={saving}
                        autoFocus
                        style={{
                          flex:
                            "1 1 220px",
                        }}
                      />


                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          saveEdit(
                            category
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        Save
                      </button>


                      <button
                        type="button"
                        className="btn"
                        onClick={
                          cancelEditing
                        }
                        disabled={
                          saving
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <div>

                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {category.name}
                      </div>

                      <div
                        className="page-sub"
                        style={{
                          marginTop: 3,
                        }}
                      >
                        {Number(
                          category.equipment_count ||
                          0
                        )}{" "}
                        equipment item
                        {Number(
                          category.equipment_count ||
                          0
                        ) === 1
                          ? ""
                          : "s"}
                      </div>

                    </div>

                  )}


                  {editingId !==
                    category.id && (

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >

                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          startEditing(
                            category
                          )
                        }
                        disabled={saving}
                      >
                        Edit
                      </button>


                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          handleDelete(
                            category
                          )
                        }
                        disabled={
                          saving ||
                          Number(
                            category.equipment_count ||
                            0
                          ) > 0
                        }
                        title={
                          Number(
                            category.equipment_count ||
                            0
                          ) > 0
                            ? "This category is being used by equipment and cannot be deleted."
                            : "Delete category"
                        }
                      >
                        Delete
                      </button>

                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

      </section>

    </main>

  );
}

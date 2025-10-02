import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { downloadCSV, uploadList } from "../utils/listFunctions";

export default function Lista({ placeId }) {
  const [items, setItems] = useState([]);
  const [placeInfo, setPlaceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    setStatus("");

    const loadPlace = async () => {
      try {
        const pRef = doc(db, "places", placeId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) setPlaceInfo({ id: placeId, ...pSnap.data() });
        else setPlaceInfo(null);
      } catch (err) {
        setStatus("Error cargando place: " + err.message);
      }
    };

    loadPlace();

    const q = query(collection(db, "places", placeId, "lista"), orderBy("codigo"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(arr);
        setLoading(false);
      },
      (err) => {
        setStatus("Error cargando lista: " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [placeId]);

  const nextSequentialCode = () => {
    const nums = items
      .map((it) => it.codigo)
      .filter((c) => typeof c === "string" && c.startsWith(placeId))
      .map((c) => c.slice(placeId.length))
      .map((s) => parseInt(s, 10) || 0);

    const max = nums.length ? Math.max(...nums) : 0;
    return placeId + (max + 1).toString().padStart(4, "0");
  };

  const handleSavePlace = async () => {
    if (!placeInfo) return;
    try {
      const pRef = doc(db, "places", placeId);
      await updateDoc(pRef, {
        nombre: placeInfo.nombre || "",
        telefono: placeInfo.telefono || "",
        direccion: placeInfo.direccion || "",
        poblacion: placeInfo.poblacion || "",
      });
      setStatus("Cabecera guardada");
    } catch (err) {
      setStatus("Error guardando cabecera: " + err.message);
    }
  };

  const handleSaveItem = async (item) => {
    try {
      const docRef = doc(db, "places", placeId, "lista", item.id);
      await setDoc(
        docRef,
        {
          codigo: item.codigo,
          tipo: item.tipo,
          nombre: item.nombre || "",
          precio:
            item.tipo === "seccion"
              ? null
              : item.precio != null
              ? Number(item.precio)
              : null,
        },
        { merge: true }
      );
      setStatus("Item guardado");
    } catch (err) {
      setStatus("Error guardando item: " + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("¿Borrar este item?")) return;
    try {
      await deleteDoc(doc(db, "places", placeId, "lista", id));
      setStatus("Item borrado");
    } catch (err) {
      setStatus("Error borrando item: " + err.message);
    }
  };

  const handleAddItem = async () => {
    try {
      const newCode = nextSequentialCode();
      const newItem = {
        id: newCode,
        codigo: newCode,
        tipo: "elemento",
        nombre: "",
        precio: null,
      };
      await setDoc(doc(db, "places", placeId, "lista", newCode), newItem);
      setStatus("Item añadido");
    } catch (err) {
      setStatus("Error añadiendo item: " + err.message);
    }
  };

  // Subir CSV desde archivo
  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
      const parsedItems = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i];
        });
        if (obj.precio) obj.precio = Number(obj.precio);
        if (!obj.id) obj.id = obj.codigo;
        return obj;
      });

      try {
        await uploadList(parsedItems, placeId);
        setStatus("CSV subido correctamente!");
      } catch (err) {
        setStatus("Error subiendo CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <p>Cargando items...</p>;

  return (
    <div className="mt-6">
      {status && <div className="mb-4 text-sm text-gray-600 bg-gray-100 p-2 rounded">{status}</div>}

      {placeInfo ? (
        <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Cabecera del place</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              className="border rounded p-2"
              placeholder="Nombre"
              value={placeInfo.nombre || ""}
              onChange={(e) => setPlaceInfo({ ...placeInfo, nombre: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Teléfono"
              value={placeInfo.telefono || ""}
              onChange={(e) => setPlaceInfo({ ...placeInfo, telefono: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Dirección"
              value={placeInfo.direccion || ""}
              onChange={(e) => setPlaceInfo({ ...placeInfo, direccion: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Población"
              value={placeInfo.poblacion || ""}
              onChange={(e) => setPlaceInfo({ ...placeInfo, poblacion: e.target.value })}
            />
          </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={handleSavePlace}
          >
            💾 Guardar Cabecera
          </button>
        </div>
      ) : (
        <p>Place no encontrado</p>
      )}

      <div className="flex gap-2 mb-4">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          onClick={handleAddItem}
        >
          ➕ Añadir item
        </button>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          onClick={() => downloadCSV(items)}
        >
          Download Lista
        </button>

        <label className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">
          Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleUploadCSV}
            className="hidden"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-indigo-100">
            <tr>
              <th className="px-4 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Precio</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="border-t px-4 py-2">{it.codigo}</td>
                <td className="border-t px-4 py-2">
                  <select
                    className="border rounded p-1"
                    value={it.tipo || "elemento"}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], tipo: e.target.value };
                      setItems(updated);
                    }}
                  >
                    <option value="seccion">seccion</option>
                    <option value="elemento">elemento</option>
                  </select>
                </td>
                <td className="border-t px-4 py-2">
                  <input
                    className="border rounded p-1 w-full"
                    value={it.nombre || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], nombre: e.target.value };
                      setItems(updated);
                    }}
                  />
                </td>
                <td className="border-t px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded p-1 w-full"
                    disabled={it.tipo === "seccion"}
                    value={it.precio == null ? "" : it.precio}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = {
                        ...updated[idx],
                        precio:
                          e.target.value === "" ? null : Number(e.target.value),
                      };
                      setItems(updated);
                    }}
                  />
                </td>
                <td className="border-t px-4 py-2 flex gap-2">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                    onClick={() => handleSaveItem(it)}
                  >
                    💾
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                    onClick={() => handleDeleteItem(it.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Lista from "./components/Lista";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [place, setPlace] = useState(null);
  const [placeId, setPlaceId] = useState(null);

  useEffect(() => {
    auth.signOut();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setPlace(null);
      setPlaceId(null);

      if (u) {
        try {
          const userRef = doc(db, "usuarios", u.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const pid = userSnap.data().placeId;
            setPlaceId(pid);

            const placeRef = doc(db, "places", pid);
            const placeSnap = await getDoc(placeRef);

            if (placeSnap.exists()) {
              setPlace(placeSnap.data());
            } else {
              setStatus("Place no encontrado");
            }
          } else {
            setStatus("Usuario sin place asignado");
          }
        } catch (err) {
          setStatus("Error: " + err.message);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("¡Login correcto!");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStatus("Desconectado");
    setPlace(null);
    setPlaceId(null);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-indigo-600 mb-6">Login</h2>
          <input
            className="w-full border rounded-lg p-2 mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border rounded-lg p-2 mb-4"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            onClick={handleLogin}
          >
            Entrar
          </button>
          {status && <p className="mt-4 text-sm text-red-600">{status}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-indigo-600">
          Bienvenido, {user.email}
        </h2>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      {status && <p className="mb-4 text-gray-600">{status}</p>}

      {place ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{place.nombre}</h3>
          <p className="mb-4 text-gray-600">Teléfono: {place.telefono}</p>
          {placeId && <Lista placeId={placeId} />}
        </div>
      ) : (
        <p>Cargando place...</p>
      )}
    </div>
  );
}

export default App;
